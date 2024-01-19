import nconf from "nconf";
import { contract } from "./contracts";

import troveManagerABI from "../abis/TroveManager.json";
import stabilityPool from "../abis/StabilityPool.json";
import poolABI from "../abis/Pool.json";
import { minSupplyAmount, borrowPtsPerUSD } from "./constants";

import { mantaProvider, zksyncProvider } from "./providers";

export const supplyBorrowPointsZksync = async (walletAddress: string) => {
  const pool = await contract(
    nconf.get("ZKSYNC_POOL"),
    poolABI,
    zksyncProvider
  );
  const userAccoutnData = await pool.getUserAccountData(walletAddress);
  const supply = Number(userAccoutnData[0] / BigInt(1e6)) / 100;
  const borrow = Number(userAccoutnData[1] / BigInt(1e6)) / 100;

  return {
    supply: {
      points: supply > minSupplyAmount ? (supply / 1440) * 5 : 0,
      amount: supply,
    },
    borrow: { points: (borrow / 1440) * borrowPtsPerUSD * 5, amount: borrow },
  };
};

export const supplyBorrowPointsManta = async (walletAddress: string) => {
  const pool = await contract(nconf.get("MANTA_POOL"), poolABI, mantaProvider);
  const userAccoutnData = await pool.getUserAccountData(walletAddress);
  const supply = Number(userAccoutnData[0] / BigInt(1e6)) / 100;
  const borrow = Number(userAccoutnData[1] / BigInt(1e6)) / 100;
  return {
    supply: {
      points: supply > minSupplyAmount ? (supply / 1440) * 5 : 0,
      amount: supply,
    },
    borrow: { points: (borrow / 1440) * borrowPtsPerUSD * 5, amount: borrow },
  };
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
