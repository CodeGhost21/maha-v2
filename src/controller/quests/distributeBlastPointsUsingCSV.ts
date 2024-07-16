import axios from "axios";
import { BlastBatches } from "../../database/models/blastBatches";
import { getBlastChallenge, getBearerToken } from "./blast";
import path from "path";
import fs from "fs";
import axiosRetry from "axios-retry";
import { BlastUser } from "../../database/models/blastUsers";

axiosRetry(axios, {
  // retries: 3, // default is 3
  retryDelay: (retryCount) => {
    console.log(`next retry in: ${retryCount * 5} seconds`);
    return retryCount * 5000; // time interval between retries
  },
  onRetry: (retryCount) => {
    console.log("retrying count: ", retryCount);
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return (
      error.response?.status === 429 ||
      error.response?.status === 520 ||
      error.response?.status === 408 ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504
    );
  },
});

const baseUrl = "https://waitlist-api.prod.blast.io";
const csvFilePath = path.join(
  __dirname,
  "./pointsBlastCsv/blast_points_data - Sheet1.csv"
);

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

const readBlastPointsDataFromCSV = (_path: string) => {
  const data = fs.readFileSync(_path, "utf8");

  // Split the data into lines
  const lines = data.trim().split("\n");

  // Extract the header line
  const header = lines[0].split(",");

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

    pointsUSDB > 0 ? (value.usdb = pointsUSDB) : "";
    pointsWETH > 0 ? (value.weth = pointsWETH) : "";

    // Add the wallet address and value to the map
    if (pointsUSDB > 0 || pointsWETH > 0) {
      walletMap.set(walletAddress, value);
    }
  }

  // Print the map to verify the results
  return walletMap;
};

const sendUSDBBatch = async (
  transferBatchUSDB: Transfer[],
  headersUSDB: {
    Authorization: string;
  },
  addressUSDB: string
) => {
  const batchId = Math.floor(Date.now());

  // create request
  const requestUSDB: Request = {
    pointType: "LIQUIDITY",
    transfers: transferBatchUSDB,
    secondsToFinalize: 3600,
  };
  const urlUSDB = `${baseUrl}/v1/contracts/${addressUSDB}/batches/${batchId}_usdb`;

  const responseUSDB = await axios.put(urlUSDB, requestUSDB, {
    headers: headersUSDB,
  });

  if (responseUSDB.data.success) {
    console.log("USDB transfer successful, saving batch");

    //save usdb batch
    try {
      await BlastBatches.create({
        batchId: `${batchId}_usdb`,
        batch: transferBatchUSDB,
      });
    } catch (error) {
      console.log("failed to write USDB batch", error);
    }
  }
};

const sendWETHData = async (
  transferBatchWETH: Transfer[],
  headersWETH: {
    Authorization: string;
  },
  addressWETH: string
) => {
  const batchId = Math.floor(Date.now());
  const requestWETH: Request = {
    pointType: "LIQUIDITY",
    transfers: transferBatchWETH,
    secondsToFinalize: 3600,
  };

  const urlWETH = `${baseUrl}/v1/contracts/${addressWETH}/batches/${batchId}_weth`;

  const responseWETH = await axios.put(urlWETH, requestWETH, {
    headers: headersWETH,
  });

  if (responseWETH.data.success) {
    console.log("WETH transfer successful, saving batch");

    //saving batch
    try {
      await BlastBatches.create({
        batchId: `${batchId}_weth`,
        batch: transferBatchWETH,
      });
    } catch (error) {
      console.log("failed to write WETH batch", error);
    }
  }
};

export const distributeBlastPointsFromCSV = async () => {
  const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";

  const challengeUSDB = await getBlastChallenge(addressUSDB);
  const challengeWETH = await getBlastChallenge(addressWETH);

  const tokenUSDB = await getBearerToken(challengeUSDB);
  const tokenWETH = await getBearerToken(challengeWETH);

  const headersUSDB = {
    Authorization: `Bearer ${tokenUSDB}`,
  };
  const headersWETH = {
    Authorization: `Bearer ${tokenWETH}`,
  };

  const transferBatchUSDB = [];
  const transferBatchWETH = [];
  const bulkOperationsUSDB: any = [];
  const bulkOperationsWETH: any = [];

  // get data from csv
  const pointsData = readBlastPointsDataFromCSV(csvFilePath);

  for (const [walletAddress, points] of pointsData) {
    if (points.usdb) {
      const transferUSDB: Transfer = {
        toAddress: walletAddress,
        points: (points.usdb as number).toFixed(6),
      };
      transferBatchUSDB.push(transferUSDB);

      // update points given
      bulkOperationsUSDB.push({
        updateOne: {
          filter: { walletAddress },
          update: {
            $inc: {
              "blastPoints.pointsGivenUSDB": points.usdb,
              "blastPoints.pointsGiven": points.usdb,
            },
          },
          upsert: true,
        },
      });
    }

    if (points.weth) {
      const transferWETH: Transfer = {
        toAddress: walletAddress,
        points: (points.weth as number).toFixed(6),
      };
      transferBatchWETH.push(transferWETH);

      // update points given
      bulkOperationsWETH.push({
        updateOne: {
          filter: { walletAddress },
          update: {
            $inc: {
              "blastPoints.pointsGivenWETH": points.weth,
              "blastPoints.pointsGiven": points.weth,
            },
          },
          upsert: true,
        },
      });
    }

    // send a batch of 100 Transfer
    if (transferBatchUSDB.length === 100) {
      console.log("sending USDB batch of 100 to prod api");
      await sendUSDBBatch(transferBatchUSDB, headersUSDB, addressUSDB);
      transferBatchUSDB.length = 0;

      // update DB
      await BlastUser.bulkWrite(bulkOperationsUSDB);
      bulkOperationsUSDB.length = 0;
    }

    // send a batch of 100 Transfer
    if (transferBatchWETH.length === 100) {
      console.log("sending WETH batch of 100 to prod api");
      await sendWETHData(transferBatchWETH, headersWETH, addressWETH);
      transferBatchWETH.length = 0;

      // update DB
      await BlastUser.bulkWrite(bulkOperationsWETH);
      bulkOperationsWETH.length = 0;
    }
  }

  // transfer last batch
  if (transferBatchUSDB.length > 0) {
    console.log(
      "sending last USDB batch of",
      transferBatchUSDB.length,
      "to prod api"
    );
    await sendUSDBBatch(transferBatchUSDB, headersUSDB, addressUSDB);

    // update DB
    await BlastUser.bulkWrite(bulkOperationsUSDB);
  }
  if (transferBatchWETH.length > 0) {
    console.log(
      "sending last WETH batch",
      transferBatchWETH.length,
      "to prod api"
    );
    await sendWETHData(transferBatchWETH, headersWETH, addressWETH);

    // update DB
    await BlastUser.bulkWrite(bulkOperationsWETH);
  }

  console.log("done");
};
