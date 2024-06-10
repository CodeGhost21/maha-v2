import axios from "axios";
import { BlastUser } from "../../database/models/blastUsers";
import { BlastBatches } from "../../database/models/blastBatches";

import { getBlastChallenge, getBearerToken, BlastData } from "./blast";

const baseUrl = "https://waitlist-api.prod.blast.io";

type PointType = "LIQUIDITY" | "DEVELOPER";

type Transfer = {
  toAddress: string;
  points: string;
};

type Request = {
  pointType: PointType;
  transfers: Transfer[];
  secondsToFinalize?: number | null;
};

export const assignBlastPoints = async (usersShare: Map<any, any>) => {
  const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";

  const challengeUSDB = await getBlastChallenge(addressUSDB);
  const challengeWETH = await getBlastChallenge(addressWETH);

  const tokenUSDB = await getBearerToken(challengeUSDB);
  const tokenWETH = await getBearerToken(challengeWETH);

  const batchId = Math.floor(Date.now());

  const transferBatchUSDB = [];
  const transferBatchWETH = [];

  for (const [walletAddress, share] of usersShare) {
    const transferUSDB: Transfer = {
      toAddress: walletAddress,
      points: (share.pointUSDB as number).toFixed(2),
    };
    const transferWETH: Transfer = {
      toAddress: walletAddress,
      points: (share.pointWETH as number).toFixed(2),
    };

    transferBatchUSDB.push(transferUSDB);
    transferBatchWETH.push(transferWETH);
  }

  const requestUSDB: Request = {
    pointType: "LIQUIDITY",
    transfers: transferBatchUSDB,
    secondsToFinalize: 3600,
  };

  const requestWETH: Request = {
    pointType: "LIQUIDITY",
    transfers: transferBatchWETH,
    secondsToFinalize: 3600,
  };

  const urlUSDB = `${baseUrl}/v1/contracts/${addressUSDB}/batches/${batchId}_usdb`;
  const urlWETH = `${baseUrl}/v1/contracts/${addressWETH}/batches/${batchId}_weth`;

  const headersUSDB = {
    Authorization: `Bearer ${tokenUSDB}`,
  };
  const headersWETH = {
    Authorization: `Bearer ${tokenWETH}`,
  };

  // send request for USDB
  try {
    const responseUSDB = await axios.put(urlUSDB, requestUSDB, {
      headers: headersUSDB,
    });

    if (responseUSDB.data.success) {
      console.log("USDB transfer successful, saving batch");
      //saving batch
      await BlastBatches.create({
        batchId: `${batchId}_usdb`,
        batch: transferBatchUSDB,
      });
    }

    const responseWETH = await axios.put(urlWETH, requestWETH, {
      headers: headersWETH,
    });

    if (responseWETH.data.success) {
      console.log("WETH transfer successful, saving batch");

      //saving batch
      await BlastBatches.create({
        batchId: `${batchId}_weth`,
        batch: transferBatchWETH,
      });
    }
    return true;
  } catch (e: any) {
    console.error("ERROR:", e);
    return false;
  }
};

const getUSDBWETHPoints = async (
  userBatch: any,
  usdbPointsTotal: number,
  wethPointsTotal: number
) => {
  console.log("analyzing users");
  console.log("blast points earned from USDB contract", usdbPointsTotal);
  console.log("blast points earned from WETH contract", wethPointsTotal);

  const url =
    "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/zerolend-blast-points/1.0.0/gn";

  const query = `{
    usdbusers(where: {id_in: [${userBatch.map((u: any) => `"${u.id}"`)}]}) {
      id
      balance
      debt
      lastUpdatedAt 
      accumulatedPoints
    }
    wethusers(where: {id_in: [${userBatch.map((u: any) => `"${u.id}"`)}]}) {
      id
      balance
      debt
      lastUpdatedAt
      accumulatedPoints
    }
    core(id:"1") {
      id
      totalPointsUSDB
      totalPointsWETH
    }
  }`;

  const data = await axios.post(url, {
    query,
  });

  /* 
  
  t1 ---- t2 
  t1----------t2.1 --> distr
  

  t2 ---- t2.1  ------ t3
  t1----------t3 --> distr
  
  */
  const results = data.data.data;

  const usdbusers = results.usdbusers;
  const wethusers = results.wethusers;

  const core = results.core;
  const pointsEarnedMap = new Map();

  const percentage = 100000000;

  usdbusers.forEach((user: any) => {
    const usdbPointsEarnedPercentage = Number(
      ((BigInt(user.accumulatedPoints) +
        (BigInt(user.balance) -
          BigInt(userBatch.debt) * BigInt(Date.now() - user.lastUpdatedAt))) *
        BigInt(percentage)) /
        BigInt(core.totalPointsUSDB)
    );
    const usdbPointsEarned =
      Number(usdbPointsEarnedPercentage * usdbPointsTotal) / percentage;

    pointsEarnedMap.set(user.id, { usdbPointsEarned });
  });

  wethusers.forEach((user: any) => {
    const wethPointsEarnedPercentage = Number(
      ((BigInt(user.accumulatedPoints) +
        (BigInt(user.balance) -
          BigInt(userBatch.debt) * BigInt(Date.now() - user.lastUpdatedAt))) *
        BigInt(percentage)) /
        BigInt(core.totalPointsUSDB)
    );
    const wethPointsEarned =
      Number(wethPointsEarnedPercentage * wethPointsTotal) / percentage;
    const usdbPointsEarned = pointsEarnedMap.get(user.id);
    pointsEarnedMap.set(user.id, { ...usdbPointsEarned, wethPointsEarned });
  });

  return pointsEarnedMap;
};

export const distributeBlastPoints = async () => {
  const blastPoints = await BlastData();
  const usdbPointsTotal: number = blastPoints.blastUSDB;
  const wethPointsTotal: number = blastPoints.blastWETH;

  const first = 1000;
  let batch;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  const queryURL =
    "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";
  const bulkOperations = [];
  do {
    const graphQuery = `query {
    users(where: {id_gt: "${lastAddress}"}, first: ${first}) {
      id
      }
    }`;

    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(queryURL, { query: graphQuery }, { headers });

    const users = batch.data.data.users;
    const usersShare = await getUSDBWETHPoints(
      users,
      usdbPointsTotal,
      wethPointsTotal
    );

    // assign pending blast points
    const isSuccess = await assignBlastPoints(usersShare);

    // update db
    if (isSuccess) {
      for (const [walletAddress, share] of usersShare) {
        bulkOperations.push({
          updateOne: {
            filter: { walletAddress },
            update: {
              $set: {
                "blastPoints.timestamp": Date.now(),
              },
              $inc: {
                "blastPoints.pointsGivenUSDB": Number(share.pointUSDB),
                "blastPoints.pointsGivenWETH": Number(share.pointWETH),
              },
            },
            upsert: true,
          },
        });
      }
    }

    // store pending points
    if (bulkOperations.length > 0) {
      await BlastUser.bulkWrite(bulkOperations);
      console.log(
        `Inserted ${bulkOperations.length} documents into BlastUser collection.`
      );
    }

    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
  } while (batch.data.data.users.length === first);
};
