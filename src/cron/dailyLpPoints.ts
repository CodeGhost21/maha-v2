import { assignPoints } from "../controller/user";
import {
  supplyBorrowPointsMantaMulticall,
  supplyBorrowPointsZksyncMulticall,
} from "../controller/onChain";
import { WalletUser } from "../database/models/walletUsers";

export const dailyLpPoints = async () => {
  const users = await WalletUser.find({}).select("walletAddress");
  const chunk = 1000;

  const loops = Math.floor(users.length / chunk);
  for (let i = 0; i < loops; i++) {
    // get wallets
    const userBatch = users.slice(i * chunk, (i + 1) * chunk);
    const wallets = userBatch.map((u) => u.walletAddress);

    // get manta data
    const mantaData = await supplyBorrowPointsMantaMulticall(wallets);
    const zksyncData = await supplyBorrowPointsZksyncMulticall(wallets);

    for (let j = 0; j < wallets.length; j++) {
      const user = userBatch[j];

      const zksync = zksyncData[j];
      const manta = mantaData[j];

      if (manta.supply.points > 0) {
        await assignPoints(
          user,
          manta.supply.points,
          `Daily Supply on manta chain for ${manta.supply.amount}`,
          true,
          "supply"
        );
      }
      if (manta.borrow.points > 0) {
        await assignPoints(
          user,
          manta.borrow.points,
          `Daily Borrow on manta chain for ${manta.borrow.amount}`,
          true,
          "borrow"
        );
      }

      if (zksync.supply.points > 0) {
        await assignPoints(
          user,
          zksync.supply.points,
          `Daily Supply on zksync chain for ${zksync.supply.amount}`,
          true,
          "supply"
        );
      }

      if (zksync.borrow.points > 0) {
        await assignPoints(
          user,
          zksync.borrow.points,
          `Daily Borrow on zksync chain for ${zksync.borrow.amount}`,
          true,
          "borrow"
        );
      }
    }
  }
};
