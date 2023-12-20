import Bluebird from "bluebird";
import * as jwt from "jsonwebtoken";
import nconf from "nconf";
import { SiweMessage } from "../siwe/lib/client";

import { onezPoints } from "./quests/onez";
import { WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { checkGuildMember } from "../output/discord";

const accessTokenSecret = nconf.get("JWT_SECRET");

const LQTYHolders: any = [];
const AAVEStakers: any = [];
const LUSDHolders: any = [];

export const updateRank = async () => {
  const users = await WalletUser.find({}).sort({ totalPoints: -1 });

  await Bluebird.mapSeries(users, async (user, index) => {
    user.rank = index + 1;
    await user.save();
  });
};

export const assignPoints = async (
  user: any,
  points: number,
  message: string,
  isAdd: boolean,
  task: any
) => {
  // console.log(43, user, isAdd);

  const previousPoints = user.totalPoints;
  const currentPoints = previousPoints + points;
  // console.log("previousPoints", previousPoints);
  // console.log("currentPoints", currentPoints);
  await UserPointTransactions.create({
    userId: user._id,
    previousPoints,
    currentPoints,
    subPoints: isAdd ? 0 : points,
    addPoints: !isAdd ? 0 : points,
    message,
  });

  user["totalPoints"] = currentPoints;
  user[task.taskId] = user[task.taskId] + task.points;
  await user.save();
  await updateRank();
};

export const dailyPointsSystem = async () => {
  const allUsers = await WalletUser.find({});

  Bluebird.mapSeries(allUsers, async (user) => {
    const points = await onezPoints(user.walletAddress);
    console.log("points", points);
    if (points.mint > 0)
      await assignPoints(user, points.mint, "Daily Mint", true, {
        taskId: "mintingONEZPoints",
        points: points.mint,
      });
    if (points.liquidity > 0)
      await assignPoints(user, points.liquidity, "Daily Liquidity", true, {
        taskId: "liquidityONEZPoints",
        points: points.mint,
      });
  });
};

export const walletVerify = async (req: any, res: any) => {
  // console.log(req);
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
        const newUser = await WalletUser.create({
          walletAddress: req.body.message.address,
          rank: usersCount + 1,
        });

        newUser.jwt = await jwt.sign(
          { id: String(newUser.id) },
          accessTokenSecret
        );
        await newUser.save();
        res.send({ success: true, newUser });
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
    if (checkDiscordFollow) {
      await assignPoints(user, 100, "Discord Follower", true, {
        taskeId: "discordFollowPoints",
        points: 10,
      });
      user.discordFollowChecked = checkDiscordFollow;
    }
  } else if (req.body.taskId === "twitterFollow") {
    user.discordFollowChecked = true;
  } else if (req.body.taskId === "LQTYHolder") {
    if (LQTYHolders.includes(user.walletAddress)) {
      user.LQTYHolderChecked = true;
      await assignPoints(user, 100, "LQTY Holder", true, {
        taskeId: "LQTYHolderPoints",
        points: 100,
      });
    }
  } else if (req.body.taskId === "AAVEStakers") {
    if (AAVEStakers.includes(user.walletAddress)) {
      user.AAVEStakersChecked = true;
      await assignPoints(user, 100, "AAVE Staker", true, {
        taskeId: "AAVEStakersPoints",
        points: 100,
      });
    }
  } else if (req.body.taskId === "LUSDHolder") {
    if (LUSDHolders.includes(user.walletAddress)) {
      user.LUSDHoldersChecked = true;
      await assignPoints(user, 100, "LUSD Holder", true, {
        taskeId: "LUSDHolderPoints",
        points: 100,
      });
    }
  }
  await user.save();
  res.json({ success: true, user });
};
