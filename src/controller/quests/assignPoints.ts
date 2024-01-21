import { WalletUser } from "../../database/models/walletUsers";
import { UserPointTransactions } from "../../database/models/userPointTransactions";
import { referralPercent } from "./constants";

const saveUserPoints = async (
  userId: string,
  previousPoints: number,
  currentPoints: number,
  isAdd: boolean,
  points: number,
  message: string
) => {
  await UserPointTransactions.create({
    userId,
    previousPoints,
    currentPoints,
    subPoints: isAdd ? 0 : points,
    addPoints: !isAdd ? 0 : points,
    message,
  });
};

export const assignPoints = async (
  userId: string,
  points: number,
  message: string,
  isAdd: boolean,
  taskId: string
) => {
  const user = await WalletUser.findById(userId);
  if (!user) return;

  const previousPoints = Number(user.totalPoints) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  if (points < 0.01 || isNaN(points)) return;

  if (user.referredBy !== undefined) {
    const referredByUser = await WalletUser.findOne({ _id: user.referredBy });
    if (referredByUser) {
      const referralPoints = Number(points * referralPercent) || 0;
      latestPoints = latestPoints + referralPoints;
      newMessage = message + " plus referral points";

      // assign referral points to referred by user
      await saveUserPoints(
        referredByUser.id,
        referredByUser.points.referral,
        referredByUser.points.referral + referralPoints,
        isAdd,
        referralPoints,
        "referral points"
      );

      referredByUser.points.referral =
        referredByUser.points.referral + referralPoints;
      referredByUser.totalPoints = referredByUser.totalPoints + referralPoints;
      await referredByUser.save();
    }
  }

  const currentPoints = previousPoints + latestPoints;
  await saveUserPoints(
    user.id,
    previousPoints,
    currentPoints,
    isAdd,
    latestPoints,
    newMessage
  );

  user["totalPoints"] = currentPoints;

  // @ts-ignore
  user[taskId] = Number(user[taskId] || 0) + latestPoints;
  // @ts-ignore
  user[`${taskId}Checked`] = true;

  await user.save();
};
