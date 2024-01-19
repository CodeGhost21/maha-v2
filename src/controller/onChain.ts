import { AbstractProvider } from "ethers";
import { contract } from "./contracts";
import { mantaProvider, zksyncProvider } from "./providers";
import { minSupplyAmount, borrowPtsPerUSD } from "./constants";
import { MulticallWrapper } from "ethers-multicall-provider";
import nconf from "nconf";
import poolABI from "../abis/Pool.json";
import stabilityPool from "../abis/StabilityPool.json";
import troveManagerABI from "../abis/TroveManager.json";

export const supplyBorrowPointsMantaMulticall = async (addresses: string[]) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("MANTA_POOL"),
    zksyncProvider
  );
};

export const supplyBorrowPointsZksyncMulticall = async (
  addresses: string[]
) => {
  return _supplyBorrowPointsMulticall(
    addresses,
    nconf.get("ZKSYNC_POOL"),
    mantaProvider
  );
};

const _supplyBorrowPointsMulticall = async (
  addresses: string[],
  poolAddr: string,
  p: AbstractProvider
) => {
  const provider = MulticallWrapper.wrap(p);
  const pool = await contract(poolAddr, poolABI, provider);

  const results = await Promise.all(
    addresses.map((w) => pool.getUserAccountData(w))
  );

  return results.map((userAccoutnData: bigint[], index) => {
    const supply = Number(userAccoutnData[0]) / 1e6 / 100;
    const borrow = Number(userAccoutnData[1]) / 1e6 / 100;

    if (supply < minSupplyAmount) {
      return {
        who: addresses[index],
        supply: { points: 0, amount: supply },
        borrow: { points: 0, amount: borrow },
      };
    }

    return {
      who: addresses[index],
      supply: { points: (supply / 1440) * 5, amount: supply },
      borrow: { points: (borrow / 1440) * borrowPtsPerUSD * 5, amount: borrow },
    };
  });
};

export const onezPoints = async (walletAddress: string) => {
  const trove = await contract(
    nconf.get("TROVE"),
    troveManagerABI,
    zksyncProvider
  );
  const troveResult = await trove.Troves(walletAddress);
  const mint = Number(troveResult[0] / BigInt(1e18));

  const stability = await contract(
    nconf.get("STABILITYPOOL"),
    stabilityPool,
    zksyncProvider
  );
  const debtResult = await stability.accountDeposits(walletAddress);

  const liquidity = Number(debtResult[0] / BigInt(1e18));
  // console.log({
  //   mint: (mint / 3600) * 5,
  //   liquidity: (liquidity / 3600) * 5,
  // });

  return {
    mint: (mint / 3600) * 5,
    liquidity: (liquidity / 3600) * 5,
  };
};
