import axios from "axios";
import { BlastBatches } from "../../database/models/blastBatches";
import { getBlastChallenge, getBearerToken } from "./blast";
import path from "path";
import fs from "fs";
import axiosRetry from "axios-retry";

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
  "./pointsBlastCsv/gold.csv"
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

const readBlastGoldDataFromCSV = (_path: string) => {
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
    const pointsGold = parseFloat(line[1]);

    pointsGold > 0 ? walletMap.set(walletAddress, pointsGold) : "";

  }

  // Print the map to verify the results
  return walletMap;
};


const sendGoldData = async (
  transferBatchGold: Transfer[],
  headersWETH: {
    Authorization: string;
  },
  addressWETH: string
) => {
  const batchId = Math.floor(Date.now());
  const requestWETH: Request = {
    pointType: "LIQUIDITY",
    transfers: transferBatchGold,
    secondsToFinalize: 3600,
  };

  const urlWETH = `${baseUrl}/v1/contracts/${addressWETH}/batches/${batchId}_gold`;

  const responseWETH = await axios.put(urlWETH, requestWETH, {
    headers: headersWETH,
  });

  if (responseWETH.data.success) {
    console.log("WETH transfer successful, saving batch");

    //saving batch
    try {
      await BlastBatches.create({
        batchId: `${batchId}_gold`,
        batch: transferBatchGold,
      });
    } catch (error) {
      console.log("failed to write Blast Gold batch", error);
    }
  }
};

export const distributeBlastGoldPointsFromCSV = async () => {
  const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";
  const challengeWETH = await getBlastChallenge(addressWETH);
  const tokenWETH = await getBearerToken(challengeWETH);

  const headersWETH = {
    Authorization: `Bearer ${tokenWETH}`,
  };

  const transferBatchBlastGold = [];

  // get data from csv
  const pointsData = readBlastGoldDataFromCSV(csvFilePath);

  for (const [walletAddress, goldPoints] of pointsData) {
    if (goldPoints) {
      const transferBlastGold: Transfer = {
        toAddress: walletAddress,
        points: (goldPoints as number).toFixed(6),
      };
      transferBatchBlastGold.push(transferBlastGold);
    }


    // send a batch of 100 Transfer
    if (transferBatchBlastGold.length === 100) {
      console.log("sending Blast Gold batch of 100 to prod api");
      await sendGoldData(transferBatchBlastGold, headersWETH, addressWETH);
      transferBatchBlastGold.length = 0;
    }

  }

  // transfer last batch
  if (transferBatchBlastGold.length > 0) {
    console.log(
      "sending last Blast gold batch",
      transferBatchBlastGold.length,
      "to prod api"
    );
    // await sendGoldData(transferBatchBlastGold, headersWETH, addressWETH);
  }

  console.log("done");
};
