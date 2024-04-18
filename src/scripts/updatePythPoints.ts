import _ from "underscore";
import { IPythStaker } from "../controller/interface/IPythStaker";
import pythAddresses from "../addresses/pyth.json";
import { IAssignPointsTask } from "../controller/quests/assignPoints";
import { WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { updatePoints } from "./updatePoints";

export const updatePythPoints = async () => {
  const typedAddresses: IPythStaker[] = pythAddresses as IPythStaker[];
  const addresses: string[] = typedAddresses
    .map((u) => u.evm) // Map all wallet addresses
    .filter((address) => address !== "") // Filter out null and undefined values
    .map((address) => address as string);

  const existingUsers = await WalletUser.find({
    walletAddress: {
      $in: addresses.map((address: string) => address.toLowerCase().trim()),
    },
    isDeleted: false,
  });
  const tasks: IAssignPointsTask[] = [];
  for (const user of existingUsers) {
    const pythData = typedAddresses.find(
      (item) =>
        item.evm.toLowerCase().trim() ===
        user.walletAddress.toLowerCase().trim()
    );
    if (pythData) {
      const latestPoints = pythData.stakedAmount / 1e6;
      const oldPythPoints = Number(user.points.PythStaker) || 0;
      let previousPoints = oldPythPoints;
      let previousReferralPoints = 0;
      let stakedAmountDiff = oldPythPoints - latestPoints;
      if (user.referredBy) {
        previousPoints = oldPythPoints / 1.2;
        previousReferralPoints = oldPythPoints - previousPoints;
        stakedAmountDiff = (latestPoints * 1e18 - previousPoints * 1e18) / 1e18;
      }
      if (stakedAmountDiff !== 0) {
        const pointsAction = stakedAmountDiff > 0 ? "added" : "subtracted";
        const pointsMessage = `${pointsAction} ${Math.abs(
          stakedAmountDiff
        )} PythStaker points from user ${user.walletAddress}`;
        //assign points logic
        const t = await updatePoints(
          user._id,
          previousPoints,
          latestPoints,
          previousReferralPoints,
          pointsMessage,
          pointsAction === "added" ? true : false,
          "PythStaker"
        );
        if (t) tasks.push(t);
      } else {
        console.log("no difference");
      }
    }
  }
  await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
  await UserPointTransactions.bulkWrite(
    _.flatten(tasks.map((r) => r.pointsBulkWrites))
  );
};
