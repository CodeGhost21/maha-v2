import axios from "axios";
import { BlastUserPhase2 } from "../../database/models/blastUsersPhase2";
import { BlastData, getBearerToken, getBlastChallenge } from "./blast";
import { BlastBatches } from "../../database/models/blastBatches";
import assert from "assert";
import { User, ResponseData } from "../interface/blast";
import { blastApiBaseURL } from "./constants";

const calculateAccumulatedPoints = (
  balance: string,
  debt: string,
  lastUpdatedAt: number,
  accumulatedPoints: string,
  totalPoints: string
): number => {
  const percentage = 100000000;
  const currentPointsAccumulated =
    BigInt(balance) - BigInt(debt) * BigInt(Date.now() - lastUpdatedAt);

  const usdbPointsEarnedPercentage = Number(
    ((BigInt(accumulatedPoints) + currentPointsAccumulated) *
      BigInt(percentage)) /
    BigInt(totalPoints)
  );

  if (usdbPointsEarnedPercentage > 0) {
    const pointsEarned =
      Number(usdbPointsEarnedPercentage * Number(totalPoints)) / percentage;
    return pointsEarned;
  }
  return 0;
};

const blastPointsGraphData = async (condition: string) => {
  // console.log(condition);

  const queryURL =
    "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/zerolend-blast-points/1.0.2/gn";
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
      }`;
  const response: any = await axios.post<{ data: ResponseData }>(queryURL, {
    query,
  });
  return response.data.data;
};

const getPointsTillNow = async (users: any) => {
  const pointsEarnedMap = new Map();

  const handleUsers = (
    users: User[],
    totalPoints: string,
    keyPrefix: string
  ) => {
    return users.map((user: User) => {
      const sharesAccumulated = calculateAccumulatedPoints(
        user.balance,
        user.debt,
        user.lastUpdatedAt,
        user.accumulatedPoints,
        totalPoints
      );
      const existingData = pointsEarnedMap.get(user.id) || {};
      pointsEarnedMap.set(user.id, {
        ...existingData,
        [`${keyPrefix}Shares`]: sharesAccumulated,
      });
    });
  };

  // previous points this will run only once
  const previousData = await blastPointsGraphData(
    `where: {id_in: [${users}]}, first:1000,block: {number:5100000}`
  );
  await Promise.all([
    ...handleUsers(
      previousData.wethusers,
      previousData.core.totalPointsWETH,
      "wethPrevious"
    ),
    ...handleUsers(
      previousData.usdbusers,
      previousData.core.totalPointsWETH,
      "usdbPrevious"
    ),
  ]);

  // current points
  const currentData = await blastPointsGraphData(
    `where: {id_in: [${users}]}, first:1000`
  );
  await Promise.all([
    ...handleUsers(
      currentData.wethusers,
      currentData.core.totalPointsUSDB,
      "wethCurrent"
    ),
    ...handleUsers(
      currentData.usdbusers,
      currentData.core.totalPointsWETH,
      "usdbCurrent"
    ),
  ]);
  return pointsEarnedMap;
};

const saveBlastUserShares = async () => {
  const first = 1000;
  let batch;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  const queryURL =
    "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";
  let count = 0;
  do {
    const bulkwrite: any = [];
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
    count += batch.data.data.users.length;
    console.log("no of blast users", count);

    const userBatch = batch.data.data.users;
    const users = userBatch.map((u: any) => `"${u.id}"`).join(",");
    const response = await getPointsTillNow(users);

    for (const [walletAddress, share] of response) {
      bulkwrite.push({
        updateOne: {
          filter: { walletAddress },
          update: {
            $set: {
              [`blastPoints.sharesTillNowUSDB`]: share.usdbCurrentShares ?? 0,
              [`blastPoints.sharesTillNowWETH`]: share.wethCurrentShares ?? 0,
              [`blastPoints.sharesPreviousUSDB`]: share.usdbPreviousShares ?? 0,
              [`blastPoints.sharesPreviousWETH`]: share.wethPreviousShares ?? 0,
              [`blastPoints.sharesPendingUSDB`]: Math.max(
                0,
                Number(share.usdbCurrentShares ?? 0) -
                Number(share.usdbPreviousShares ?? 0)
              ),
              [`blastPoints.sharesPendingWETH`]: Math.max(
                0,
                Number(share.wethCurrentShares ?? 0) -
                Number(share.wethPreviousShares ?? 0)
              ),
            },
          },
          upsert: true, // creates new user if walletAddress is not found
        },
      });
    }

    await BlastUserPhase2.bulkWrite(bulkwrite);
    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
    console.log("executed blast-points for batch. last address", lastAddress);
  } while (batch.data.data.users.length === first);
  console.log("done");
};

const saveBlastUserPoints = async () => {
  const blastPoints = await BlastData();
  const usdbPointsTotal: number = blastPoints.blastUSDB;
  const wethPointsTotal: number = blastPoints.blastWETH;

  const totalPendingSharesUSDB = await BlastUserPhase2.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$blastPoints.sharesPendingUSDB" },
      },
    },
  ]);

  const totalPendingSharesWETH = await BlastUserPhase2.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$blastPoints.sharesPendingWETH" },
      },
    },
  ]);

  const blastUsersPending = await BlastUserPhase2.find({
    $or: [
      { "blastPoints.sharesPendingUSDB": { $gt: 0 } },
      { "blastPoints.sharesPendingWETH": { $gt: 0 } },
    ],
  });

  const writes = blastUsersPending.map((u) => {
    return {
      updateOne: {
        filter: { walletAddress: u.walletAddress },
        update: {
          $set: {
            [`blastPoints.pointsEarnedUSDB`]:
              (u.blastPoints.sharesPendingUSDB /
                totalPendingSharesUSDB[0].total) *
              usdbPointsTotal,
            [`blastPoints.pointsEarnedWETH`]:
              (u.blastPoints.sharesPendingWETH /
                totalPendingSharesWETH[0].total) *
              wethPointsTotal,
          },
        },
      },
    };
  });

  await BlastUserPhase2.bulkWrite(writes);
  console.log("finished point calculation");
};

const createBlastBatches = async () => {
  const batchId = Math.floor(Date.now() / 1000 / 86400);

  const blastUsersEarned = await BlastUserPhase2.find({
    $or: [
      { "blastPoints.pointsEarnedWETH": { $gt: 0 } },
      { "blastPoints.pointsEarnedUSDB": { $gt: 0 } },
    ],
  });

  const blastUsersPending = blastUsersEarned.map((u) => {
    return {
      walletAddress: u.walletAddress,
      pointsPendingWETH:
        u.blastPoints.pointsEarnedWETH - (u.blastPoints.pointsGivenWETH || 0),
      pointsPendingUSDB:
        u.blastPoints.pointsEarnedUSDB - (u.blastPoints.pointsGivenUSDB || 0),
    };
  });

  // saving batch
  await BlastBatches.bulkWrite([
    {
      updateOne: {
        filter: { batchId: `${batchId}_usdb` },
        update: {
          $set: {
            batch: blastUsersPending
              .filter((u) => u.pointsPendingUSDB > 0)
              .map((u) => {
                return {
                  toAddress: u.walletAddress,
                  points: u.pointsPendingUSDB.toFixed(2),
                };
              }),
          },
        },
        upsert: true, // creates new user if walletAddress is not found
      },
    },
    {
      updateOne: {
        filter: { batchId: `${batchId}_weth` },
        update: {
          $set: {
            batch: blastUsersPending
              .filter((u) => u.pointsPendingWETH > 0)
              .map((u) => {
                return {
                  toAddress: u.walletAddress,
                  points: u.pointsPendingWETH.toFixed(2),
                };
              }),
          },
        },
        upsert: true, // creates new user if walletAddress is not found
      },
    },
  ]);

  console.log("finished preparing batches");
};

const executeBlastBatches = async () => {
  const batchId = Math.floor(Date.now() / 1000 / 86400);

  const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";

  const challengeUSDB = await getBlastChallenge(addressUSDB);
  const challengeWETH = await getBlastChallenge(addressWETH);
  const tokenUSDB = await getBearerToken(challengeUSDB);
  const tokenWETH = await getBearerToken(challengeWETH);

  const batchUSDB = await BlastBatches.findOne({
    batchId: `${batchId}_usdb`,
  });

  const batchWETH = await BlastBatches.findOne({
    batchId: `${batchId}_weth`,
  });

  const blastPoints = await BlastData();

  const usdbPointsToGive =
    batchUSDB?.batch.map((u) => Number(u.points)).reduce((a, b) => a + b, 0) ||
    0;
  const wethPointsToGive =
    batchWETH?.batch.map((u) => Number(u.points)).reduce((a, b) => a + b, 0) ||
    0;

  assert(
    blastPoints.blastUSDB > usdbPointsToGive,
    "not enough usdb points to give"
  );
  assert(
    blastPoints.blastWETH > wethPointsToGive,
    "not enough weth points to give"
  );

  if (batchUSDB && !batchUSDB.executed) {
    const subbatchesCount = batchUSDB.batch.length / 2000;
    for (let i = 0; i < subbatchesCount; i++) {
      const urlUSDB = `${blastApiBaseURL}/v1/contracts/${addressUSDB}/batches/${batchId}_usdb_${i}`;
      const responseUSDB = await axios.put(
        urlUSDB,
        {
          pointType: "PHASE2_POINTS",
          transfers:
            batchUSDB?.batch
              .slice(i * 2000, (i + 1) * 2000)
              .filter((a) => Number(a.points) > 0.01) || [],
          secondsToFinalize: 3600,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenUSDB}`,
          },
        }
      );

      if (!responseUSDB.data.success) {
        console.log("USDB transfer failed", responseUSDB.data);
        process.exit();
      } else {
        console.log(
          "USDB transfer successful, saving batch",
          responseUSDB.data
        );
      }
    }
    batchUSDB.executed = true;
    await batchUSDB.save();
    console.log("finished uploading usdb");

    await BlastUserPhase2.bulkWrite(
      batchUSDB.batch.map((u) => {
        return {
          updateOne: {
            filter: { walletAddress: u.toAddress },
            update: {
              $inc: {
                [`blastPoints.pointsGivenUSDB`]: Number(u.points),
              },
            },
          },
        };
      })
    );

    console.log("finished updating users usdb");
  }

  if (batchWETH && !batchWETH.executed) {
    const subbatchesCount = batchWETH.batch.length / 2000;

    for (let i = 0; i < subbatchesCount; i++) {
      const urlWETH = `${blastApiBaseURL}/v1/contracts/${addressWETH}/batches/${batchId}_weth_${i}`;
      const res = await axios.put(
        urlWETH,
        {
          pointType: "PHASE2_POINTS",
          transfers:
            batchWETH?.batch
              .slice(i * 2000, (i + 1) * 2000)
              .filter((a) => Number(a.points) > 0.01) || [],
          secondsToFinalize: 3600,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenWETH}`,
          },
        }
      );

      if (!res.data.success) {
        console.log("WETH transfer failed", res.data);
        process.exit();
      } else {
        console.log("WETH transfer successful, saving batch", res.data);
      }
    }
    batchWETH.executed = true;
    await batchWETH.save();
    console.log("finished uploading weth");

    await BlastUserPhase2.bulkWrite(
      batchWETH.batch.map((u) => {
        return {
          updateOne: {
            filter: { walletAddress: u.toAddress },
            update: {
              $inc: {
                [`blastPoints.pointsGivenWETH`]: Number(u.points),
              },
            },
          },
        };
      })
    );

    console.log("finished updating users weth");
  }

  console.log("finished uploading batch", batchId);
};

export const main = async () => {
  try {
    //calculate blast user shares
    await saveBlastUserShares()

    //calculate blast user points
    await saveBlastUserPoints()

    //create blast batches
    await createBlastBatches()

    //execute blastBatches
    await executeBlastBatches()
  }
  catch (error: any) {
    throw new Error(`Error in blast points distribution ${error}`)
  }
}