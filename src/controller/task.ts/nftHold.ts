import Bluebird from "bluebird";
import { Organization } from "../../database/models/organization";
import {
  IServerProfileModel,
  ServerProfile,
} from "../../database/models/serverProfile";
import { ITaskModel, Task } from "../../database/models/tasks";
import * as web3 from "../../utils/web3";
import { completeTask } from ".";

export const nftHoldTask = async () => {
  const nftHoldTasks = await Task.find({ type: "hold_nft" });
  if (nftHoldTasks.length > 0) {
    Bluebird.mapSeries(nftHoldTasks, async (task: ITaskModel) => {
      const org = await Organization.findOne({ _id: task.organizationId });
      if (org) {
        const orgUsers: any = await ServerProfile.find({
          organizationId: org.id,
        }).populate("userId");
        Bluebird.mapSeries(orgUsers, async (user: IServerProfileModel) => {
          if (user.userId.walletAddress !== undefined) {
            const noOfNft = await web3.balanceOf(user.userId.walletAddress);
            if (noOfNft > 0) {
              await completeTask(user, "hold_nft");
            }
          }
        });
      }
    });
  }
};

// export const test = async () => {
//   const noOfNft = await web3.balanceOf(
//     "0xFc2A07c3c71B993a623BD33a9fCd6f5f8C3ba3da"
//   );
//   let totalMahaX = 0;
//   for (let i = 0; i < noOfNft; i++) {
//     const nftId = await web3.tokenOfOwnerByIndex(
//       "0xFc2A07c3c71B993a623BD33a9fCd6f5f8C3ba3da",
//       i
//     );
//     const lockedData: any = await web3.locked(nftId);
//     totalMahaX += lockedData.amount / 10 ** 18;
//   }
// };
