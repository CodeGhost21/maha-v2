import { BigNumber } from "bignumber.js";
import nconf from "nconf";
import { ethers } from "ethers";
import { WebSocketProvider } from "@ethersproject/providers";

import { User } from "../database/models/user";
import { PointTransaction } from "../database/models/pointTransaction";
const Contract = require("web3-eth-contract");
import MAHAX from "../abi/MahaXAbi.json";

Contract.setProvider(nconf.get("ETH_RPC"));

const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"));
const e18 = new BigNumber(10).pow(18);

const calculateMAHAX = (nftData: any) => {
  const maha = new BigNumber(nftData.amount);
  const duration = nftData.end - nftData.start;
  // years4 should be duration of maha locked
  const years4 = 86400 * 365 * 4;
  return maha.multipliedBy(duration).div(years4).div(e18).toNumber();
};

export const dailyMahaXRewards = async () => {
  const allUsers = await User.find({ walletAddress: { $ne: "" } });
  if (allUsers.length > 0) {
    allUsers.map(async (user: any) => {
      const noOfNFTs = await mahaXContract.methods
        .balanceOf(user.walletAddress)
        .call();
      if (noOfNFTs > 0) {
        console.log(noOfNFTs);
        let totalMahaX = 0;
        for (let i = 0; i < noOfNFTs; i++) {
          const nftId = await mahaXContract.methods
            .tokenOfOwnerByIndex(user.walletAddress, i)
            .call();
          const nftAmount = await mahaXContract.methods.locked(nftId).call();
          const mahaX = await calculateMAHAX(nftAmount);
          totalMahaX += mahaX;
        }

        const newPointsTransaction = new PointTransaction({
          userId: user.id,
          type: "NFT Locked",
          totalPoints: user.totalPoints + Math.floor(totalMahaX),
          addPoints: Math.floor(totalMahaX),
        });
        await newPointsTransaction.save();
        user["totalPoints"] = user.totalPoints + Math.floor(totalMahaX);
        await user.save();
      }
    });
  }
};

export const nftTransfer = async () => {
  const chainWss = nconf.get("POLYGON_RPC_WSS");
  const contract = nconf.get("POLYGON_LOCKER_ADDRESS");

  const provider = new WebSocketProvider(chainWss);
  const MahaXContract = new ethers.Contract(contract, MAHAX, provider);

  MahaXContract.on("Transfer", async (...args) => {
    const from = args[0];
    const to = args[1];

    const toUser = await User.findOne({ walletAddress: to });
    if (toUser) {
      const newPointsTransaction = new PointTransaction({
        userId: toUser.id,
        type: "NFT Transfer",
        totalPoints: toUser.totalPoints + 10,
        addPoints: 10,
      });
      await newPointsTransaction.save();

      toUser["totalPoints"] = toUser.totalPoints + 10;
      await toUser.save();
    }

    const fromUser = await User.findOne({ walletAddress: from });
    if (fromUser) {
      const newPointsTransaction = new PointTransaction({
        userId: fromUser.id,
        type: "NFT Transfer",
        totalPoints: fromUser.totalPoints - 10,
        subPoints: 10,
      });
      await newPointsTransaction.save();

      fromUser["totalPoints"] = fromUser.totalPoints - 10;
      await fromUser.save();
    }
  });
};
