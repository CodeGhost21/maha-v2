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
export const nftHoldTask = async () => {
  const nftHoldTasks = await LoyaltyTask.find({ type: "hold_nft" });

  Bluebird.mapSeries(nftHoldTasks, async (task) => {
    // get all the users of this org
    const profiles = await ServerProfile.find({
      organizationId: task.organizationId,
    }).populate("userId.walletAddress");

    // go through every one and check if they meet the condtion
    return Bluebird.mapSeries(
      profiles,
      async (profile: IServerProfileModel) => {
        if (!profile.userId.walletAddress) return;

        const noOfNft = await web3.balanceOf(profile.userId.walletAddress);
        if (noOfNft == 0) return;

        // if the user is holding the nft then give daily points
        await completeLoyaltyTask(profile, "hold_nft");
      }
    );
  });
};
