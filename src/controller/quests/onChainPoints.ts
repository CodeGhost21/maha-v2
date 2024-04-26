import { AbstractProvider } from "ethers";
import { ethers, Provider } from "ethers";
import CoinGecko from "coingecko-api";
import axios from "axios";
import {
  mantaProvider,
  zksyncProvider,
  blastProvider,
  lineaProvider,
  ethLrtProvider,
  xLayerProvider,
} from "../../utils/providers";
import {
  minSupplyAmount,
  borrowPtsPerUSD,
  supplyEthEthereumLrt,
  supplyZksyncLido,
  supplyEthereumLrtEsEth,
} from "./constants";
import { MulticallWrapper } from "ethers-multicall-provider";
import nconf from "nconf";
import poolABI from "../../abis/Pool.json";
import stabilityPool from "../../abis/StabilityPool.json";
import troveManagerABI from "../../abis/TroveManager.json";
import cache from "../../utils/cache";
const CoinGeckoClient = new CoinGecko();

export const getPriceCoinGecko = async () => {
  try {
    const data = await CoinGeckoClient.simple.price({
      ids: [
        "ethereum",
        "renzo-restaked-eth",
        "lido-dao",
        "kelp-dao-restaked-eth",
      ],
      vs_currencies: ["usd"],
    });
    const priceList = {
      ETH: data.data.ethereum.usd,
      ezETH: data.data["renzo-restaked-eth"].usd,
      lido: data.data["lido-dao"].usd,
      rsEth: data.data["kelp-dao-restaked-eth"].usd,
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

//manta
export const supplyBorrowPointsMantaMulticall = async (addresses: string[]) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("MANTA_POOL"),
    mantaProvider,
    1
  );
};

//zksync
export const supplyBorrowPointsZksyncMulticall = async (
  addresses: string[]
) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("ZKSYNC_POOL"),
    zksyncProvider,
    1
  );
};

//blast
export const supplyBorrowPointsBlastMulticall = async (addresses: string[]) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("BLAST_POOL"),
    blastProvider,
    1
  );
};

//linea
export const supplyBorrowPointsLineaMulticall = async (addresses: string[]) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("LINEA_POOL"),
    lineaProvider,
    1
  );
};

//etherum Lrt
export const supplyBorrowPointsEthereumLrtMulticall = async (
  addresses: string[]
) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("ETH_LRT_POOL"),
    ethLrtProvider,
    1
  );
};

//xlayer
export const supplyBorrowPointsXLayerMulticall = async (
  addresses: string[]
) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("OKX_POOL"),
    xLayerProvider,
    2
  );
};

const _supplyBorrowPointsMulticall = async (
  addresses: string[],
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  const provider = MulticallWrapper.wrap(p);
  const pool = await getContract(poolAddr, poolABI, provider);

  const results = await Promise.all(
    addresses.map((w) => pool.getUserAccountData(w))
  );

  return results.map((userAccoutnData: bigint[], index) => {
    const supply = Number(userAccoutnData[0]) / 1e8;
    const borrow = Number(userAccoutnData[1]) / 1e8;

    if (supply < minSupplyAmount) {
      return {
        who: addresses[index],
        supply: { points: 0, amount: supply },
        borrow: { points: 0, amount: borrow },
      };
    }

    // const multiplier = 5; // 5 days
    // const multiplier = 0.25; // 6 hours
    const multiplier = 1; // 1 day

    return {
      who: addresses[index],
      supply: {
        points: supply * multiplier * supplyMultiplier,
        amount: supply,
      },
      borrow: { points: borrow * multiplier * borrowPtsPerUSD, amount: borrow },
    };
  });
};

export const supplyBorrowPointsEthereumLrtETHMulticall = async (
  walletAddresses: string[]
) => {
  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  const provider = MulticallWrapper.wrap(ethLrtProvider);
  const abi = ["function balanceOf(address owner) view returns (uint256)"];
  const contractDeposit = new ethers.Contract(
    nconf.get("ETH_LRT_ETH_DEPOSIT"),
    abi,
    provider
  );

  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contractDeposit.balanceOf(w);
      const supply = (Number(balanceSupply) / 1e18) * marketPrice.ETH;
      return {
        who: w,
        supply: { points: supply * supplyEthEthereumLrt, amount: supply },
      };
    })
  );
  return results;
};

export const supplyPointsLineaEzETHMulticall = async (
  walletAddresses: string[]
) => {
  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  const provider = MulticallWrapper.wrap(lineaProvider);
  const abi = ["function balanceOf(address owner) view returns (uint256)"];
  const contractDeposit = new ethers.Contract(
    nconf.get("LINEA_EZ_ETH_SUPPLY"),
    abi,
    provider
  );
  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contractDeposit.balanceOf(w);
      const supply = (Number(balanceSupply) / 1e18) * marketPrice.ezETH;
      return {
        who: w,
        supply: { points: supply, amount: supply },
      };
    })
  );
  return results;
};

export const supplyPointsEthereumLrtEzETHMulticall = async (
  walletAddresses: string[]
) => {
  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  const provider = MulticallWrapper.wrap(ethLrtProvider);
  const abi = ["function balanceOf(address owner) view returns (uint256)"];
  const contractDeposit = new ethers.Contract(
    nconf.get("ETH_EZ_ETH_SUPPLY"),
    abi,
    provider
  );
  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contractDeposit.balanceOf(w);
      const supply = (Number(balanceSupply) / 1e18) * marketPrice.ezETH;
      return {
        who: w,
        supply: { points: supply, amount: supply },
      };
    })
  );
  return results;
};

export const supplyPointsBlastEzETHMulticall = async (
  walletAddresses: string[]
) => {
  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  const provider = MulticallWrapper.wrap(blastProvider);
  const abi = ["function balanceOf(address owner) view returns (uint256)"];
  const contractDeposit = new ethers.Contract(
    nconf.get("BLAST_EZ_ETH_SUPPLY"),
    abi,
    provider
  );

  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contractDeposit.balanceOf(w);
      const supply = (Number(balanceSupply) / 1e18) * marketPrice.ezETH;
      return {
        who: w,
        supply: { points: supply, amount: supply },
      };
    })
  );
  return results;
};

export const supplyPointsEthereumLrtRsETHMulticall = async (
  walletAddresses: string[]
) => {
  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  const provider = MulticallWrapper.wrap(ethLrtProvider);
  const abi = ["function balanceOf(address owner) view returns (uint256)"];
  const contractDeposit = new ethers.Contract(
    nconf.get("ETH_RS_ETH_SUPPLY"),
    abi,
    provider
  );

  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contractDeposit.balanceOf(w);
      const supply = (Number(balanceSupply) / 1e18) * marketPrice.rsEth;
      return {
        who: w,
        supply: { points: supply * supplyEthereumLrtEsEth, amount: supply },
      };
    })
  );
  return results;
};

export const supplyPointsZksyncLidoMulticall = async (
  walletAddresses: string[]
) => {
  let marketPrice: any = await cache.get("coingecko:PriceList");
  if (!marketPrice) {
    marketPrice = await getPriceCoinGecko();
  }
  const provider = MulticallWrapper.wrap(zksyncProvider);
  const abi = ["function balanceOf(address owner) view returns (uint256)"];
  const contractDeposit = new ethers.Contract(
    nconf.get("LIDO_SUPPLY"),
    abi,
    provider
  );
  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contractDeposit.balanceOf(w);
      const supply = (Number(balanceSupply) / 1e18) * marketPrice.lido;
      return {
        who: w,
        supply: { points: supply * supplyZksyncLido, amount: supply },
      };
    })
  );
  return results;
};

export const onezPoints = async (walletAddress: string) => {
  const trove = await getContract(
    nconf.get("TROVE"),
    troveManagerABI,
    zksyncProvider
  );
  const troveResult = await trove.Troves(walletAddress);
  const mint = Number(troveResult[0] / BigInt(1e18));

  const stability = await getContract(
    nconf.get("STABILITYPOOL"),
    stabilityPool,
    zksyncProvider
  );
  const debtResult = await stability.accountDeposits(walletAddress);

  const liquidity = Number(debtResult[0] / BigInt(1e18));

  return {
    mint: (mint / 3600) * 5,
    liquidity: (liquidity / 3600) * 5,
  };
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
