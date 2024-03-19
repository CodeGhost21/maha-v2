import { WalletUser } from "../database/models/walletUsers";

export const updateWalletAddresses = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;
  const bulkOperations = [];
  do {
    batch = await WalletUser.find({}).skip(skip).limit(batchSize); // Use lean() to get plain JavaScript objects instead of Mongoose documents
    for (const user of batch) {
      console.log("walletAddress", user.walletAddress);

      if (
        user.walletAddress &&
        user.walletAddress !== user.walletAddress.toLowerCase()
      ) {
        bulkOperations.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: { walletAddress: user.walletAddress.toLowerCase() },
            },
          },
        });
      }
    }
    skip += batchSize;
  } while (batch.length > 0);

  if (bulkOperations.length > 0) {
    await WalletUser.bulkWrite(bulkOperations);
    console.log(`Updated ${bulkOperations.length} wallet addresses.`);
  }
};
