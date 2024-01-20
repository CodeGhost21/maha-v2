import { WalletUser } from "../database/models/walletUsers";

export const updateRank = async () => {
  const users = await WalletUser.find({})
    .sort({ totalPoints: -1 })
    .select("_id");

  console.log(`updating rank of over ${users.length} users`);

  const updateCommands = users.map((user, index) => ({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $set: {
          rank: index,
        },
      },
    },
  }));

  await WalletUser.bulkWrite(updateCommands);
  console.log("done updating ranks");
};
