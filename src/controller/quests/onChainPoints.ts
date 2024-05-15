import { AbstractProvider } from "ethers";
import { ethers, Provider } from "ethers";
import CoinGecko from "coingecko-api";
import axios from "axios";
import { mantaProvider, zksyncProvider } from "../../utils/providers";
import nconf from "nconf";
import poolABI from "../../abis/Pool.json";
import cache from "../../utils/cache";
import { IWalletUserModel } from "../../database/models/walletUsersV2";
import { Multiplier } from "./constants";
const CoinGeckoClient = new CoinGecko();

export const getPriceCoinGecko = async () => {
  try {
    const data = await CoinGeckoClient.simple.price({
      ids: [
        "ethereum",
        "renzo-restaked-eth",
        "lido-dao",
        "kelp-dao-restaked-eth",
        "zerolend",
      ],
      vs_currencies: ["usd"],
    });
    const priceList = {
      // TODO: return keys in lowercase
      ETH: data.data.ethereum.usd,
      ezETH: data.data["renzo-restaked-eth"].usd,
      lido: data.data["lido-dao"].usd,
      rsEth: data.data["kelp-dao-restaked-eth"].usd,
      zerolend: data.data.zerolend.usd,
    };
    cache.set("coingecko:PriceList", priceList, 60 * 60);
    return priceList;
  } catch (error) {
    console.error("Error fetching Ethereum price:", error);
    throw error;
  }
};

const getContract = async (
  contractAddress: string,
  abi: any,
  provider: Provider
) => {
  return new ethers.Contract(contractAddress, abi, provider);
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
    const currentBlock = p.getBlockNumber();
    const graphQuery = `query {
      userReserves(
        block: {number: ${currentBlock}}
        where: {
          and: [
            {
              or: [
                { currentTotalDebt_gt: 0 },
                { currentATokenBalance_gt: 0 }
              ]
            },
            {user_in: ${userBatch.map((u) => u.walletAddress)}},
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
    const data = await axios.post(api, { query: graphQuery }, { headers });
    const result = data.data.userReserves;

    const supply = new Map();
    const borrow = new Map();

    result.map((userReserve: any) => {
      const asset = userReserve.reserve.symbol.toLowerCase();
      const supplyData = supply.get(userReserve.user.id) || {};
      const supplyMultiplier = multiplier[`${asset}Supply` as keyof Multiplier];
      supplyData[asset] =
        userReserve.currentATokenBalance *
        marketPrice[`${userReserve.reserve.symbol}`.toLocaleLowerCase()] *
        (supplyMultiplier ? supplyMultiplier : multiplier.defaultSupply);
      supply.set(userReserve.user.id, supplyData);

      const borrowData = borrow.get(userReserve.user.id) || {};
      const borrowMultiplier = multiplier[`${asset}Borrow` as keyof Multiplier];
      borrowData[asset] =
        userReserve.currentTotalDebt *
        marketPrice[`${userReserve.reserve.symbol}`.toLocaleLowerCase()] *
        (borrowMultiplier ? borrowMultiplier : multiplier.defaultBorrow);
      borrow.set(userReserve.user.id, borrowData);
    });

    /*
    return
    {
      supply: {
        "address1": {
          "asset1": value1,
          "asset2": value2,
        }
        "address2": {
          "asset1": value1,
          "asset3": value3,
        }
      },
      borrow: {
        "address1": {
          "asset1": value1,
          "asset2": value2,
        }
        "address2": {
          "asset1": value1,
          "asset3": value3,
        }
      }
    }
    */
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
  const poolManta = await getContract(
    nconf.get("MANTA_POOL"),
    poolABI,
    mantaProvider
  );

  const poolZksync = await getContract(
    nconf.get("ZKSYNC_POOL"),
    poolABI,
    zksyncProvider
  );

  const poolMantaResult = await poolManta.getUserAccountData(walletAddress);
  const poolZksyncResult = await poolZksync.getUserAccountData(walletAddress);

  const supplyManta = Number(poolMantaResult[0]) / 1e8;
  const supplyZksync = Number(poolZksyncResult[0]) / 1e8;

  const totalSupply = supplyManta + supplyZksync;
  if (totalSupply > 100 && totalSupply <= 1000) {
    return "shrimp";
  } else if (totalSupply > 1000 && totalSupply <= 10000) {
    return "shark";
  } else if (totalSupply > 10000 && totalSupply <= 100000) {
    return "whale";
  } else if (totalSupply > 100000) {
    return "gigaWhale";
  } else {
    return "no role";
  }
};
