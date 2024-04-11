import { UserPointTransactions } from "../database/models/userPointTransactions";
import {
  IAssignPointsTask,
  assignPoints,
  assignPointsLP,
} from "../controller/quests/assignPoints";
import {
  supplyBorrowPointsMantaMulticall,
  supplyBorrowPointsZksyncMulticall,
  supplyBorrowPointsBlastMulticall,
  supplyBorrowPointsLineaMulticall,
  supplyBorrowPointsEthereumLrtMulticall,
  supplyBorrowPointsEthereumLrtETHMulticall,
  supplyPointsBlastEzETHMulticall,
  supplyPointsEthereumLrtEzETHMulticall,
  supplyPointsLineaEzETHMulticall,
  supplyPointsZksyncLidoMulticall,
} from "../controller/quests/onChainPoints";
import _ from "underscore";
import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { getEpoch } from "../utils/epoch";

const _processBatch = async (userBatch: IWalletUserModel[], epoch: number) => {
  try {
    // get wallets
    const wallets = userBatch.map((u) => u.walletAddress);
    console.log(wallets);

    // get manta data
    const mantaData = await supplyBorrowPointsMantaMulticall(wallets);
    const zksyncData = await supplyBorrowPointsZksyncMulticall(wallets);
    const blastData = await supplyBorrowPointsBlastMulticall(wallets);
    const lineaData = await supplyBorrowPointsLineaMulticall(wallets);
    const ethLrtData = await supplyBorrowPointsEthereumLrtMulticall(wallets);
    const ethLrtEthData = await supplyBorrowPointsEthereumLrtETHMulticall(
      wallets
    );
    const lineaEzEthData = await supplyPointsLineaEzETHMulticall(wallets);
    const blastEzEthData = await supplyPointsBlastEzETHMulticall(wallets);
    const ethLrtEzEthData = await supplyPointsEthereumLrtEzETHMulticall(
      wallets
    );
    const zkSyncLidoData = await supplyPointsZksyncLidoMulticall(wallets);
    const tasks: IAssignPointsTask[] = [];

    for (let j = 0; j < wallets.length; j++) {
      const user = userBatch[j];
      const zksync = zksyncData[j];
      const manta = mantaData[j];
      const blast = blastData[j];
      const linea = lineaData[j];
      const ethLrt = ethLrtData[j];
      const ethLrtEth = ethLrtEthData[j];
      const lineaEzEth = lineaEzEthData[j];
      const blastEzEth = blastEzEthData[j];
      const ethLrtEzEth = ethLrtEzEthData[j];
      const zksyncLido = zkSyncLidoData[j];

      if (
        manta.supply.points === 0 &&
        zksync.supply.points === 0 &&
        blast.supply.points === 0 &&
        linea.supply.points === 0 &&
        ethLrt.supply.points === 0
      ) {
        tasks.push({
          userBulkWrites: [
            {
              updateOne: {
                filter: { _id: user.id },
                update: { $set: { epoch } },
              },
            },
          ],
          pointsBulkWrites: [],
          execute: async () => {
            return;
          },
        });
      }

      //manta
      if (manta.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          manta.supply.points,
          // `Daily Supply on manta chain for ${manta.supply.amount}`,
          true,
          "supplyManta",
          epoch
        );
        if (t) tasks.push(t);
      }

      if (manta.borrow.points > 0) {
        const t = await assignPointsLP(
          user.id,
          manta.borrow.points,
          // `Daily Borrow on manta chain for ${manta.borrow.amount}`,
          true,
          "borrowManta",
          epoch
        );
        if (t) tasks.push(t);
      }

      //zksync
      if (zksync.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          zksync.supply.points,
          // `Daily Supply on zksync chain for ${zksync.supply.amount}`,
          true,
          "supply",
          epoch
        );
        if (t) tasks.push(t);
      }

      if (zksync.borrow.points > 0) {
        const t = await assignPointsLP(
          user.id,
          zksync.borrow.points,
          // `Daily Borrow on zksync chain for ${zksync.borrow.amount}`,
          true,
          "borrow",
          epoch
        );
        if (t) tasks.push(t);
      }

      //blast
      if (blast.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          blast.supply.points,
          // `Daily Supply on blast chain for ${blast.supply.amount}`,
          true,
          "supplyBlast",
          epoch
        );
        if (t) tasks.push(t);
      }

      if (blast.borrow.points > 0) {
        const t = await assignPointsLP(
          user.id,
          blast.borrow.points,
          // `Daily Borrow on blast chain for ${blast.borrow.amount}`,
          true,
          "borrowBlast",
          epoch
        );
        if (t) tasks.push(t);
      }

      //linea
      if (linea.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          linea.supply.points,
          // `Daily Supply on linea chain for ${linea.supply.amount}`,
          true,
          "supplyLinea",
          epoch
        );
        if (t) tasks.push(t);
      }

      if (linea.borrow.points > 0) {
        const t = await assignPointsLP(
          user.id,
          linea.borrow.points,
          // `Daily Borrow on linea chain for ${linea.borrow.amount}`,
          true,
          "borrowLinea",
          epoch
        );
        if (t) tasks.push(t);
      }

      //ethereum Lrt
      if (ethLrt.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          ethLrt.supply.points,
          // `Daily Supply on ethLrt chain for ${ethLrt.supply.amount}`,
          true,
          "supplyEthereumLrt",
          epoch
        );
        if (t) tasks.push(t);
      }

      if (ethLrt.borrow.points > 0) {
        const t = await assignPointsLP(
          user.id,
          ethLrt.borrow.points,
          // `Daily Borrow on ethLrt chain for ${ethLrt.borrow.amount}`,
          true,
          "borrowEthereumLrt",
          epoch
        );
        if (t) tasks.push(t);
      }

      //ethereum Lrt ETH
      if (ethLrtEth.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          ethLrtEth.supply.points,
          // `Daily Supply on ethLrt chain for ETH${ethLrtEth.supply.amount}`,
          true,
          "supplyEthereumLrtEth",
          epoch
        );
        if (t) tasks.push(t);
      }

      //linea ezEth
      if (lineaEzEth.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          lineaEzEth.supply.points,
          // `Daily Supply on linea chain for ezETH${lineaEzEth.supply.amount}`,
          true,
          "supplyLineaEzEth",
          epoch
        );
        if (t) tasks.push(t);
      }

      //blast ezEth
      if (blastEzEth.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          blastEzEth.supply.points,
          // `Daily Supply on blast chain for ezETH ${blastEzEth.supply.amount}`,
          true,
          "supplyBlastEzEth",
          epoch
        );
        if (t) tasks.push(t);
      }

      //ethereumLrt ezEth
      if (ethLrtEzEth.supply.points > 0) {
        const t = await assignPointsLP(
          user.id,
          ethLrtEzEth.supply.points,
          // `Daily Supply on ethLrt chain for ezETH ${ethLrtEzEth.supply.amount}`,
          true,
          "supplyEthereumLrtEzEth",
          epoch
        );

        if (t) tasks.push(t);
      }

      //lido zksync (for now it is n frozen state)
      // if (zksyncLido.supply.points > 0) {
      //   const t = await assignPointsLP(
      //     user.id,
      //     zksyncLido.supply.points,
      //     // `Daily Supply on zksync chain for Lido ${zksyncLido.supply.amount}`,
      //     true,
      //     "supplyZkSyncLido",
      //     epoch
      //   );

      //   if (t) tasks.push(t);
      // }
    }

    // once all the db operators are accumulated; write into the DB
    await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
    await UserPointTransactions.bulkWrite(
      _.flatten(tasks.map((r) => r.pointsBulkWrites))
    );
  } catch (error) {
    console.log("processBatch error", error);
  }
};

const _dailyLpPoints = async (from: number, count: number, migrate = false) => {
  const epoch = getEpoch();
  console.log("working with epoch", epoch);

  const query = migrate
    ? { $or: [{ epoch: 0 }, { epoch: undefined }] }
    : { epoch: { $ne: epoch } };
  console.log(query);

  // const query = { walletAddress: "0x13FeFdD563A930F07B1aC8A2227Acc27c3C12946" };
  const users = await WalletUser.find(query)
    .limit(count)
    .skip(from)
    .select(["walletAddress"]);

  const chunk = 100;

  const loops = Math.floor(users.length / chunk) + 1;
  console.log(loops, users.length, from, count);

  for (let i = 0; i < loops; i++) {
    try {
      console.log("working on batch", i);
      const userBatch = users.slice(i * chunk, (i + 1) * chunk);
      await _processBatch(userBatch, epoch);
    } catch (error) {
      console.log("error", error);
      console.log("failure working with batch", i);
    }
  }

  console.log("done");
};

let lock = false;
export const dailyLpPoints = async (migrate = false) => {
  if (lock) return;
  lock = true;

  try {
    const count = await WalletUser.count({});
    await _dailyLpPoints(0, count, migrate);
  } catch (error) {
    console.log("cron failed beacuse of", error);
  }

  lock = false;
};
