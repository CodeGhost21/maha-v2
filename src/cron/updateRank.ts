import { WalletUser } from "../database/models/walletUsers";

export const updateUsersRank = async () => {
  const batchSize = 1000;
  let skip = 0;

  const total = await WalletUser.count();

  do {
    // Retrieve users in batches
    const users = await WalletUser.find({ isDeleted: false })
      .sort({ totalPointsV2: -1 })
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

    const tx = await WalletUser.bulkWrite(updateCommands);
    console.log("done updating ranks", tx);

    // Update skip for the next batch
    skip += batchSize;
  } while (skip <= total);
};
