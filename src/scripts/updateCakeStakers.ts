import _ from "underscore";
import { updateCakeStake } from "../controller/quests/stakeCake";
import { IAssignPointsTask } from "../controller/quests/assignPoints";
import { WalletUser } from "../database/models/walletUsers";
import { updatePoints } from "./updatePoints";
import { UserPointTransactions } from "../database/models/userPointTransactions";

export const updateCakeStakers = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;

  do {
    batch = await WalletUser.find({ isDeleted: false })
      .skip(skip)
      .limit(batchSize);
    const addresses: string[] = batch.map((u) => u.walletAddress) as string[];
    const result = await updateCakeStake(addresses);
    const tasks: IAssignPointsTask[] = [];
    for (const user of batch) {
      const cakeData: any = result.find(
        (item) =>
          item.address.toLowerCase().trim() ===
          user.walletAddress.toLowerCase().trim()
      );
      if (!cakeData) continue;

      const latestPoints = cakeData.stakedAmount;
      const oldPythPoints = Number(user.points.CakeStaker) || 0;
      let previousPoints = oldPythPoints;
      let previousReferralPoints = 0;
      let stakedAmountDiff = latestPoints - oldPythPoints;

      if (user.referredBy) {
        previousPoints = oldPythPoints / 1.2;
        previousReferralPoints = oldPythPoints - previousPoints;
        stakedAmountDiff = (latestPoints * 1e18 - previousPoints * 1e18) / 1e18;
      }
      if (stakedAmountDiff !== 0) {
        const pointsAction = stakedAmountDiff > 0 ? "added" : "subtracted";
        const pointsMessage = `${pointsAction} ${Math.abs(
          stakedAmountDiff
        )} CakeStakers points from user ${user.walletAddress}`;
        //assign points logic
        const t = await updatePoints(
          user._id,
          previousPoints,
          latestPoints,
          previousReferralPoints,
          pointsMessage,
          pointsAction === "added" ? true : false,
          "CakeStaker"
        );
        if (t) tasks.push(t);
      } else {
        console.log("no difference");
      }
    }
    await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
    await UserPointTransactions.bulkWrite(
      _.flatten(tasks.map((r) => r.pointsBulkWrites))
    );
    skip += batchSize;
  } while (batch.length === batchSize);
};
