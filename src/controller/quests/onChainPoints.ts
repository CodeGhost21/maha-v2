import { AbstractProvider } from "ethers";
import CoinGecko from "coingecko-api";
import axios from "axios";
import { mantaProvider, zksyncProvider } from "../../utils/providers";
import cache from "../../utils/cache";
import { IWalletUserModel } from "../../database/models/walletUsersV2";
import {
  apiManta,
  apiZKSync,
  mantaMultiplier,
  minSupplyAmount,
  Multiplier,
  zksyncMultiplier,
} from "./constants";
const CoinGeckoClient = new CoinGecko();

export const getPriceCoinGecko = async () => {
  try {
    const data = await CoinGeckoClient.simple.price({
      ids: [
        "ethereum",
        "renzo-restaked-eth",
        "kelp-dao-restaked-eth",
        "zerolend",
        "pufeth",
        "grai",
        "wrapped-bitcoin",
        "wrapped-eeth",
        "sweth",
        "weth",
        "okb",
        // "pancakeswap",
        "mute",
        "sword",
        "velocore",
        "wrapped-steth",
        "universal-eth",
        "manta-network",
        "stakestone-ether",
        "celestia",
        "wrapped-usdm",
      ],
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
      okb: data.data.okb.usd,
      cake: 2.6, //could not fetch from coingecko
      mute: data.data.mute.usd,
      sword: data.data.sword.usd,
      vc: data.data.velocore.usd,
      wsteth: data.data["wrapped-steth"].usd,
      unieth: data.data["universal-eth"].usd,
      manta: data.data["manta-network"].usd,
      stone: data.data["stakestone-ether"].usd,
      tia: data.data.celestia.usd,
      wusdm: data.data["wrapped-usdm"].usd, //price not listed on coingecko

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
    const currentBlock = await p.getBlockNumber();
    console.log(currentBlock - 10); // cannot fetch data for latest block no

    const graphQuery = `query {
      userReserves(
        block: {number: ${currentBlock - 10}}
        where: {
          and: [
            {
              or: [
                { currentTotalDebt_gt: 0 },
                { currentATokenBalance_gt: 0 }
              ]
            },
            {user_in: ["0x961e45e3666029709c3ac50a26319029cde4e067","0xf152da370fa509f08685fa37a09ba997e41fb65b","0x4724682104fdcbe5f8cdec1da2b9aa8a023c935b"]},
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
    const result = data.data.data.userReserves;

    const supply = new Map();
    const borrow = new Map();

    result.map((userReserve: any) => {
      const asset = userReserve.reserve.symbol.toLowerCase();
      const supplyData = supply.get(userReserve.user.id) || {};
      const supplyMultiplier = multiplier[`${asset}Supply` as keyof Multiplier];
      supplyData[asset] =
        (Number(userReserve.currentATokenBalance) / 1e18) *
        Number(marketPrice[`${asset}`]) *
        (supplyMultiplier ? supplyMultiplier : multiplier.defaultSupply);
      supply.set(userReserve.user.id, supplyData);

      const borrowData = borrow.get(userReserve.user.id) || {};
      const borrowMultiplier = multiplier[`${asset}Borrow` as keyof Multiplier];
      borrowData[asset] =
        (Number(userReserve.currentTotalDebt) / 1e18) *
        Number(marketPrice[`${asset}`]) *
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

  let supplyManta = 0;
  let supplyZksync = 0;

  const mantaSupply = mantaData.supply.get(walletAddress);
  const zksyncSupply = zksyncData.supply.get(walletAddress);

  for (const [_, value] of Object.entries(mantaSupply)) {
    supplyManta += Number(value) / 1e18;
  }

  for (const [_, value] of Object.entries(zksyncSupply)) {
    supplyZksync += Number(value) / 1e18;
  }

  const totalSupply = supplyManta + supplyZksync;
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
