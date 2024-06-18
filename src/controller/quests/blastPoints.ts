import axios from "axios";
import { BlastUser, IBlastUserModel } from "../../database/models/blastUsers";
import { BlastBatches } from "../../database/models/blastBatches";

import { getBlastChallenge, getBearerToken, BlastData } from "./blast";
import axiosRetry from "axios-retry";
import { AnyBulkWriteOperation } from "mongodb";
import { writeFileSync } from "fs";

// Exponential back-off retry delay between requests
axiosRetry(axios, {
  // retries: 3, // default is 3
  retryDelay: (retryCount) => {
    console.log(`next retry in: ${retryCount * 5000}`);
    return retryCount * 5000; // time interval between retries
  },
  onRetry: (retryCount) => {
    console.log("retrying count: ", retryCount);
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return error.response?.status === 429;
  },
});

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

export const assignBlastPoints = async (actualPoints: Map<any, any>) => {
  const bulkOperations: any = [];
  const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";

  const challengeUSDB = await getBlastChallenge(addressUSDB);
  const challengeWETH = await getBlastChallenge(addressWETH);

  const tokenUSDB = await getBearerToken(challengeUSDB);
  const tokenWETH = await getBearerToken(challengeWETH);

  const batchId = Math.floor(Date.now());

  const transferBatchUSDB = [];
  const transferBatchWETH = [];

  for (const [walletAddress, actual] of actualPoints) {
    const actualUSDB = actual["blastPoints.pointsPendingUSDB"] ?? 0;
    const actualWETH = actual["blastPoints.pointsPendingWETH"] ?? 0;

    if (actualUSDB) {
      const transferUSDB: Transfer = {
        toAddress: walletAddress,
        points: (actualUSDB as number).toFixed(2),
      };
      transferBatchUSDB.push(transferUSDB);
    }

    if (actualWETH) {
      const transferWETH: Transfer = {
        toAddress: walletAddress,
        points: (actualWETH as number).toFixed(2),
      };
      transferBatchWETH.push(transferWETH);
    }

    // reset points pending
    bulkOperations.push({
      updateOne: {
        filter: { walletAddress },
        update: {
          $set: {
            "blastPoints.pointsPendingUSDB": 0,
            "blastPoints.pointsPendingWETH": 0,
          },
        },
      },
    });
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
    await BlastUser.bulkWrite(bulkOperations);
    
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

  const results = data.data.data;

  const usdbusers = results.usdbusers;
  const wethusers = results.wethusers;

  const core = results.core;
  const pointsEarnedMap = new Map();

  const percentage = 100000000;

  // subtract from points given
  // also sub from previous give from db
  usdbusers.forEach((user: any) => {
    const currentPointsAccumulated =
      BigInt(user.balance) -
      BigInt(user.debt) * BigInt(Date.now() - user.lastUpdatedAt);

    const usdbPointsEarnedPercentage = Number(
      ((BigInt(user.accumulatedPoints) + currentPointsAccumulated) *
        BigInt(percentage)) /
        BigInt(core.totalPointsUSDB)
    );

    // calculate share for user if accumulated points are +ve
    if (usdbPointsEarnedPercentage > 0) {
      const usdbPointsEarned =
        Number(usdbPointsEarnedPercentage * usdbPointsTotal) / percentage;

      pointsEarnedMap.set(user.id, { usdbPointsEarned });
    }
  });

  wethusers.forEach((user: any) => {
    const currentPointsAccumulated =
      BigInt(user.balance) -
      BigInt(user.debt) * BigInt(Date.now() - user.lastUpdatedAt);

    const wethPointsEarnedPercentage = Number(
      ((BigInt(user.accumulatedPoints) + currentPointsAccumulated) *
        BigInt(percentage)) /
        BigInt(core.totalPointsUSDB)
    );

    // calculate share for user if accumulated points are +ve
    if (wethPointsEarnedPercentage > 0) {
      const wethPointsEarned =
        Number(wethPointsEarnedPercentage * wethPointsTotal) / percentage;
      const usdbPointsEarned = pointsEarnedMap.get(user.id);
      pointsEarnedMap.set(user.id, { ...usdbPointsEarned, wethPointsEarned });
    }
  });

  return pointsEarnedMap;
};

const calculateAndUpdatePositivePointsInDb = async (
  usersShare: Map<any, any>,
  users: IBlastUserModel[]
) => {
  // fetch stored users from batch ids
  const storedBatch = await BlastUser.find({
    walletAddress: { $in: users.map((u: any) => u.id) },
  }).select("walletAddress blastPoints");

  // use map to return points, this will eliminate fetch operation while assigning points
  const actualPoints = new Map();
  const bulkOperations: any = [];

  console.log("updating points earned...");
  for (const [walletAddress, share] of usersShare) {
    //updated db with current points earned
    const _pointsUSDB = Number(share.usdbPointsEarned ?? 0);
    const _pointsWETH = Number(share.wethPointsEarned ?? 0);

    const user = storedBatch.find(
      (user) => user.walletAddress === walletAddress
    );

    let pointsToGiveUSDB = 0;
    let pointsToGiveWETH = 0;

    // if accumulated points are +ve, get points to give (points accumulated that we fetch are cumulative)
    // @dev this checks can be removed as no negative points will always be +ve here because of the checks in getUSDBWETHPoints
    if (_pointsUSDB > 0) {
      // subtract points given and add points pending
      pointsToGiveUSDB =
        _pointsUSDB -
        (user
          ? (user.blastPoints.pointsGivenUSDB ?? 0) -
            (user.blastPoints.pointsPendingUSDB ?? 0)
          : 0);
    }

    if (_pointsWETH > 0) {
      // subtract points given and add points pending
      pointsToGiveWETH =
        _pointsWETH -
        (user
          ? (user.blastPoints.pointsGivenWETH ?? 0) -
            (user.blastPoints.pointsPendingWETH ?? 0)
          : 0);
    }

    // object to set values in db,
    const valuesToSet: any = {};

    // if USDB points to give are +ve, update db
    pointsToGiveUSDB > 0
      ? (valuesToSet["blastPoints.pointsPendingUSDB"] = pointsToGiveUSDB)
      : "";

    // if WETH points to give are +ve, update db
    pointsToGiveWETH > 0
      ? (valuesToSet["blastPoints.pointsPendingWETH"] = pointsToGiveWETH)
      : "";

    if (Object.keys(valuesToSet).length > 0) {
      // set timeStamp
      valuesToSet["blastPoints.timestamp"] = Date.now();
      actualPoints.set(walletAddress, valuesToSet);
      // push update/insert op in bulk ops
      bulkOperations.push({
        updateOne: {
          filter: { walletAddress },
          update: {
            $set: valuesToSet,
            $inc: {
              "blastPoints.pointsGivenWETH": pointsToGiveUSDB ?? 0,
              "blastPoints.pointsGivenUSDC": pointsToGiveWETH ?? 0,
            },
          },
          upsert: true, // creates new user if walletAddress is not found
        },
      });
    }
  }

  if (bulkOperations.length > 0) {
    await BlastUser.bulkWrite(bulkOperations);
    console.log(
      `Inserted/Updated ${bulkOperations.length} documents into BlastUser collection.`
    );
  }
  return actualPoints;
};

export const distributeBlastPoints = async () => {
  const blastPoints = await BlastData();
  const usdbPointsTotal: number = blastPoints.blastUSDB;
  const wethPointsTotal: number = blastPoints.blastWETH;

  console.log("blast points earned from USDB contract", usdbPointsTotal);
  console.log("blast points earned from WETH contract", wethPointsTotal);

  const first = 1000;
  let batch;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  const queryURL =
    "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";

  do {
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

    const users = batch.data.data.users;

    const usersShare = await getUSDBWETHPoints(
      users,
      usdbPointsTotal,
      wethPointsTotal
    );

    // only update users who got +ve points accumulated
    const actualPoints = await calculateAndUpdatePositivePointsInDb(
      usersShare,
      users
    );

    // assign pending blast points
    const isSuccess = await assignBlastPoints(actualPoints);

    if (!isSuccess) {
      throw new Error(
        "failed to write data, please check new json generated and use it to update db, then restart"
      );
    }

    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
  } while (batch.data.data.users.length === first);
  console.log("done");
};
