import axios from "axios";
import { ethers } from "ethers";
import { MulticallWrapper } from "ethers-multicall-provider";

import { blastStartDate } from "./constants";
import { blastProvider } from "../../utils/providers";
import BlastPointABI from "../../abis/BlastPoints.json";
import { BlastUser } from "../../database/models/blastUsers";
import { BlastBatches } from "../../database/models/blastBatches";

import { getBlastChallenge, getBearerToken, BlastData } from "./blast";

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

type Transfer = {
  toAddress: string;
  points: string;
};

type Request = {
  pointType: PointType;
  transfers: Transfer[];
  secondsToFinalize?: number | null;
};

export const calculateBlastUserShare = async (addresses: string[]) => {
  const noOfDays = Math.floor(
    Math.abs(blastStartDate - Date.now()) / (1000 * 60 * 60 * 24)
  ); // no of days from incentives started
  const totalShares = 86400 * noOfDays * 40;
  const blastPoints = await BlastData();

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

export const saveBlastPointUsers = async () => {
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
    users(where: {id_gt: "${lastAddress}"}, first: ${first}) {
      id
    }
  }`;

    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(queryURL, { query: graphQuery }, { headers });
    const addresses = batch.data.data.users.map((user: any) => user.id);
    // const addresses = ["0x961e45e3666029709c3ac50a26319029cde4e067"];
    const userShares = await calculateBlastUserShare(addresses);
    console.log(userShares);

    for (const userShare of userShares) {
      const walletAddress: any = userShare.address.toLowerCase().trim();
      if (Number(userShare.points) > 0) {
        if (allBlastUsersAddress.includes(walletAddress)) {
          const user: any = await BlastUser.findOne({
            walletAddress: walletAddress,
          });
          console.log("totalPoints", userShare.points);

          const pointUSDBPercent =
            Number(userShare.pointUSDB) / Number(userShare.points) || 0;
          const pointsGivenUSDB =
            pointUSDBPercent * Number(user.blastPoints.pointsGiven) || 0;
          const pointWETHPercent = 1 - pointUSDBPercent;
          const pointsGivenWETH =
            pointWETHPercent * Number(user.blastPoints.pointsGiven) || 0;

          console.log("pointUSDBPercent", pointUSDBPercent, pointsGivenUSDB);
          console.log("pointWETHPercent", pointWETHPercent, pointsGivenWETH);

          bulkOperations.push({
            updateOne: {
              filter: { walletAddress },
              update: {
                $set: {
                  "blastPoints.shares": userShare.shares,
                  "blastPoints.sharePercent": userShare.sharePercentage,
                  "blastPoints.timestamp": Date.now(),
                },
                $inc: {
                  "blastPoints.pointsPending":
                    Number(userShare.points) -
                      Number(user?.blastPoints.pointsGiven) || 0,
                  "blastPoints.pointsPendingUSDB":
                    Number(userShare.pointUSDB) - Number(pointsGivenUSDB),
                  "blastPoints.pointsPendingWETH":
                    Number(userShare.pointWETH) - Number(pointsGivenWETH),
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
  const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";
  const challenge = await getBlastChallenge(addressUSDB);
  const token = await getBearerToken(challenge);
  const tokenName = "USDB";
  let batchId = 2854; //Math.floor(Date.now() / 86400 / 7 / 1000);
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
        if (user.blastPoints[`pointsPending${tokenName}`] > 0.01) {
          const transfer: Transfer = {
            toAddress: user.walletAddress,
            points: user.blastPoints[`pointsPending${tokenName}`].toFixed(2),
          };
          transferBatch.push(transfer);
        }
      }
      console.log(transferBatch[287]);
      // console.log();

      console.log(transferBatch.length);

      const request: Request = {
        pointType: "LIQUIDITY",
        transfers: transferBatch,
        secondsToFinalize: 3600,
      };
      const url = `${baseUrl}/v1/contracts/${addressUSDB}/batches/${batchId}`;
      const headers = {
        Authorization: `Bearer ${token}`,
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
  const blastBatches = await BlastBatches.find({ batchId: 2854 });
  blastBatches.forEach(async (batch: any) => {
    const bulkOperations: any = [];
    console.log(">>>>>>>>>>>>>>>", batch.batchId);
    for (const item of batch.batch) {
      bulkOperations.push({
        updateOne: {
          filter: { walletAddress: item.toAddress },
          update: {
            $inc: {},
            $set: {
              "blastPoints.pointsPending": 0,
              "blastPoints.pointsPendingUSDB": 0,
              "blastPoints.pointsPendingWETH": 0,
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

export const test = async () => {
  const noOfDays = Math.floor(
    Math.abs(blastStartDate - Date.now()) / (1000 * 60 * 60 * 24)
  ); // no of days from incentives started
  const totalShares = 86400 * noOfDays * 40;
  const blastPoints = await BlastData();
  console.log(blastPoints);
  const bulkOperations = [];
  const blastBatch: any = await BlastBatches.findOne({ batchId: 2847 });
  for (const item of blastBatch.batch) {
    const blastUser: any = await BlastUser.findOne({
      walletAddress: item.toAddress,
    });
    const sharePercent = blastUser?.blastPoints.shares / totalShares;
    console.log("percent", sharePercent);
    const points = sharePercent * blastPoints.totalPoints;
    console.log(item.toAddress, points - points * 0.001);
    bulkOperations.push({
      updateOne: {
        filter: { walletAddress: item.toAddress },
        update: {
          $inc: {
            "blastPoints.pointsGiven": points - points * 0.001,
          },
          $set: {
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
};
