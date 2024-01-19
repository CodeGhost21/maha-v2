import * as jwt from "jsonwebtoken";
import nconf from "nconf";
import { SiweMessage } from "../siwe/lib/client";
import cache from "./cache";
import { WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { checkGuildMember } from "../output/discord";
import { points, referralPercent } from "./constants";

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
  const previousPoints = Number(user.totalPoints) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  if (points < 0.01 || isNaN(points)) return;

  if (user.referredBy !== undefined) {
    const referredByUser = await WalletUser.findOne({ _id: user.referredBy });
    if (referredByUser) {
      const referralPoints = Number(points * referralPercent) || 0;
      latestPoints = latestPoints + referralPoints;
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
  user[`${taskId}Points`] = Number(user[`${taskId}Points`] || 0) + latestPoints;
  user[`${taskId}Checked`] = true;
  await user.save();
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
  const cachedData: any = cache.get("lb:leaderBoard");
  if (cachedData) return res.json(JSON.parse(cachedData));
  res.json([]);
};

export const fetchMe = async (req: any, res: any) => {
  const user = await WalletUser.findOne({ _id: req.user.id });
  res.json({ success: true, user });
};

export const checkTask = async (req: any, res: any) => {
  const user = req.user;
  if (req.body.taskId === "discordFollow") {
    const checkDiscordFollow = await checkGuildMember(user.discordId);
    if (checkDiscordFollow && !user.discordFollowChecked) {
      await assignPoints(
        user,
        points.discordFollow,
        "Discord Follower",
        true,
        req.body.taskId
      );
      user.discordFollowChecked = checkDiscordFollow;
      await user.save();
    }
  } else if (req.body.taskId === "twitterFollow" && !user.twitterFollow) {
    await assignPoints(
      user,
      points.twitterFollow,
      "Twitter Follower",
      true,
      req.body.taskId
    );
    user.twitterFollowChecked = true;
    await user.save();
  } else if (req.body.taskId === "LQTYHolder") {
    if (LQTYHolders.includes(user.walletAddress) && !user.LQTYHolderChecked) {
      user.LQTYHolderChecked = true;
      await assignPoints(
        user,
        points.LQTYHolder,
        "LQTY Holder",
        true,
        req.body.taskId
      );
    }
  } else if (req.body.taskId === "AAVEStaker" && !user.AAVEStakersChecked) {
    if (AAVEStakers.includes(user.walletAddress)) {
      user.AAVEStakersChecked = true;
      await assignPoints(
        user,
        points.AAVEStaker,
        "AAVE Staker",
        true,
        req.body.taskId
      );
    }
  } else if (req.body.taskId === "MAHAStaker" && !user.MAHAStakerChecked) {
    if (MAHAStakers.includes(user.walletAddress)) {
      user.MAHAStakerChecked = true;
      await assignPoints(
        user,
        points.MAHAStaker,
        "MAHA Staker",
        true,
        req.body.taskId
      );
    }
  }
  // else if (req.body.taskId === "LUSDHolder" && !user.LUSDHolderChecked) {
  //   if (LUSDHolders.includes(user.walletAddress)) {
  //     user.LUSDHolderChecked = true;
  //     await assignPoints(
  //       user,
  //       points.LUSDHolder,
  //       "LUSD Holder",
  //       true,
  //       req.body.taskId
  //     );
  //   }
  // }

  res.json({ success: true, user });
};
