import { TroveContract, PoolContract, StabilityPool } from "../contracts";

export const onezPoints = async (walletAddress: string) => {
  const troveResult = await TroveContract.Troves(walletAddress);
  console.log(troveResult);

  const mint = Number(troveResult[0] / BigInt(1e18));

  const debtResult = await StabilityPool.accountDeposits(walletAddress);
  // console.log(troveResult);
  // console.log(debtResult);

  const liquidity = Number(debtResult[0] / BigInt(1e18));
  console.log({
    mint: (mint / 3600) * 5,
    liquidity: (liquidity / 3600) * 5,
  });

  return {
    mint: (mint / 3600) * 5,
    liquidity: (liquidity / 3600) * 5,
  };
};
