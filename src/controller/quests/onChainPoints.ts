import { AbstractProvider } from "ethers";
import CoinGecko from "coingecko-api";
import axios from "axios";
import { mantaProvider, zksyncProvider } from "../../utils/providers";
import cache from "../../utils/cache";
import { IWalletUserModel } from "../../database/models/walletUsersV2";
import {
  apiManta,
  apiZKSync,
  assetDenomination,
  coingeckoIds,
  mantaMultiplier,
  minSupplyAmount,
  Multiplier,
  zeroveDenom,
  zksyncMultiplier,
} from "./constants";
import { getTotalPoints } from "../user";
import { IAsset } from "src/database/interface/walletUser/assets";
const CoinGeckoClient = new CoinGecko();

export const getPriceCoinGecko = async () => {
  try {
    const data = await CoinGeckoClient.simple.price({
      ids: coingeckoIds,
      vs_currencies: ["usd"],
    });

    const priceList = {
      //stable coins
      usdc: 1,
      usdt: 1,
      usdb: 1,
      lusd: 1,
      busd: 1,
      mai: 1,
      dai: 1,

      eth: data.data.ethereum.usd,
      ezeth: data.data["renzo-restaked-eth"].usd,
      rseth: data.data["kelp-dao-restaked-eth"].usd,
      wrseth: data.data["kelp-dao-restaked-eth"].usd,
      pufeth: data.data.pufeth.usd,
      grai: data.data.grai.usd,
      wbtc: data.data["wrapped-bitcoin"].usd,
      weeth: data.data["wrapped-eeth"],
      sweth: data.data.sweth.usd,
      weth: data.data.weth.usd,
      wokb: data.data.okb.usd,
      cake: 2.6, //could not fetch from coingecko
      mute: data.data.mute.usd,
      sword: data.data.sword.usd,
      vc: data.data.velocore.usd,
      wsteth: data.data["wrapped-steth"].usd,
      unieth: data.data["universal-eth"].usd,
      manta: data.data["manta-network"].usd,
      stone: data.data["stakestone-ether"].usd,
      tia: data.data.celestia.usd,
      wusdm: 1, //data.data["wrapped-usdm"].usd, //price not listed on coingecko

      zerolend: data.data.zerolend.usd,
    };
    cache.set("coingecko:PriceList", priceList, 60 * 60);

    return priceList;
  } catch (error) {
    console.error("Error fetching Ethereum price:", error);
    throw error;
  }
};

export const supplyBorrowPointsGQL = async (
  api: string,
  userBatch: IWalletUserModel[],
  p: AbstractProvider,
  multiplier: Multiplier
) => {
  try {
    let marketPrice: any = await cache.get("coingecko:PriceList");
    if (!marketPrice) {
      marketPrice = await getPriceCoinGecko();
    }
    // const currentBlock = await p.getBlockNumber();
    // block: {number: ${currentBlock - 5}},

    const graphQuery = `query {
      userReserves(
        where: {
          and: [
            {
              or: [
                { currentTotalDebt_gt: 0 },
                { currentATokenBalance_gt: 0 }
              ]
            },
            {user_in: [${userBatch.map((u) => `"${u.walletAddress}"`)}]},
          ]
        }
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
    }`;

    const headers = {
      "Content-Type": "application/json",
    };
    const data = await axios.post(
      api,
      { query: graphQuery },
      { headers, timeout: 600000 }
    ); // 5 minute
    if (!data.data.data.userReserves) {
      console.log(data.data.error);
      throw new Error(`no reserves found for batch, ${data.data.error}`);
    }
    const result = data.data.data.userReserves;

    const supply = new Map();
    const borrow = new Map();

    result.map((userReserve: any) => {
      const asset = userReserve.reserve.symbol.toLowerCase() as keyof IAsset;
      const supplyData = supply.get(userReserve.user.id) || {};
      const supplyMultiplier = multiplier[`${asset}Supply` as keyof Multiplier];

      supplyData[asset] =
        (Number(userReserve.currentATokenBalance) /
          assetDenomination[`${asset}`]) *
        Number(marketPrice[`${asset}`]) *
        (supplyMultiplier ? supplyMultiplier : multiplier.defaultSupply);
      supply.set(userReserve.user.id, supplyData);

      const borrowData = borrow.get(userReserve.user.id) || {};
      const borrowMultiplier = multiplier[`${asset}Borrow` as keyof Multiplier];
      borrowData[asset] =
        (Number(userReserve.currentTotalDebt) / assetDenomination[`${asset}`]) *
        Number(marketPrice[`${asset}`]) *
        (borrowMultiplier ? borrowMultiplier : multiplier.defaultBorrow);
      borrow.set(userReserve.user.id, borrowData);
    });

    return {
      supply,
      borrow,
    };
  } catch (error) {
    console.log("error while fetching points");
    throw error;
  }
};

export const userLpData = async (walletAddress: string) => {
  const mantaData = await supplyBorrowPointsGQL(
    apiManta,
    [{ walletAddress } as IWalletUserModel],
    mantaProvider,
    mantaMultiplier
  );

  const zksyncData = await supplyBorrowPointsGQL(
    apiZKSync,
    [{ walletAddress } as IWalletUserModel],
    zksyncProvider,
    zksyncMultiplier
  );

  const mantaSupply = mantaData.supply.get(walletAddress);
  const zksyncSupply = zksyncData.supply.get(walletAddress);

  const mantaPoints = getTotalPoints(mantaSupply);
  const zksyncPoints = getTotalPoints(zksyncSupply);

  const totalSupply = mantaPoints + zksyncPoints;
  if (totalSupply > minSupplyAmount && totalSupply <= minSupplyAmount * 10) {
    return "shrimp";
  } else if (
    totalSupply > minSupplyAmount * 10 &&
    totalSupply <= minSupplyAmount * 100
  ) {
    return "shark";
  } else if (
    totalSupply > minSupplyAmount * 100 &&
    totalSupply <= minSupplyAmount * 1000
  ) {
    return "whale";
  } else if (totalSupply > minSupplyAmount * 1000) {
    return "gigaWhale";
  } else {
    return "no role";
  }
};

export const votingPowerGQL = async (
  api: string,
  userBatch: IWalletUserModel[]
) => {
  try {
    let marketPrice: any = await cache.get("coingecko:PriceList");
    if (!marketPrice) {
      marketPrice = await getPriceCoinGecko();
    }

    const graphQuery = `query {
      tokenBalances(where: {id_in: [${userBatch.map(
        (u) => `"${u.walletAddress}"`
      )}]}) {
        id
        balance
      }
    }`;

    const headers = {
      "Content-Type": "application/json",
    };
    const data = await axios.post(
      api,
      { query: graphQuery },
      { headers, timeout: 300000 }
    ); // 5 minute
    const result = data.data.data.tokenBalances;

    const tokenBalances = new Map();

    if (result.length) {
      result.forEach((user: any) => {
        tokenBalances.set(user.id, user.balance / zeroveDenom);
      });
    }
    /**
     * {
        "data": {
          "tokenBalances": [
            {
              "id": "0x00204acd48e582f710652b264145102edb0166a6",
              "address": "0x00204acd48e582f710652b264145102edb0166a6",
              "balance": "743555511352105530187"
            },
            {
              "id": "0x00fc2b542ec0f5a7eaa3f348b842be0628bec2a6",
              "address": "0x00fc2b542ec0f5a7eaa3f348b842be0628bec2a6",
              "balance": "1592157985540334855403"
        },
     */
    // console.log(tokenBalances);
    return tokenBalances;
  } catch (error) {
    console.log("error while fetching stake data");
    throw error;
  }
};
