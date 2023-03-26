import { Request, Response } from "express";
import {
  ILoyaltySubmission,
  LoyaltySubmission,
} from "../database/models/loyaltySubmission";
import { LoyaltyTask } from "../database/models/loyaltyTasks";
import { Organization } from "../database/models/organization";
import { PointTransaction } from "../database/models/pointTransaction";
import { IServerProfileModel } from "../database/models/serverProfile";
import { IUserModel, User } from "../database/models/user";
import BadRequestError from "../errors/BadRequestError";

export const completeLoyaltyTask = async (
  userDiscordId: string,
  type: string
) => {
  const userDetails = await User.findOne({ userID: userDiscordId });
  if (userDetails) {
    const checkLoyaltySubmission = await LoyaltySubmission.findOne({
      type: type,
      approvedBy: userDetails.id,
      organizationId: userDetails.organizationId,
    });
    if (!checkLoyaltySubmission) {
      const verifyLoyalty = await checkLoyalty(userDetails, type);
      if (verifyLoyalty) {
        const organizationDetails: any = await Organization.findOne({
          _id: userDetails.organizationId,
        });
        const fetchLoyaltyTask: any = await LoyaltyTask.findOne({
          organizationId: userDetails.organizationId,
          type: type,
        });
        const newLoyaltySubmission = new LoyaltySubmission({
          approvedBy: userDetails.id,
          organizationId: organizationDetails.id,
          type: fetchLoyaltyTask.type,
          totalWeight: fetchLoyaltyTask.weight,
          boost: organizationDetails.maxBoost * userDetails.loyaltyWeight,
          loyalty: userDetails.loyaltyWeight,
        });

        await newLoyaltySubmission.save();
        const totalLoyaltyWeight =
          userDetails.loyaltyWeight + fetchLoyaltyTask.weight;

        userDetails.loyaltyWeight = totalLoyaltyWeight;
        await userDetails.save();

        const newPointTransaction = new PointTransaction({
          userId: userDetails.id,
          taskId: fetchLoyaltyTask.id,
          type: fetchLoyaltyTask.type,
          totalPoints: totalLoyaltyWeight,
          addPoints: fetchLoyaltyTask.weight,
          boost: organizationDetails.maxBoost * userDetails.loyaltyWeight,
          loyalty: userDetails.loyaltyWeight,
        });
        await newPointTransaction.save();

        // res.json("done");
        return "Task completed successfully.";
      }
      return "Task failed. Please check if you have completed the task.";
    }
    return "You have already completed this task";
  }
  return "Something went wrong. Please try again.";
};

const calculateLoyaltyPoints = (loyalty: any) => {
  const discordPoints = loyalty.discordProfile ? 0.25 : 0;
  const twitterPoints = loyalty.twitterProfile ? 0.25 : 0;
  const gmPoints = loyalty.gm ? 0.25 : 0;
  const openseaPoints = loyalty.opensea ? 0.25 : 0;

  return openseaPoints + gmPoints + twitterPoints + discordPoints;
};

export const checkLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  // const loyalty = await user.getLoyalty();
  // const pointsBefore = calculateLoyaltyPoints(loyalty);

  // elvin's bot -> data (submission) + loyaltyTaskId

  // -> validate based on the loyalty

  // if (req.body.task === "gm") loyalty.gm = user.totalGMs > 0;

  // // check for updated twitter profile
  // if (req.body.task === "twitterProfile") {
  //   // todo; refresh the user's twitter profile by fetching the latest profile
  //   const twitterProfile = await fetchTwitterProfile(user);
  //   const twitterCheck = await profileImageComparing(
  //     twitterProfile,
  //     48,
  //     user.walletAddress
  //   );
  //   loyalty.twitterProfile = twitterCheck;
  // }

  // // check for updated discord profile
  // if (req.body.task === "discordProfile") {
  //   // todo refresh the discord profile by fetching the latest one using
  //   // the user's access token
  //   const discordProfile = await fetchDiscordProfile(user);
  //   const discordCheck = await profileImageComparing(
  //     `https://cdn.discordapp.com/avatars/${user.userID}/${discordProfile}.jpg`,
  //     128,
  //     user.walletAddress
  //   );
  //   loyalty.discordProfile = discordCheck;
  // }

  // if (req.body.task === "intro") {
  //   // todo
  // }

  // if (req.body.task === "opensea") {
  //   const response = await web3.isOpenseaApproved(user.walletAddress);
  //   loyalty.opensea = !response;
  // }

  // const pointsAfter = calculateLoyaltyPoints(loyalty);
  // loyalty.totalLoyalty = pointsAfter;
  // await loyalty.save();

  // if (pointsBefore != pointsAfter)

  // res.json({ pointsBefore, pointsAfter, loyalty });
};

export const getLoyalty = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  // const userLoyalty = await user.getLoyalty();
  // res.json(userLoyalty);
  res.json({});
};
