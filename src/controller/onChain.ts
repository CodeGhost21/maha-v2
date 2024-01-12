import { PoolContract, StabilityPool, TroveContract } from "./contracts";

export const supplyBorrowPoints = async (walletAddress: string) => {
  const userAccoutnData = await PoolContract.getUserAccountData(walletAddress);
  //supply 1:1  &  borrow 1:4
  const supply = Number(userAccoutnData[0] / BigInt(1e6)) / 100;
  const borrow = (Number(userAccoutnData[1] / BigInt(1e6)) / 100) * 4;
  return {
    supply: (supply / 1440) * 5,
    borrow: (borrow / 1440) * 5,
  };
};

export const onezPoints = async (walletAddress: string) => {
  const troveResult = await TroveContract.Troves(walletAddress);
  const mint = Number(troveResult[0] / BigInt(1e18));

  const debtResult = await StabilityPool.accountDeposits(walletAddress);

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
