import { WalletUser, IWalletUserModel } from "../database/models/walletUsers";

export const updateRank = async () => {
  const users = await WalletUser.find({})
    .sort({ totalPointsV2: -1 })
    .select("_id");

  console.log(`updating rank of over ${users.length} users`);

  const updateCommands = users.map((user, index) => ({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $set: {
          rank: index + 1,
        },
      },
    },
  }));

  const tx = await WalletUser.bulkWrite(updateCommands);
  console.log("done updating ranks", tx);
};

export const updateUsersRank = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;

  do {
    // Retrieve users in batches
    batch = await WalletUser.find()
      .sort({ totalPointsV2: -1 })
      .skip(skip)
      .limit(batchSize)
      .exec();
    const updateCommands = batch.map((user, index) => ({
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
  } while (batch.length === batchSize);
};
