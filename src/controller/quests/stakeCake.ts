import { ethers } from "ethers";
import { MulticallWrapper } from "ethers-multicall-provider";
import nconf from "nconf";

import { cakeProvider } from "../../utils/providers";
import CakePoolABI from "../../abis/CakePool.json";

export const getCakeStakeData = async (walletAddress: string) => {
  const provider = new ethers.JsonRpcProvider(
    "https://bsc-dataseed.binance.org/"
  );
  const contract = new ethers.Contract(
    nconf.get("CAKE_POOL"),
    CakePoolABI,
    provider
  );
  
  const userInfo = await contract.balanceOf(walletAddress);
  return Number(userInfo) / 1e18;
};

//multi call function to fetch cake stake data
export const updateCakeStake = async (addresses: string[]) => {
  // const addresses = ["0x5fA0D515c3E66e4F03E1642c8BF00e424119c769"];
  const provider = MulticallWrapper.wrap(cakeProvider);
  const pool = new ethers.Contract(
    nconf.get("CAKE_POOL"),
    CakePoolABI,
    provider
  );

  const results = await Promise.all(addresses.map((w) => pool.userInfo(w)));

  return results.map((userInfoData: bigint[], index) => {
    return {
      address: addresses[index],
      stakedAmount: Number(userInfoData[8]) / 1e18,
    };
  });
};
