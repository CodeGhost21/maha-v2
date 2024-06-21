import { WalletUserV2 } from "../database/models/walletUsersV2";

export const updateUsersRank = async () => {
  const batchSize = 1000;
  let skip = 0;

  const total = await WalletUserV2.count();

  do {
    // Retrieve users in batches
    const users = await WalletUserV2.find({}, { _id: 1, totalPointsV2: 1 })
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

    await WalletUserV2.bulkWrite(updateCommands);
    
    // Update skip for the next batch
    skip += batchSize;
  } while (skip <= total);
  console.log("done updating ranks", );
};
