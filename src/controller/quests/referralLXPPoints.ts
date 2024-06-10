import axios from "axios";
import { WalletUserV2 } from "../../database/models/walletUsersV2";
import { ILXPPoints } from "../../database/interface/lineaLXP/lxpPoints";
import { AnyBulkWriteOperation } from "mongodb";
import { LXPUsers } from "../../database/models/LXPPoints";

const getLXPPoints = async () => {
  console.log("getting users and points");

  const url =
    "https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/linea/getUserPointsSearch?user=0x0f6e98a756a40dd050dc78959f45559f98d3289d";

  const response = await axios.get(url);
  const xpData = response.data.length > 0 ? response.data[0].xp : 0;
  return xpData;
};

// daily cron once
export const distrbuteLXPPoints = async () => {
  const batchSize = 1000;
  let skipCount = 0;
  let hasMoreUsers = true;

  console.log("Starting the LXP points assignment process...");
  const totalLxpPoints = await getLXPPoints();
  const supplyLXPPointsTotal = totalLxpPoints * 0.4;
  const borrowLXPPointsTotal = totalLxpPoints * 0.2;
  const stakeLXPPointsTotal = totalLxpPoints * 0.4;

  console.log(
    "totalLxpPoints,supplyLXPPointsTotal,borrowLXPPointsTotal,stakeLXPPointsTotal",
    totalLxpPoints,
    supplyLXPPointsTotal,
    borrowLXPPointsTotal,
    stakeLXPPointsTotal
  );
  const total = await WalletUserV2.aggregate([
    {
      $group: {
        _id: null,
        totalSupplyPoints: { $sum: "$totalSupplyPoints" },
        totalBorrowPoints: { $sum: "$totalBorrowPoints" },
        totalStakePoints: { $sum: "$totalStakePoints" },
      },
    },
  ]);

  try {
    do {
      const userLXPBulkWrites: AnyBulkWriteOperation<ILXPPoints>[] = [];
      const users = await WalletUserV2.find({
        walletAddress: { $ne: "" },
        $or: [
          { "pointsPerSecond.supplyLinea": { $exists: true } },
          { "pointsPerSecond.borrowLinea": { $exists: true } },
          { "pointsPerSecond.stakeLinea": { $exists: true } },
        ],
      })
        .limit(batchSize)
        .skip(skipCount)
        .select(
          "walletAddress totalSupplyPoints totalBorrowPoints totalStakePoints"
        )
        .lean();

      console.log(
        `Processing batch starting at skip count ${skipCount}, Users: ${users.length}`
      );

      if (users.length === 0) {
        hasMoreUsers = false;
      } else {
        users.forEach((user) => {
          let UserLXPPoints = 0;
          const totalSupplyPoints = user.totalSupplyPoints;
          const totalBorrowPoints = user.totalBorrowPoints;
          const totalStakePoints = user.totalStakePoints;

          if (totalSupplyPoints) {
            const supplySharePercent =
              (totalSupplyPoints / total[0].totalSupplyPoints) * 100;
            UserLXPPoints += supplyLXPPointsTotal * supplySharePercent;
          }
          if (totalBorrowPoints) {
            const borrowSharePercent =
              (totalBorrowPoints / total[0].totalBorrowPoints) * 100;
            UserLXPPoints += borrowLXPPointsTotal * borrowSharePercent;
          }
          if (totalStakePoints) {
            const stakeSharePercent =
              (totalStakePoints / total[0].totalStakePoints) * 100;
            UserLXPPoints += stakeLXPPointsTotal * stakeSharePercent;
          }

          userLXPBulkWrites.push({
            updateOne: {
              filter: { walletAddress: user.walletAddress },
              update: {
                $inc: {
                  xp: UserLXPPoints,
                },
              },
              upsert: true,
            },
          });
        });

        console.log("updating db for", users.length, "users");
        await LXPUsers.bulkWrite(userLXPBulkWrites);
        console.log(
          `Batch starting at skip count ${skipCount} processed successfully`
        );
        skipCount += users.length;
      }
    } while (hasMoreUsers);
  } catch (error) {
    console.error("An error occurred while assigning points to users:", error);
  }
  console.log("Points assignment process completed.");
};
