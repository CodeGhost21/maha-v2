import axios from 'axios'
import { BlastUserPhase2 } from '../../database/models/blastUsersPhase2';

interface User {
    id: string;
    debt: string;
    balance: string;
    accumulatedPoints: string;
    lastUpdatedAt: number;
}

interface Core {
    totalPointsUSDB: string;
    id: string;
    totalPointsWETH: string;
}

interface ResponseData {
    wethusers: User[];
    usdbusers: User[];
    core: Core;
}

const calculateAccumulatedPoints = (
    balance: string,
    debt: string,
    lastUpdatedAt: number,
    accumulatedPoints: string,
    totalPoints: string
): Number => {
    const percentage = 100000000;
    const currentPointsAccumulated =
        BigInt(balance) -
        BigInt(debt) * BigInt(Date.now() - lastUpdatedAt);

    const usdbPointsEarnedPercentage = Number(
        ((BigInt(accumulatedPoints) + currentPointsAccumulated) *
            BigInt(percentage)) /
        BigInt(totalPoints)
    );

    if (usdbPointsEarnedPercentage > 0) {
        const pointsEarned =
            Number(usdbPointsEarnedPercentage * Number(totalPoints)) / percentage;
        return pointsEarned
    }
    return 0;
};


const blastPointsGraphData = async (condition: string) => {
    console.log(condition);

    const queryURL = 'https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/zerolend-blast-points/1.0.2/gn'
    const query = `query {
        wethusers(${condition}) {
          id
          debt
          balance
          accumulatedPoints
          lastUpdatedAt
        }
        usdbusers(${condition}) {
            id
            debt
            balance
            accumulatedPoints
            lastUpdatedAt
          }
        core(id: "1") {
          totalPointsUSDB
          id
          totalPointsWETH
        }
      }`
    const response: any = await axios.post<{ data: ResponseData }>(queryURL, { query });
    return response.data.data
}

const getPointsTillNow = async (users: any) => {
    const pointsEarnedMap = new Map();

    const handleUsers = (users: User[], totalPoints: string, keyPrefix: string) => {
        return users.map((user: User) => {
            const pointsAccumulated = calculateAccumulatedPoints(user.balance, user.debt, user.lastUpdatedAt, user.accumulatedPoints, totalPoints);
            const existingData = pointsEarnedMap.get(user.id) || {};
            pointsEarnedMap.set(user.id, { ...existingData, [`${keyPrefix}Points`]: pointsAccumulated });
        });
    };

    // // previous points this will run only once
    // const previousData = await blastPointsGraphData(`where: {id_in: [${users}]}, first:1000,block: {number:5100000}`);
    // await Promise.all([
    //     ...handleUsers(previousData.wethusers, previousData.core.totalPointsWETH, 'wethPrevious'),
    //     ...handleUsers(previousData.usdbusers, previousData.core.totalPointsWETH, 'usdbPrevious')
    // ]);

    // current points
    const currentData = await blastPointsGraphData(`where: {id_in: [${users}]}, first:1000`);
    await Promise.all([
        ...handleUsers(currentData.wethusers, currentData.core.totalPointsUSDB, 'wethCurrent'),
        ...handleUsers(currentData.usdbusers, currentData.core.totalPointsWETH, 'usdbCurrent')
    ]);
    return pointsEarnedMap
};

export const saveBlastUsers = async () => {
    const first = 1000;
    let batch;
    let lastAddress = "0x0000000000000000000000000000000000000000";
    const queryURL =
        "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";
    let count = 0
    do {
        const bulkwrite = []
        const graphQuery = `query {
            users(where: {id_gt: "${lastAddress}"}, first: ${first}) {
                id
            }
        }`;

        const headers = {
            "Content-Type": "application/json",
        };

        try {
            batch = await axios.post(queryURL, { query: graphQuery }, { headers });
        } catch (error: any) {
            console.log("error occurred", error.message);
            throw error;
        }
        count += batch.data.data.users.length
        console.log('no of blast users', count);

        const userBatch = batch.data.data.users;
        const users = userBatch.map((u: any) => `"${u.id}"`).join(",");
        const response = await getPointsTillNow(users)

        for (const [walletAddress, share] of response) {
            const previousUserData: any = await BlastUserPhase2.findOne({ walletAddress: walletAddress })
            bulkwrite.push({
                updateOne: {
                    filter: { walletAddress },
                    update: {
                        $set: {
                            [`blastPoints.pointsTillNowUSDB`]: share.usdbCurrentPoints ?? 0,
                            [`blastPoints.pointsTillNowWETH`]: share.wethCurrentPoints ?? 0,
                            [`blastPoints.pointsPendingUSDB`]: Number(share.usdbCurrentPoints ?? 0) - previousUserData?.blastPoints.pointsGivenUSDB ?? 0,
                            [`blastPoints.pointsPendingWETH`]: Number(share.wethCurrentPoints ?? 0) - previousUserData?.blastPoints.pointsGivenWETH ?? 0,
                        },
                    },
                    upsert: true, // creates new user if walletAddress is not found
                },
            });
        }
        BlastUserPhase2.bulkWrite(bulkwrite)
        lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
        console.log("executed blast-points for batch. last address", lastAddress);
    } while (batch.data.data.users.length === first);
    console.log('done');
}