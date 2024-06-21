import axios from "axios";
import { AnyBulkWriteOperation } from "mongodb";
import cache from "../utils/cache";
import { IAsset } from "../database/interface/walletUser/assets";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { IWalletUser } from "../database/interface/walletUser/walletUser";

import { getPriceCoinGecko } from "../controller/quests/onChainPoints";
import {
  Multiplier,
  assetDenomination,
  zeroveDenom,
} from "../controller/quests/constants";
import axiosRetry from "axios-retry";
import { WalletUserV2 } from "../database/models/walletUsersV2";
import { CacheDB } from "../database/models/cache";
import { ICache } from "../database/interface/walletUser/cache";

// Exponential back-off retry delay between requests
axiosRetry(axios, {
  retries: 5, // default is 3
  retryDelay: (retryCount) => {
    console.log(`next retry in: ${retryCount * 5000}`);
    return retryCount * 10000; // time interval between retries
  },
  onRetry: (retryCount) => {
    console.log("retrying count: ", retryCount);
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return (
      error.response?.status === 429 ||
      error.response?.status === 520 ||
      error.response?.status === 408 ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504
    );
  },
});

interface IData {
  user: {
    id: string;
  };
  currentTotalDebt: string;
  currentATokenBalance: string;
  reserve: {
    underlyingAsset: string;
    symbol: string;
    name: string;
  };
}

export const lpRateHourly = async (
  api: string,
  multiplier: Multiplier,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  stakeTask?: keyof IWalletUserPoints,
  stakeAPI?: string,
  stakeMultiplier?: number
) => {
  // get supply and borrow data
  console.log(
    `starting rates calculations for ${supplyTask.substring(6)} at`,
    Date.now()
  );

  await _getSupplyBorrowStakeData(
    api,
    multiplier,
    supplyTask,
    borrowTask,
    stakeTask,
    stakeAPI,
    stakeMultiplier
  );

  console.log("done at", Date.now());
};

const _getSupplyBorrowStakeData = async (
  api: string,
  multiplier: Multiplier,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  stakeTask?: keyof IWalletUserPoints,
  stakeAPI?: string,
  stakeMultiplier?: number
) => {
  const first = 1000;
  // let lastAddress = "0x0000000000000000000000000000000000000000";
  let skip = 0;
  // const currentBlock = await provider.getBlockNumber();
  let supplyBorrowBlock = 0;
  const cacheDb = await CacheDB.findOne({ cacheId: "cache-blocks-queried" });
  if (cacheDb) {
    supplyBorrowBlock =
      (cacheDb[
        `blockNumber${supplyTask.substring(6)}` as keyof ICache
      ] as number) ?? 0;
  }

  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }

  try {
    do {
      const reservesMap = new Map();
      const query = `{
      userReserves(
        where: {
          and: [
            {
              or: [
                {currentTotalDebt_gt: 0},
                {currentATokenBalance_gt: 0}
                ]
              },
              ]
            }
        first: ${first},
        skip: ${skip},
        block: {number_gte: ${supplyBorrowBlock}}
      ) {
        user {
          id
        }
        currentTotalDebt
        currentATokenBalance
        reserve {
          underlyingAsset
          symbol
          name
        }
      }
      _meta {
        block {
          number
        }
      }
    }`;

      const response = await axios.post(
        api,
        { query: query },
        { headers: { "Content-Type": "application/json" }, timeout: 300000 }
      );
      const batch = response.data;

      if (batch.data.userReserves.length === 0) {
        break;
      }

      // calculate supply and borrow points for each asset
      batch.data.userReserves.forEach((data: IData) => {
        const asset = data.reserve.symbol.toLowerCase() as keyof IAsset;
        // @dev to calculate rates for asset, it must be available in assetDenomination in src/controller/quests/constants.ts
        if (assetDenomination[`${asset}`]) {
          const userData = reservesMap.get(data.user.id.toLowerCase()) || {
            supply: {},
            borrow: {},
          };
          const supplyMultiplier =
            multiplier[`${asset}Supply` as keyof Multiplier];

          userData.supply[asset] = Number(data.currentATokenBalance)
            ? (Number(data.currentATokenBalance) /
                assetDenomination[`${asset}`]) *
              Number(marketPrice[`${asset}`]) *
              (supplyMultiplier ? supplyMultiplier : multiplier.defaultSupply)
            : 0;

          const borrowMultiplier =
            multiplier[`${asset}Borrow` as keyof Multiplier];
          userData.borrow[asset] = Number(data.currentTotalDebt)
            ? (Number(data.currentTotalDebt) / assetDenomination[`${asset}`]) *
              Number(marketPrice[`${asset}`]) *
              (borrowMultiplier ? borrowMultiplier : multiplier.defaultBorrow)
            : 0;

          reservesMap.set(data.user.id.toLowerCase(), userData);
        }
      });

      skip += batch.data.userReserves.length;
      supplyBorrowBlock = batch.data._meta.block.number;
      console.log(
        "fetched block from",
        supplyTask.substring(6),
        supplyBorrowBlock,
        "skipping entries:",
        skip
      );
      // calculate rates and update in db
      await _calculateAndUpdateRates(reservesMap, supplyTask, borrowTask);

      // eslint-disable-next-line no-constant-condition
    } while (true);

    // update db cache with block number
    console.log(
      `blockNumber${supplyTask.substring(6)}`,
      "saved for supply borrow task",
      supplyBorrowBlock
    );

    await CacheDB.updateOne(
      {
        cacheId: "cache-blocks-queried",
      },
      {
        $set: {
          [`blockNumber${supplyTask.substring(6)}`]: supplyBorrowBlock ?? 0,
        },
      },
      { upsert: true }
    );
    // if stake is available then get stake points
    if (stakeAPI && stakeMultiplier) {
      let stakeBlock = 0;
      if (cacheDb) {
        stakeBlock =
          (cacheDb[
            `blockNumberStake${supplyTask.substring(6)}` as keyof ICache
          ] as number) ?? 0;
      }
      let lastAddressStake = "0x0000000000000000000000000000000000000000";

      do {
        const reservesMap = new Map();
        const query = `query {
        tokenBalances(
        where: {
          and: [
            {
              or: [
                {balance_omni_gt: 0},
                {balance_omni_lp_gt: 0}
                ]
              },
              {id_gt: "${lastAddressStake}"}
              ]
            }
        first: ${first}
        block: {number_gte: ${stakeBlock}}
      ) {
          id
          balance_omni
          balance_omni_lp
        }
        _meta {
          block {
            number
          }
        }
      }`;

        const headers = {
          "Content-Type": "application/json",
        };

        const response = await axios.post(
          stakeAPI,
          { query: query },
          { headers, timeout: 300000 }
        );
        const result = response.data.data.tokenBalances;

        if (result.length) {
          result.forEach((user: any) => {
            const userData = reservesMap.get(user.id.toLowerCase()) || {
              stake: {},
            };

            userData.stake = {
              zero:
                (user.balance_omni / zeroveDenom) *
                marketPrice.zerolend *
                stakeMultiplier,
              lp:
                (user.balance_omni_lp / zeroveDenom) *
                marketPrice.zerolend *
                stakeMultiplier,
            };

            reservesMap.set(user.id.toLowerCase(), userData);
            lastAddressStake = user.id;
          });
        } else break;

        stakeBlock = response.data.data._meta.block.number;
        console.log(
          "fetched block from",
          supplyTask.substring(6),
          stakeAPI,
          "last staker address",
          lastAddressStake
        );
        // calculate rates and update in db
        await _calculateAndUpdateRates(
          reservesMap,
          supplyTask,
          borrowTask,
          stakeTask
        );

        // eslint-disable-next-line no-constant-condition
      } while (true);

      // update db cache with block number
      console.log("lastblock saved for stake task", supplyTask.substring(6));
      await CacheDB.updateOne(
        {
          cacheId: "cache-blocks-queried",
        },
        {
          $set: {
            [`blockNumberStake${supplyTask.substring(6)}`]: stakeBlock,
          },
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const _calculateAndUpdateRates = async (
  reservesMap: Map<any, any>,
  supplyTask?: keyof IWalletUserPoints,
  borrowTask?: keyof IWalletUserPoints,
  stakeTask?: keyof IWalletUserPoints
) => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  for (const [walletAddress, reserves] of reservesMap) {
    const setObj: any = {};

    const supplyReserves = reserves.supply ?? 0;
    const borrowReserves = reserves.borrow ?? 0;
    const stakeReserves = reserves.stake ?? 0;

    if (supplyTask && supplyReserves) {
      const pointsPerSecondSupply: { [key: string]: number } = {};
      const supplyKeys = Object.keys(supplyReserves);
      if (supplyKeys.length) {
        supplyKeys.forEach((key) => {
          pointsPerSecondSupply[`${key}`] = supplyReserves[key] / 86400;
        });
        setObj[`pointsPerSecond.${supplyTask}`] = pointsPerSecondSupply;
      }
    }

    if (borrowTask && borrowReserves) {
      const pointsPerSecondBorrow: { [key: string]: number } = {};
      const borrowKeys = Object.keys(borrowReserves);
      if (borrowKeys.length) {
        borrowKeys.forEach((key) => {
          pointsPerSecondBorrow[`${key}`] = borrowReserves[key] / 86400;
        });
        setObj[`pointsPerSecond.${borrowTask}`] = pointsPerSecondBorrow;
      }
    }

    if (stakeTask && stakeReserves) {
      const pointsPerSecondStake: { [key: string]: number } = {};
      const stakeKeys = Object.keys(stakeReserves);
      if (stakeKeys.length) {
        stakeKeys.forEach((key) => {
          pointsPerSecondStake[key] = stakeReserves[key] / 86400;
        });
      }

      setObj[`pointsPerSecond.${stakeTask}`] = pointsPerSecondStake;
    }

    // update/insert in db
    const tx = userBulkWrites.push({
      updateOne: {
        filter: { walletAddress: walletAddress.toLowerCase() },
        update: {
          $set: setObj,
        },
        upsert: true,
      },
    });
  }
  console.log("writing in db");
  await WalletUserV2.bulkWrite(userBulkWrites);
};
