import axios from "axios";
import { ethers } from "ethers";
import nconf from "nconf";
import { MulticallWrapper } from "ethers-multicall-provider";

import { blastStartDate } from "./constants";
import { blastProvider } from "../../utils/providers";
import BlastPointABI from "../../abis/BlastPoints.json";
import { BlastUser } from "../../database/models/blastUsers";
import { BlastBatches } from "../../database/models/blastBatches";

const baseUrl = "https://waitlist-api.prod.blast.io";

const assetAddress = [
  "0x53a3Aa617afE3C12550a93BA6262430010037B04",
  "0x29c2Bc372728dacB472A7E90e5fc8Aa0F203C8CD",
  "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34",
  "0x0e914b7669E97fd0c2644Af60E90EA7ddb4F91d1",
];
const blastPointAddress = "0x0A1198DDb5247a283F76077Bb1E45e5858ee100b";
const contractAddress = "0x94Dc19a5bd17E84d90E63ff3fBA9c3B76E5E4012";

type PointType = "LIQUIDITY" | "DEVELOPER";

type RequestChallenge = {
  contractAddress: string; // contract with points to be distributed
  operatorAddress: string; // the EOA configured with IBlastPoints
};
type ResponseChallenge = {
  success: boolean;
  challengeData: string;
  message: string;
};

type RequestOAuth = {
  challengeData: string; // from challenge response
  signature: string; // ERC-191 signature of `message` from the challenge
};

type ResponseOAuth = {
  success: boolean;
  bearerToken: string; // will last 1 hour
};

type Transfer = {
  toAddress: string;
  points: string;
};

type Request = {
  pointType: PointType;
  transfers: Transfer[];
  secondsToFinalize?: number | null;
};

const getBlastChallenge = async (contractAddress: string) => {
  const url = "v1/dapp-auth/challenge";
  const operatorAddress = nconf.get("OPERATOR_ADDRESS");
  const requestBody: RequestChallenge = {
    contractAddress: contractAddress,
    operatorAddress: operatorAddress,
  };
  const response = await axios.post(`${baseUrl}/${url}`, requestBody);
  return response.data as ResponseChallenge;
};

const getBearerToken = async (challengeData: any) => {
  const privateKey = nconf.get("OPERATOR_PRIVATE_KEY");

  // Create a wallet instance from the private key
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(challengeData.message);
  const url = "v1/dapp-auth/solve";
  const requestBody: RequestOAuth = {
    challengeData: challengeData.challengeData,
    signature: signature,
  };
  const response = await axios.post(`${baseUrl}/${url}`, requestBody);
  return response.data.bearerToken as string;
};

const getPoints = async (token: string, contractAddress: string) => {
  const url = `v1/contracts/${contractAddress}/point-balances`;

  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const response = await axios.get(`${baseUrl}/${url}`, { headers });
  return response.data;
};

export const BlastPoints = async () => {
  //USDB
  const contractAddressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const challengeUSDB = await getBlastChallenge(contractAddressUSDB);
  const tokenUSDB = await getBearerToken(challengeUSDB);
  const pointsUSDB = await getPoints(tokenUSDB, contractAddressUSDB);
  console.log(pointsUSDB);

  //WETH
  const contractAddressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";
  const challengeWETH = await getBlastChallenge(contractAddressWETH);
  const tokenWETH = await getBearerToken(challengeWETH);
  const pointsWETH = await getPoints(tokenWETH, contractAddressWETH);
  console.log(pointsWETH);

  const totalPoints =
    Number(pointsUSDB.balancesByPointType.LIQUIDITY.available) +
    Number(pointsWETH.balancesByPointType.LIQUIDITY.available);
  console.log(totalPoints);

  return {
    blastUSDB: Number(pointsUSDB.balancesByPointType.LIQUIDITY.available),
    blastWETH: Number(pointsWETH.balancesByPointType.LIQUIDITY.available),
    totalPoints: totalPoints,
  };
};

export const calculateBlastUserShare = async (addresses: string[]) => {
  const noOfDays = Math.floor(
    Math.abs(blastStartDate - Date.now()) / (1000 * 60 * 60 * 24)
  ); // no of days from incentives started
  const totalShares = 86400 * noOfDays * 40;
  const blastPoints = await BlastPoints();

  const provider = MulticallWrapper.wrap(blastProvider);

  const blastPointContract = new ethers.Contract(
    contractAddress,
    BlastPointABI,
    provider
  );

  const results = await Promise.all(
    addresses.map((w) =>
      blastPointContract.getUserRewards(assetAddress, w, blastPointAddress)
    )
  );
  const finalResults = results.map((amount: bigint, index) => {
    const share = Number(amount) / 1e18;
    const sharePercentage = share / totalShares;

    return {
      address: addresses[index],
      shares: share,
      sharePercentage: sharePercentage * 100,
      pointUSDB: Number(sharePercentage * blastPoints.blastUSDB).toFixed(2),
      pointWETH: Number(sharePercentage * blastPoints.blastWETH).toFixed(2),
      points: Number(
        sharePercentage * blastPoints.blastUSDB +
          sharePercentage * blastPoints.blastWETH
      ).toFixed(2),
    };
  });
  return finalResults;
};

export const saveBlastUsers = async () => {
  const first = 1000;
  let batch;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  const queryURL =
    "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";
  const bulkOperations = [];
  const allBlastUsers = await BlastUser.find({}, { walletAddress: 1, _id: 0 });
  const allBlastUsersAddress: any = allBlastUsers.map((user: any) =>
    user.walletAddress.toLowerCase().trim()
  );
  do {
    const graphQuery = `query {
      users(where: {id_gt: "${lastAddress}"}, first: 1000) {
        id
      }
    }`;

    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(queryURL, { query: graphQuery }, { headers });
    const addresses = batch.data.data.users.map((user: any) => user.id);
    const userShares = await calculateBlastUserShare(addresses);

    for (const userShare of userShares) {
      const walletAddress: any = userShare.address.toLowerCase().trim();
      if (Number(userShare.points) > 0) {
        if (allBlastUsersAddress.includes(walletAddress)) {
          bulkOperations.push({
            updateOne: {
              filter: { walletAddress },
              update: {
                $set: {
                  "blastPoints.pointsPending": Number(userShare.points),
                  "blastPoints.pointsPendingUSDB": Number(userShare.pointUSDB),
                  "blastPoints.pointsPendingWETH": Number(userShare.pointWETH),
                  "blastPoints.shares": userShare.shares,
                  "blastPoints.sharePercent": userShare.sharePercentage,
                  "blastPoints.timestamp": Date.now(),
                },
              },
            },
          });
        } else {
          bulkOperations.push({
            insertOne: {
              document: {
                walletAddress,
                blastPoints: {
                  pointsPending: Number(userShare.points),
                  pointsPendingUSDB: Number(userShare.pointUSDB),
                  pointsPendingWETH: Number(userShare.pointWETH),
                  shares: userShare.shares,
                  sharePercent: userShare.sharePercentage,
                  timestamp: Date.now(),
                },
              },
            },
          });
        }
      }
    }

    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
  } while (batch.data.data.users.length === first);

  if (bulkOperations.length > 0) {
    await BlastUser.bulkWrite(bulkOperations);
    console.log(
      `Inserted ${bulkOperations.length} documents into BlastUser collection.`
    );
  }
};

export const assignBlastPoints = async () => {
  const batchSize = 2000;
  let skip = 0;
  let batch;
  const addressUSDB = "0x53a3Aa617afE3C12550a93BA6262430010037B04";
  const challengeUSDB = await getBlastChallenge(addressUSDB);
  const tokenUSDB = await getBearerToken(challengeUSDB);
  const tokenName = "WETH";
  let batchId = 2837; //Math.floor(Date.now() / 86400 / 7 / 1000);
  do {
    //USDB
    console.log("batchId", batchId);
    batch = await BlastUser.find({
      [`blastPoints.pointsPending${tokenName}`]: { $gt: 0 },
    })
      .skip(skip)
      .limit(batchSize);
    const transferBatch = [];
    if (batch.length > 0) {
      for (const user of batch) {
        if (user.blastPoints[`pointsPending${tokenName}`] > 0) {
          const transfer: Transfer = {
            toAddress: user.walletAddress,
            points: String(user.blastPoints[`pointsPending${tokenName}`]),
          };
          transferBatch.push(transfer);
        }
      }
      console.log(transferBatch.length);

      const request: Request = {
        pointType: "LIQUIDITY",
        transfers: transferBatch,
      };
      const url = `${baseUrl}/v1/contracts/${addressUSDB}/batches/${batchId}`;
      const headers = {
        Authorization: `Bearer ${tokenUSDB}`,
      };
      try {
        const response = await axios.put(url, request, { headers });
        console.log(response.data);
        if (response.data.success) {
          //saving batch
          await BlastBatches.create({
            batchId,
            batch: transferBatch,
          });
        }
      } catch (e: any) {
        console.log(e.response.data);
      }

      skip += batchSize;
      batchId += 1;
    }
  } while (batch.length === batchSize);
};

export const updateBlastPoints = async () => {
  const tokenName = "WETH";
  const blastBatches = await BlastBatches.find({ batchId: { $gte: 2836 } });

  blastBatches.forEach(async (batch: any) => {
    const bulkOperations: any = [];
    for (const item of batch.batch) {
      bulkOperations.push({
        updateOne: {
          filter: { walletAddress: item.toAddress },
          update: {
            $inc: {
              "blastPoints.pointsGiven": Number(item.points),
              "blastPoints.pointsPending": -Number(item.points),
            },
            $set: {
              [`blastPoints.pointsPending${tokenName}`]: 0,
              "blastPoints.timestamp": Date.now(),
            },
          },
        },
      });
    }
    if (bulkOperations.length > 0) {
      await BlastUser.bulkWrite(bulkOperations);
      console.log(
        `Updated ${bulkOperations.length} documents in BlastUser collection.`
      );
    }
  });
};

export const getTotalBlastPointGiven = async () => {
  const result = await BlastUser.aggregate([
    {
      $group: {
        _id: null,
        totalPointsGiven: { $sum: "$blastPoints.pointsGiven" },
      },
    },
  ]);
  console.log(result);
};
