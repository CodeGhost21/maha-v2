import axios from "axios";
import { AnyBulkWriteOperation } from "mongodb";
import cache from "../utils/cache";
import { IAsset } from "../database/interface/walletUser/assets";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { IWalletUser } from "../database/interface/walletUser/walletUser";

import { Multiplier, assetDenomination } from "../controller/quests/constants";
import axiosRetry from "axios-retry";
import { WalletUser } from "../database/models/walletUsers";
import { _generateReferralCode } from "../controller/user";

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
      error.response?.status === 504 ||
      error.response?.status === 524 ||
      error.message.toLowerCase().includes("store error")
    );
  },
});

export const lpRateHourly = async (api: string, multiplier: Multiplier) => {
  await _getSupplyBorrowStakeData(api, multiplier);
  console.log("assigning referral Codes to new users");
  await addReferralCodesToNewUsers();

  console.log("done at", Date.now());
};

const _getSupplyBorrowStakeData = async (
  api: string,
  multiplier: Multiplier
) => {
  const first = 1000;
  // get cached blocks

  try {
    let lastAddressStake = "0x0000000000000000000000000000000000000000";
    do {
      const tokenBalanceMap = new Map();
      const query = `query {
        tokenBalances(where: {id_gt: "${lastAddressStake}"}, first: ${first}) {
        id
        usdz
        susdz
        maha
        szaifraxbp
        }
      }`;

      const response = await axios.post(
        api,
        { query: query },
        { headers: { "Content-Type": "application/json" }, timeout: 300000 }
      );
      const result = response.data.data.tokenBalances;

      if (result.length) {
        result.forEach((user: any) => {
          let userData =
            tokenBalanceMap.get(user.id.toLowerCase()) || ({} as IAsset);
          for (const [key, value] of Object.entries(user)) {
            if (key !== "id")
              userData[`${key}`] =
                ((value as number) *
                  (multiplier[`${key as keyof Multiplier}`] ??
                    multiplier["default"])) /
                assetDenomination[`${key as keyof IAsset}`];
          }
          tokenBalanceMap.set(user.id.toLowerCase(), userData);
          lastAddressStake = user.id;
        });
      } else break;

      // calculate rates and update in db
      await _calculateAndUpdateRates(tokenBalanceMap);

      // eslint-disable-next-line no-constant-condition
    } while (true);

    // update db cache with block number
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const _calculateAndUpdateRates = async (tokenBalances: Map<any, any>) => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  for (const [walletAddress, tokenBalance] of tokenBalances) {
    const setObj = {
      pointsPerSecond: {} as IWalletUserPoints,
    };

    //set object with token balance
    setObj.pointsPerSecond.erc20Ethereum = {
      usdz: tokenBalance.usdz / 86400,
      susdz: tokenBalance.susdz / 86400,
      maha: tokenBalance.maha / 86400,
      szaifraxbp: tokenBalance.szaifraxbp / 86400,
    } as IAsset;

    // update/insert in db
    userBulkWrites.push({
      updateOne: {
        filter: { walletAddress: walletAddress.toLowerCase() },
        update: {
          $set: { ...setObj },
        },
        upsert: true,
      },
    });
  }
  await WalletUser.bulkWrite(userBulkWrites);
};

const addReferralCodesToNewUsers = async () => {
  const userBulkWrites: any = [];
  console.log("fetching new users");
  const newUsers = await WalletUser.find({
    referralCode: {
      $eq: [],
    },
  }).select("walletAddress");

  console.log("found new users:", newUsers.length);
  newUsers.forEach((user) => {
    userBulkWrites.push({
      updateOne: {
        filter: { walletAddress: user.walletAddress },
        update: {
          $set: {
            referralCode: [_generateReferralCode()],
          },
        },
        upsert: true,
      },
    });
  });
  if (userBulkWrites.length) {
    await WalletUser.bulkWrite(userBulkWrites);
  }
  console.log("done");
};
