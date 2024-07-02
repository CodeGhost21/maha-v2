import axios from "axios";
import { BlastUser, IBlastUserModel } from "../../database/models/blastUsers";
import { BlastBatches } from "../../database/models/blastBatches";

import { getBlastChallenge, getBearerToken, BlastData } from "./blast";
import axiosRetry from "axios-retry";
import { AnyBulkWriteOperation } from "mongodb";
import fs from "fs";
import path from "path";

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
    return error.response?.status === 429 || error.response?.status === 520;
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
            "blastPoints.pointsPending": 0,
          },
          $inc: {
            "blastPoints.pointsGivenUSDB": actualUSDB ?? 0,
            "blastPoints.pointsGivenWETH": actualWETH ?? 0,
            "blastPoints.pointsGiven": actualWETH ?? 0 + actualUSDB ?? 0,
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

  const users = userBatch.map((u: any) => `"${u.id}"`).join(",");
  const query = `{
    usdbusers(where: {id_in: [${users}]}, first:1000) {
      id
      balance
      debt
      lastUpdatedAt 
      accumulatedPoints
    }
    wethusers(where: {id_in: [${users}]}, first:1000) {
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

  const dbUsers = await BlastUser.find({
    walletAddress: {
      $in: [users],
    },
  }).select("blastPoints walletAddress");
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
      let usdbPointsEarned =
        Number(usdbPointsEarnedPercentage * usdbPointsTotal) / percentage;
      const foundUser = dbUsers.find(
        (_user) => _user.walletAddress === user.id
      );
      if (foundUser) {
        usdbPointsEarned -= foundUser.blastPoints.pointsGivenUSDB;
      }

      if (usdbPointsEarned > 0) {
        pointsEarnedMap.set(user.id, { usdbPointsEarned });
      }
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
      let wethPointsEarned =
        Number(wethPointsEarnedPercentage * wethPointsTotal) / percentage;
      const usdbPointsEarned = pointsEarnedMap.get(user.id) || {};
      const foundUser = dbUsers.find(
        (_user) => _user.walletAddress === user.id
      );
      if (foundUser) {
        wethPointsEarned -= foundUser.blastPoints.pointsGivenWETH;
      }

      if (wethPointsEarned > 0) {
        pointsEarnedMap.set(user.id, { ...usdbPointsEarned, wethPointsEarned });
      }
    }
  });

  return pointsEarnedMap;
};

const calculateAndUpdatePositivePointsInDb = async (
  usersShare: Map<any, any>,
  users: IBlastUserModel[]
) => {
  const correctedDateString = "2024-06-21T13:25:06.631+0000".replace(
    "+0000",
    "Z"
  );

  // Convert the string to a JavaScript Date object
  const date = new Date(correctedDateString);
  console.log(date);
  // fetch stored users from batch ids
  const storedBatch = await BlastUser.find({
    $and: [
      {
        walletAddress: { $in: users.map((u: any) => u.id) },
      },
      { updatedAt: { $lt: date } },
    ],
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
    if (pointsToGiveUSDB > 0) {
      valuesToSet["blastPoints.pointsPendingUSDB"] = pointsToGiveUSDB;
      valuesToSet["blastPoints.pointsPending"] = pointsToGiveUSDB;
    }

    // if WETH points to give are +ve, update db
    if (pointsToGiveWETH > 0) {
      valuesToSet["blastPoints.pointsPendingWETH"] = pointsToGiveWETH;
      if (!valuesToSet["blastPoints.pointsPending"]) {
        valuesToSet["blastPoints.pointsPending"] = pointsToGiveWETH;
      } else {
        valuesToSet["blastPoints.pointsPending"] += pointsToGiveWETH;
      }
    }

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
    console.log("executed blast-points for batch. last address", lastAddress);
  } while (batch.data.data.users.length === first);
  console.log("done");
};

export const findMissedUsersForBlastPoints = async () => {
  const blastPoints = await BlastData();
  const usdbPointsTotal: number = blastPoints.blastUSDB;
  const wethPointsTotal: number = blastPoints.blastWETH;

  let batch;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  const first = 1000;

  const queryURL =
    "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";

  const csvFilePath = path.join(
    __dirname,
    "./pointsBlastCsv/blast_points_data - Sheet1.csv"
  );

  const pointsData = readBlastPointsDataFromCSV(csvFilePath);

  fs.writeFileSync(
    "missing_user_blast_points.csv",
    "walletAddress,points to give usdb,points to give weth"
  );

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

    const unprocessedUsers = users.filter(
      (user: any) => !pointsData.has(user.id)
    );

    if (unprocessedUsers.length) {
      const usersShare = await getUSDBWETHPoints(
        unprocessedUsers,
        usdbPointsTotal,
        wethPointsTotal
      );

      for (const [walletAddress, points] of usersShare) {
        fs.appendFileSync(
          "missing_user_blast_points.csv",
          `\n${walletAddress},${points.usdbPointsEarned ?? 0},${points.wethPointsEarned ?? 0}`
        );
      }
    }

    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
    console.log("executed blast-points for batch. last address", lastAddress);
  } while (batch.data.data.users.length === first);
  console.log("done");
};

const readBlastPointsDataFromCSV = (_path: string) => {
  const data = fs.readFileSync(_path, "utf8");

  // Split the data into lines
  const lines = data.trim().split("\n");

  // Create a map to store the results
  const walletMap = new Map();

  // Loop through each line of the CSV data (skipping the header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(",");

    // Extract the wallet address and points
    const walletAddress = line[0];
    const pointsUSDB = parseFloat(line[1]);
    const pointsWETH = parseFloat(line[2]);

    // Create the value object
    const value: any = {};

    // pointsUSDB > 0 ? (value.usdb = pointsUSDB) : "";
    // pointsWETH > 0 ? (value.weth = pointsWETH) : "";

    value.usdb = pointsUSDB;
    value.weth = pointsWETH;

    // Add the wallet address and value to the map
    // if (pointsUSDB > 0 || pointsWETH > 0) {
    walletMap.set(walletAddress, value);
    // }
  }
  return walletMap;
};
