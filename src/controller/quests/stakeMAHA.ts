import { ethers } from "ethers";
import { MulticallWrapper } from "ethers-multicall-provider";
import nconf from "nconf";

import { ethLrtProvider } from "../../utils/providers";
import MahaXABI from "../../abis/MAHAX.json";

export const getMAHAStakeData = async (walletAddress: string) => {
  const contract = new ethers.Contract(
    nconf.get("MAHAX"),
    MahaXABI,
    ethLrtProvider
  );

  const userInfo = await contract.votingPowerOf(walletAddress);
  console.log(Number(userInfo) / 1e18);

  return Number(userInfo) / 1e18;
};

//multi call function to fetch MAHAX stake data
export const updateMAHAStake = async (addresses: string[]) => {
  // const addresses = ["0x5fA0D515c3E66e4F03E1642c8BF00e424119c769"];
  const provider = MulticallWrapper.wrap(ethLrtProvider);
  const pool = new ethers.Contract(nconf.get("MAHAX"), MahaXABI, provider);

  const results = await Promise.all(
    addresses.map((w) => pool.votingPowerOf(w))
  );

  return results.map((userInfoData: bigint[], index) => {
    return {
      address: addresses[index],
      stakedAmount: Number(userInfoData) / 1e18,
    };
  });
};
