import Bluebird from "bluebird";
import * as jwt from "jsonwebtoken";
import nconf from "nconf";
import { SiweMessage } from "siwe";

import { onezPoints } from "./quests/onez";
import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { UserPoints } from "../database/models/userPoints";
import { checkGuildMember } from "../output/discord";

const accessTokenSecret = nconf.get("JWT_SECRET");

//connect wallet verify
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

export const assignPoints = async (
  user: IWalletUserModel,
  points: number,
  message: string,
  isAdd: boolean
) => {
  // console.log(43, user, isAdd);

  const previousPoints = user.totalPoints;
  const currentPoints = previousPoints + points;
  // console.log("previousPoints", previousPoints);
  // console.log("currentPoints", currentPoints);
  await UserPoints.create({
    userId: user._id,
    previousPoints,
    currentPoints,
    subPoints: isAdd ? 0 : points,
    addPoints: !isAdd ? 0 : points,
    message,
  });

  user["totalPoints"] = currentPoints;
  await user.save();
  await updateRank();
};

export const dailyPointsSystem = async () => {
  const allUsers = await WalletUser.find({});

  Bluebird.mapSeries(allUsers, async (user) => {
    const points = await onezPoints(user.walletAddress);
    if (points.mint > 0)
      await assignPoints(user, points.mint, "Daily Mint", true);
    if (points.liquidity > 0)
      await assignPoints(user, points.liquidity, "Daily Liquidity", true);
  });
};

export const getLeaderBoard = async (req: any, res: any) => {
  const allUsers = await WalletUser.find({})
    .sort({ rank: 1 })
    .select("totalPoints rank walletAddress");
  res.send(allUsers);
};

export const addDiscordProfile = async (req: any, res: any) => {
  const user = req.user;
  const checkDiscordFollow = await checkGuildMember(req.body.discordId);
  user.discordId = req.body.discordId;
  user.discordFollow = checkDiscordFollow;
  await user.save();
  res.send({ success: true, user });
};

export const updateRank = async () => {
  const users = await WalletUser.find({}).sort({ totalPoints: -1 });

  await Bluebird.mapSeries(users, async (user, index) => {
    user.rank = index + 1;
    await user.save();
  });
};
