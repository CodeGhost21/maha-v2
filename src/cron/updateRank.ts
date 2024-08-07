import { WalletUser } from "../database/models/walletUsers";

export const updateUsersRank = async () => {
  const batchSize = 1000;
  let skip = 0;

  const total = await WalletUser.count();

  do {
    // Retrieve users in batches
    const users = await WalletUser.find({}, { _id: 1, totalPointsV2: 1 })
      .sort({ totalPoints: -1 })
      .skip(skip)
      .limit(batchSize)
      .exec();

    if (users.length === 0) return;

    const updateCommands = users.map((user, index) => ({
      updateOne: {
        filter: { _id: user.id },
        update: {
          $set: {
            rank: index + 1 + skip,
          },
        },
      },
    }));

    await WalletUser.bulkWrite(updateCommands);

    // Update skip for the next batch
    skip += batchSize;
  } while (skip <= total);
  console.log("done updating ranks",);
};
