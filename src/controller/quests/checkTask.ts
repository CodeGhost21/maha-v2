import {
  IWalletUserModel,
  WalletUser,
} from "../../database/models/walletUsers";
import { checkGuildMember } from "../../output/discord";
import { points } from "./constants";
import { assignPoints } from "./assignPoints";
import { Request, Response, NextFunction } from "express";
import pythAddresses from "../../addresses/pyth.json";
import { IPythStaker } from "../interface/IPythStaker";

export const checkTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as IWalletUserModel;
  const { taskId } = req.body;
  let success = false;
  try {
    if (taskId === "discordFollow") {
      const checkDiscordFollow = await checkGuildMember(user.discordId);
      user.checked.discordFollow = checkDiscordFollow;
      await user.save();

      if (checkDiscordFollow) {
        const task = await assignPoints(
          user.id,
          points.discordFollow,
          "Discord Follower",
          true,
          "discordFollow"
        );
        await task?.execute();
        success = true;
      }
    } else if (req.body.taskId === "PythStaker") {
      //checked if user is already a pyth staker
      if (!user.checked.PythStaker) {
        const typedAddresses: IPythStaker[] = pythAddresses as IPythStaker[];
        const pythData = typedAddresses.find(
          (item) =>
            item.evm.toLowerCase().trim() ===
            user.walletAddress.toLowerCase().trim()
        );
        if (pythData) {
          const stakedAmount = pythData.stakedAmount / 1e6;
          if (stakedAmount > 0) {
            const task = await assignPoints(
              user.id,
              stakedAmount,
              "Pyth Staker",
              true,
              "PythStaker"
            );
            await task?.execute();
            success = true;
          }
        }
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

    const newUser = await WalletUser.findById(user.id);
    res.json({ success: success, user: newUser });
  } catch (error) {
    return next(error);
  }
};
