import Bluebird from "bluebird";
import * as jwt from "jsonwebtoken";
import nconf from "nconf";
import { SiweMessage } from "siwe";

import { onezPoints } from "./quests/onez";
import { IUserModel, User } from "../database/models/user";
import { UserPoints } from "../database/models/userPoints";

const accessTokenSecret = nconf.get("JWT_SECRET");

//connect wallet verify
export const walletVerify = async (req: any, res: any) => {
  // console.log(req);
  const { message, signature } = req.body;
  const siweMessage = new SiweMessage(message);
  try {
    const result = await siweMessage.verify({ signature });
    if (result.data.address === req.body.message.address) {
      const user = await User.findOne({
        walletAddress: result.data.address,
      });
      if (user) {
        user.jwt = await jwt.sign({ id: String(user.id) }, accessTokenSecret);
        await user.save();
        res.send({ success: true, user });
      } else {
        const newUser = await User.create({
          walletAddress: req.body.message.address,
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
  user: IUserModel,
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
};

export const dailyPointsSystem = async () => {
  const allUsers = await User.find({});

  Bluebird.mapSeries(allUsers, async (user) => {
    const points = await onezPoints(user.walletAddress);
    await assignPoints(user, points.mint, "Daily Mint", true);
    await assignPoints(user, points.liquidity, "Daily Liquidity", true);
  });
};

export const getLeaderBoard = async (req: any, res: any) => {
  const allUsers = await User.find({}).sort({ totalPoints: -1 });
  res.send(allUsers);
};
