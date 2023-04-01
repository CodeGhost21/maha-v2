import Bluebird from "bluebird";
import { LoyaltyTask } from "../../database/models/loyaltyTasks";
import {
  IServerProfileModel,
  ServerProfile,
} from "../../database/models/serverProfile";
import * as web3 from "../../utils/web3";
import { completeLoyaltyTask } from "./index";

/**
 * This is a daily task that checks if the user holds a nft of a given type
 * and gives points.
 */
export const checkNftHoldTaskForAll = async () => {
  const nftHoldTasks = await LoyaltyTask.find({ type: "hold_nft" });

  return Bluebird.mapSeries(nftHoldTasks, async (task) => {
    // get all the users of this org
    const profiles = await ServerProfile.find({
      organizationId: task.organizationId,
    }).populate("userId.walletAddress");

    // go through every one and check if they meet the condtion
    return Bluebird.mapSeries(
      profiles,
      async (profile: IServerProfileModel) => {
        if (!profile.userId.walletAddress) return;

        const noOfNft = await web3.balanceOf(
          task.contractAddress,
          profile.userId.walletAddress
        );
        if (noOfNft == 0) return;

        // if the user is holding the nft then give daily points
        await completeLoyaltyTask(profile, "hold_nft");
      }
    );
  });
};

export const checkNftHoldTask = async (profile: IServerProfileModel) => {
  const task = await LoyaltyTask.findOne({
    type: "hold_nft",
    organizationId: profile.organizationId,
  });

  if (!task) return false;

  // get all the users of this org
  const user = await profile.getUser();

  // go through every one and check if they meet the condtion

  if (!user.walletAddress) return false;

  const noOfNft = await web3.balanceOf(
    task.contractAddress,
    user.walletAddress
  );

  // if the user is holding the nft then give daily points
  return noOfNft > 0;
};
