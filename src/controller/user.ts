import * as ethers from "ethers";
import Bluebird, { is } from "bluebird";
import { onezPoints } from "./quests/onez";
import { IUserModel, User } from "../database/models/user";
import { UserPoints } from "../database/models/userPoints";

//connect wallet verify
export const walletVerify = async (req: any, res: any) => {
  try {
    const userReq = req.user;
    const userData = await User.findOne({ _id: userReq.id });

    if (userData) {
      const result = ethers.verifyMessage(userData.userID || "", req.body.hash);
      if (result === req.body.address) {
        userData["walletAddress"] = req.body.address;
        await userData.save();
        // const discordMsgEmbed = new MessageEmbed()
        //   .setColor("#F07D55")
        //   .setDescription("Congratulation your wallet has been connected");
        // const payload = {
        //   embeds: [discordMsgEmbed],
        // };
        // sendMessage(nconf.get("CHANNEL_WALLET_CONNECT"), payload);
        res.send({ success: true });
      } else {
        res.send({ success: false });
      }
    } else {
      res.send({ success: false });
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
  console.log(43, user, isAdd);

  const previousPoints = user.totalPoints;
  const currentPoints = previousPoints + points;
  console.log("previousPoints", previousPoints);
  console.log("currentPoints", currentPoints);
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
