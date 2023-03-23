import { Request, Response } from "express";
import { use } from "passport";
import * as web3 from "../utils/web3";
import { sendRequest } from "../library/sendRequest";
import { imageComparing } from "../library/imageComparer";
import {
  ILoyaltySubmission,
  LoyaltySubmission,
} from "../database/models/loyaltySubmission";
import { ILoyaltyTask, LoyaltyTask } from "../database/models/loyaltyTasks";
import { Organization } from "../database/models/organisation";
import { PointTransaction } from "../database/models/pointTransaction";
import { IUserModel, User } from "../database/models/user";
import { sendFeedDiscord } from "../utils/sendFeedDiscord";
import { fetchTwitterProfile } from "./user";
import { organizationLoyaltyTask } from "./organization";

const profileImageComparing = async (
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  // resize image for image comparing
  const noOfNFTs = await web3.balanceOf(walletAddress);

  if (noOfNFTs == 0) return false;

  for (let i = 0; i < noOfNFTs; i++) {
    const nftId = await web3.tokenOfOwnerByIndex(walletAddress, i);
    const tokenUri = await web3.tokenURI(nftId);

    const data = await sendRequest<string>("get", tokenUri);
    const nftMetadata = JSON.parse(data);

    const response = await imageComparing(
      profileImageUrl,
      nftMetadata.image,
      size
    );

    if (response) return true;
  }

  return false;
};

const checkLoyalty = async (user: any, loyaltyType: string) => {
  if (loyaltyType === "gm") {
    if (user.totalGMs > 0) return true;
  } else if (loyaltyType === "twitterProfile") {
    const twitterProfile = await fetchTwitterProfile(user);
    const twitterCheck = await profileImageComparing(
      twitterProfile,
      48,
      user.walletAddress
    );
    return twitterCheck;
  }
  return false;
};

export const allLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const loyaltyTasks = await LoyaltyTask.find({
      organizationId: userDetails.organizationId,
    });
    res.send(loyaltyTasks);
  }
};

export const addLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const checkLoyaltyTask = await LoyaltyTask.findOne({
      $or: [{ name: req.body.name }, { type: req.body.type }],
    });
    if (!checkLoyaltyTask) {
      const newLoyaltyTask = new LoyaltyTask({
        name: req.body.name,
        type: req.body.type,
        instruction: req.body.instruction,
        weight: req.body.weight,
        organizationId: userDetails.organizationId,
      });
      await newLoyaltyTask.save();
      res.send(newLoyaltyTask);
    } else {
      res.send("already added");
    }
  } else {
    res.send("not authorized");
  }
};

export const deleteLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });

  if (userDetails) {
    const checkLoyaltyTask = await LoyaltyTask.findOne({
      _id: req.body.taskId,
    });
    if (checkLoyaltyTask) {
      await LoyaltyTask.deleteOne({ _id: checkLoyaltyTask._id });
      res.send({ success: true });
    }
  } else {
    res.send({ success: false });
  }
};

export const completeLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id });
  if (userDetails) {
    const checkLoyaltySubmission = await LoyaltySubmission.findOne({
      type: req.body.type,
      approvedBy: userDetails.id,
      organizationId: userDetails.organizationId,
    });
    if (!checkLoyaltySubmission) {
      const verifyLoyalty = await checkLoyalty(userDetails, req.body.type);
      if (verifyLoyalty) {
        const organizationDetails: any = await Organization.findOne({
          _id: userDetails.organizationId,
        });
        const fetchLoyaltyTask: any = await LoyaltyTask.findOne({
          organizationId: userDetails.organizationId,
          type: req.body.type,
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

        await sendFeedDiscord(`${user.discordName} said gm`);
        res.send("done");
      }
    } else {
      res.send("already added");
    }
  }
};

export const userLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails: any = await User.findOne({ _id: user.id });
  const organizationDetails: any = await Organization.findOne({
    _id: userDetails.organizationId,
  });
  if (userDetails) {
    const loyaltyTasks = await organizationLoyaltyTask(organizationDetails.id);
    const allLoyaltySubmission = await LoyaltySubmission.find({
      organizationId: userDetails.organizationId,
      approvedBy: userDetails.id,
    });

    const loyaltySubmittedTypes = allLoyaltySubmission.map(
      (item: ILoyaltySubmission) => item.type
    );
    let completedLoyaltySubmission: any = {};
    loyaltyTasks.map((taskType: string) => {
      if (loyaltySubmittedTypes.includes(taskType))
        completedLoyaltySubmission[taskType] = true;
      else completedLoyaltySubmission[taskType] = false;
    });

    res.send(completedLoyaltySubmission);
  }
};

export const loyaltyTaskTypes = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails: any = await User.findOne({ _id: user.id });
  if (userDetails) {
    let allTypes: any = await LoyaltyTask.find({
      organizationId: userDetails.organizationId,
    });

    allTypes = allTypes.map((i: ILoyaltyTask) => i.type);
    res.send(allTypes);
  }
};
