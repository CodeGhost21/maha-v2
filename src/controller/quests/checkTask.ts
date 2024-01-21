import { IWalletUserModel } from "../../database/models/walletUsers";
import { checkGuildMember } from "../../output/discord";
import { points } from "./constants";
import { assignPoints } from "./assignPoints";
import { Request, Response } from "express";

export const checkTask = async (req: Request, res: Response) => {
  const user = req.user as IWalletUserModel;

  if (req.body.taskId === "discordFollow") {
    const checkDiscordFollow = await checkGuildMember(user.discordId);
    if (checkDiscordFollow && !user.checked.discordFollow) {
      const task = await assignPoints(
        user.id,
        points.discordFollow,
        "Discord Follower",
        true,
        req.body.taskId
      );

      await task?.execute();
      user.checked.discordFollow = checkDiscordFollow;
      await user.save();
    }
  }

  // } else if (req.body.taskId === "twitterFollow" && !user.checked.twitterFollow) {
  //   await assignPoints(
  //     user.id,
  //     points.twitterFollow,
  //     "Twitter Follower",
  //     true,
  //     req.body.taskId
  //   );
  //   user.checked.twitterFollow = true;
  //   await user.save();
  // } else if (req.body.taskId === "LQTYHolder") {
  //   if (LQTYHolders.includes(user.walletAddress) && !user.checked.LQTYHolder) {
  //     user.LQTYHolderChecked = true;
  //     await assignPoints(
  //       user.id,
  //       points.LQTYHolder,
  //       "LQTY Holder",
  //       true,
  //       req.body.taskId
  //     );
  //   }
  // } else if (req.body.taskId === "AAVEStaker" && !user.AAVEStakersChecked) {
  //   if (AAVEStakers.includes(user.walletAddress)) {
  //     user.AAVEStakersChecked = true;
  //     await assignPoints(
  //       user.id,
  //       points.AAVEStaker,
  //       "AAVE Staker",
  //       true,
  //       req.body.taskId
  //     );
  //   }
  // } else if (req.body.taskId === "MAHAStaker" && !user.MAHAStakerChecked) {
  //   if (MAHAStakers.includes(user.walletAddress)) {
  //     user.MAHAStakerChecked = true;
  //     await assignPoints(
  //       user.id,
  //       points.MAHAStaker,
  //       "MAHA Staker",
  //       true,
  //       req.body.taskId
  //     );
  //   }
  // }
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
