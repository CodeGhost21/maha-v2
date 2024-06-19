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

// Exponential back-off retry delay between requests
axiosRetry(axios, {
  // retries: 3, // default is 3
  retryDelay: (retryCount) => {
    console.log(`next retry in: ${retryCount * 5000}`);
    return retryCount * 5000; // time interval between retries
  },
  onRetry: (retryCount) => {
    console.log("retrying count: ", retryCount);
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    return error.response?.status === 429 || error.response?.status === 520;
  },
});
interface IResponse {
  data: {
    userReserves: IData[];
  };
}

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
  liquidityRate: "0";
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
    `starting rates calculations for ${supplyTask.substr(6)} at`,
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

  // console.log(`Got reserves for ${supplyTask.substr(6)} at`, Date.now());
  // // calculate rates and update in db
  // await _calculateAndUpdateRates(reserves, supplyTask, borrowTask, stakeTask);

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
  let lastAddress = "0x0000000000000000000000000000000000000000";

  // const currentBlock = await provider.getBlockNumber();
  // block: {number: ${currentBlock - 5}}

  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  console.log("starting for new batch");
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
              {user_gte: "${lastAddress}"}
              ]
            }
        first: ${first}
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
        liquidityRate
      }
    }`;

    // TODO use axios with axios-retry
    const response = await fetch(api, {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: { "Content-Type": "application/json" },
    });

    const batch: IResponse = await response.json();

    // TODO: will break in case of too many requests, axios-retry will help in this case
    if (!batch.data || batch.data.userReserves.length == 0) break;

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

      lastAddress = data.user.id;
    });

    console.log(
      "processed batch, last address =",
      lastAddress,
      "writing in db"
    );

    // calculate rates and update in db
    await _calculateAndUpdateRates(reservesMap, supplyTask, borrowTask);

    // eslint-disable-next-line no-constant-condition
  } while (true);

  // if stake is available then get stake points
  if (stakeAPI && stakeMultiplier) {
    lastAddress = "0x0000000000000000000000000000000000000000";
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
              {user_gt: "${lastAddress}"}
              ]
            }
        first: ${first}
      ) {
          id
          balance_omni
          balance_omni_lp
        }
      }`;

      const headers = {
        "Content-Type": "application/json",
      };

      const data = await axios.post(
        stakeAPI,
        { query: query },
        { headers, timeout: 300000 }
      );

      const result = data.data.data.tokenBalances;

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
        });
      } else break;
      console.log("processed batch, last address =", lastAddress);
      // calculate rates and update in db
      await _calculateAndUpdateRates(
        reservesMap,
        supplyTask,
        borrowTask,
        stakeTask
      );

      // eslint-disable-next-line no-constant-condition
    } while (true);
  }
  // return reservesMap;
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
    userBulkWrites.push({
      updateOne: {
        filter: { walletAddress: walletAddress.toLowerCase() },
        update: {
          $set: setObj,
        },
        upsert: true,
      },
    });
  }

  await WalletUserV2.bulkWrite(userBulkWrites);
};
