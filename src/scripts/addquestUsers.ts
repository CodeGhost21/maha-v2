import { WalletUser, IWalletUser } from "../database/models/walletUsers";
import miscellaneous from "../addresses/miscellaneous.json";
import { AnyBulkWriteOperation } from "mongodb";
import {
  IAssignPointsTask,
  assignPoints,
} from "../controller/quests/assignPoints";
import _ from "underscore";
import { UserPointTransactions } from "../database/models/userPointTransactions";

export const addMiscellaneousUsers = async () => {
  const miscellaneousAddresses = miscellaneous.map((item) =>
    item.address.toLowerCase().trim()
  );

  const existingUsers = await WalletUser.find({
    walletAddress: { $in: miscellaneousAddresses },
  }).select("walletAddress totalPointsV2 points");

  const existingUsersAddresses = existingUsers.map(
    (user) => user.walletAddress
  );

  const tasks: IAssignPointsTask[] = [];
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  let count = 1;
  for (const item of miscellaneous) {
    console.log(count);

    if (existingUsersAddresses.includes(item.address)) {
      const user = existingUsers.find(
        (user) => user.walletAddress === item.address
      );
      const t = await assignPoints(
        user?.id,
        Number(item.rewards),
        "Miscellaneous Points",
        true,
        "miscellaneousPoints"
      );
      if (t) tasks.push(t);
    } else {
      const newUser = new WalletUser({
        walletAddress: item.address,
        totalPointsV2: item.rewards,
        "points.miscellaneousPoints": item.rewards,
        "checked.miscellaneousPoints": true,
        "pointsUpdateTimestamp.miscellaneousPoints": Date.now(),
      });
      userBulkWrites.push({
        insertOne: {
          document: newUser,
        },
      });
    }
    count++;
  }
  await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
  await UserPointTransactions.bulkWrite(
    _.flatten(tasks.map((r) => r.pointsBulkWrites))
  );

  await WalletUser.bulkWrite(userBulkWrites);
};
