import Bluebird from "bluebird";
import * as jwt from "jsonwebtoken";
import nconf from "nconf";
import { SiweMessage } from "../siwe/lib/client";

import { onezPoints, supplyBorrowPoints } from "./onChain";
import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { checkGuildMember } from "../output/discord";

const accessTokenSecret = nconf.get("JWT_SECRET");

const LQTYHolders: any = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
  "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
];
const AAVEStakers: any = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
  "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
];
const LUSDHolders: any = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
];

const MAHAStakers: any = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
];

const generateReferralCode = async () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let referralCode = "";
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
};

export const updateRank = async () => {
  const users = await WalletUser.find({}).sort({ totalPoints: -1 });

  await Bluebird.mapSeries(users, async (user, index) => {
    user.rank = index + 1;
    await user.save();
  });
};

const saveUserPoints = async (
  user: any,
  previousPoints: number,
  currentPoints: number,
  isAdd: boolean,
  points: number,
  message: string
) => {
  await UserPointTransactions.create({
    userId: user,
    previousPoints,
    currentPoints,
    subPoints: isAdd ? 0 : points,
    addPoints: !isAdd ? 0 : points,
    message,
  });
};

export const assignPoints = async (
  user: any,
  points: number,
  message: string,
  isAdd: boolean,
  taskId: string
) => {
  const previousPoints = user.totalPoints;
  let latestPoints = points;
  let newMessage = message;
  if (user.referredBy !== undefined) {
    const referredByUser = await WalletUser.findOne({ _id: user.referredBy });
    if (referredByUser) {
      const referralPoints = points * 0.2;
      latestPoints = points + referralPoints;
      newMessage = message + " plus referral points";
      //assign referral points to referred by user
      await saveUserPoints(
        referredByUser.id,
        referredByUser.referralPoints,
        referredByUser.referralPoints + referralPoints,
        isAdd,
        referralPoints,
        "referral points"
      );
      referredByUser.referralPoints =
        referredByUser.referralPoints + referralPoints;
      referredByUser.totalPoints = referredByUser.totalPoints + referralPoints;
      await referredByUser.save();
    }
  }
  const currentPoints = previousPoints + latestPoints;
  await saveUserPoints(
    user.id,
    previousPoints,
    currentPoints,
    isAdd,
    latestPoints,
    newMessage
  );

  user["totalPoints"] = currentPoints;
  user[`${taskId}Points`] = user[`${taskId}Points`] + latestPoints;
  user[`${taskId}Checked`] = true;
  await user.save();
  await updateRank();
};

export const dailyPointsSystem = async () => {
  const allUsers = await WalletUser.find({});
  Bluebird.mapSeries(allUsers, async (user) => {
    //onez points
    // const { mint, liquidity } = await onezPoints(user.walletAddress);
    // if (mint > 0)
    //   await assignPoints(user, mint, "Daily Mint", true, "mintingONEZ");
    // if (liquidity > 0)
    //   await assignPoints(
    //     user,
    //     liquidity,
    //     "Daily Liquidity",
    //     true,
    //     "liquidityONEZ"
    //   );

    //supply and borrow points
    console.log("supplyBorrowPoints");

    const { supply, borrow } = await supplyBorrowPoints(user.walletAddress);
    if (supply > 0) {
      await assignPoints(user, supply, "Daily Supply", true, "supply");
    }
    if (borrow > 0) {
      await assignPoints(user, borrow, "Daily Borrow", true, "borrow");
    }
  });
};

export const walletVerify = async (req: any, res: any) => {
  const { message, signature } = req.body;
  const siweMessage = new SiweMessage(message);
  try {
    const result = await siweMessage.verify({ signature });
    if (result.data.address === req.body.message.address) {
      const user = await WalletUser.findOne({
        walletAddress: result.data.address,
      });
      if (user) {
        user.jwt = await jwt.sign({ id: String(user.id) }, accessTokenSecret);
        await user.save();
        res.send({ success: true, user });
      } else {
        const usersCount = await WalletUser.count();
        const referralCode = await generateReferralCode();
        const newUser = await WalletUser.create({
          walletAddress: req.body.message.address,
          rank: usersCount + 1,
          referralCode: referralCode ? referralCode : null,
        });

        //referred by user added to user model
        if (req.body.referredByCode !== "") {
          const referredUser = await WalletUser.findOne({
            referralCode: req.body.referredByCode,
          });
          if (referredUser) {
            newUser.referredBy = referredUser.id;
            await newUser.save();
          }
          // else {
          //   res.send({
          //     success: false,
          //     message: "referral code doesn't match",
          //   });
          // }
        }

        //add jwt token
        newUser.jwt = await jwt.sign(
          { id: String(newUser.id) },
          accessTokenSecret
        );
        await newUser.save();
        res.send({ success: true, user: newUser });
      }
    } else {
      res.send({
        success: false,
        message: "Signature verification failed. Invalid signature.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const getLeaderBoard = async (req: any, res: any) => {
  const allUsers = await WalletUser.find({})
    .sort({ rank: 1 })
    .select("totalPoints rank walletAddress");
  res.send(allUsers);
};

export const fetchMe = async (req: any, res: any) => {
  const user = await WalletUser.findOne({ _id: req.user.id });
  res.json({ success: true, user });
};

export const checkTask = async (req: any, res: any) => {
  const user = req.user;
  if (req.body.taskId === "discordFollow") {
    const checkDiscordFollow = await checkGuildMember(user.discordId);
    if (checkDiscordFollow && !user.discordFollow) {
      await assignPoints(user, 1000, "Discord Follower", true, req.body.taskId);
      user.discordFollowChecked = checkDiscordFollow;
      await user.save();
    }
  } else if (req.body.taskId === "twitterFollow" && !user.twitterFollow) {
    await assignPoints(user, 1000, "Twitter Follower", true, req.body.taskId);
    user.twitterFollowChecked = true;
    await user.save();
  } else if (req.body.taskId === "LQTYHolder") {
    if (LQTYHolders.includes(user.walletAddress) && !user.LQTYHolderChecked) {
      user.LQTYHolderChecked = true;
      await assignPoints(user, 10000, "LQTY Holder", true, req.body.taskId);
    }
  } else if (req.body.taskId === "AAVEStaker" && !user.AAVEStakersChecked) {
    if (AAVEStakers.includes(user.walletAddress)) {
      user.AAVEStakersChecked = true;
      await assignPoints(user, 10000, "AAVE Staker", true, req.body.taskId);
    }
  } else if (req.body.taskId === "LUSDHolder" && !user.LUSDHolderChecked) {
    if (LUSDHolders.includes(user.walletAddress)) {
      user.LUSDHolderChecked = true;
      await assignPoints(user, 10000, "LUSD Holder", true, req.body.taskId);
    }
  } else if (req.body.taskId === "MAHAStaker" && !user.MAHAStakerChecked) {
    if (MAHAStakers.includes(user.walletAddress)) {
      user.MAHAStakerChecked = true;
      await assignPoints(user, 100000, "MAHA Staker", true, req.body.taskId);
    }
  }

  res.json({ success: true, user });
};
