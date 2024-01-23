import { AbstractProvider } from "ethers";
import { ethers, Provider } from "ethers";
import { mantaProvider, zksyncProvider } from "../../utils/providers";
import { minSupplyAmount, borrowPtsPerUSD } from "./constants";
import { MulticallWrapper } from "ethers-multicall-provider";
import nconf from "nconf";
import poolABI from "../../abis/Pool.json";
import stabilityPool from "../../abis/StabilityPool.json";
import troveManagerABI from "../../abis/TroveManager.json";

const getContract = async (
  contractAddress: string,
  abi: any,
  provider: Provider
) => {
  return new ethers.Contract(contractAddress, abi, provider);
};

export const supplyBorrowPointsMantaMulticall = async (addresses: string[]) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("MANTA_POOL"),
    mantaProvider
  );
};

export const supplyBorrowPointsZksyncMulticall = async (
  addresses: string[]
) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("ZKSYNC_POOL"),
    zksyncProvider
  );
};

const _supplyBorrowPointsMulticall = async (
  addresses: string[],
  poolAddr: string,
  p: AbstractProvider
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

    const multiplier = 5;
    // const multiplier = 60 / (60 * 24);

    return {
      who: addresses[index],
      supply: { points: supply * multiplier, amount: supply },
      borrow: { points: borrow * multiplier * borrowPtsPerUSD, amount: borrow },
    };
  });
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
