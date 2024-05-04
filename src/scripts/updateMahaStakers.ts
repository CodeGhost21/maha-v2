import _ from "underscore";
import { IAssignPointsTask } from "../controller/quests/assignPoints";
import { WalletUser } from "../database/models/walletUsers";
import { updatePoints } from "./updatePoints";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { updateMAHAStake } from "../controller/quests/stakeMAHA";
import { stakePtsPerMAHA } from "../controller/quests/constants";

export const updateMahaXPoints = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUser.find({
      walletAddress: { $exists: true, $ne: null, $not: { $eq: "" } },
      isDeleted: false,
    })
      .skip(skip)
      .limit(batchSize); // Use lean() to get plain JavaScript objects instead of Mongoose documents
    // console.log("batch", batch);
    const tasks: IAssignPointsTask[] = [];
    const addresses: string[] = batch.map((u) => u.walletAddress);
    const result = await updateMAHAStake(addresses);
    for (const user of batch) {
      const mahaXData: any = result.find(
        (item) =>
          item.address.toLowerCase().trim() ===
          user.walletAddress.toLowerCase().trim()
      );

      if (!mahaXData) continue;

      const latestPoints = mahaXData.stakedAmount * stakePtsPerMAHA;
      const oldMahaXPoints = Number(user.points.MahaXStaker) || 0;
      let previousPoints = oldMahaXPoints;
      let previousReferralPoints = 0;
      let stakedAmountDiff = latestPoints - oldMahaXPoints;

      if (user.referredBy) {
        previousPoints = oldMahaXPoints / 1.2;
        previousReferralPoints = oldMahaXPoints - previousPoints;
        stakedAmountDiff = (latestPoints * 1e18 - previousPoints * 1e18) / 1e18;
      }
      if (stakedAmountDiff !== 0) {
        const pointsAction = stakedAmountDiff > 0 ? "added" : "subtracted";
        const pointsMessage = `${pointsAction} ${Math.abs(
          stakedAmountDiff
        )} MahaXStakers points from user ${user.walletAddress}`;
        //assign points logic
        const t = await updatePoints(
          user._id,
          previousPoints,
          latestPoints,
          previousReferralPoints,
          pointsMessage,
          pointsAction === "added" ? true : false,
          "MahaXStaker"
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
