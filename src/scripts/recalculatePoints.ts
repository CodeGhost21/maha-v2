import { WalletUser } from "../database/models/walletUsers";

const _recalculatePoints = async (from: number, count: number) => {
  const users = await WalletUser.find({}).limit(count).skip(from);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    user.totalPoints =
      user.supplyPoints +
      user.borrowPoints +
      user.discordFollowPoints +
      user.gmPoints;

    await user.save();
  }
};

export const recalculatePoints = async () => {
  const count = await WalletUser.count({});
  await _recalculatePoints(0, count);

  const chunk = 1000;
  const loops = Math.floor(count / chunk) + 1;

  for (let i = 0; i < loops; i++) {
    await _recalculatePoints(i * chunk, chunk);
  }
};
