import { ethers, Provider } from "ethers";

export const contract = async (
  contractAddress: string,
  abi: any,
  provider: Provider
) => {
  return new ethers.Contract(contractAddress, abi, provider);
};
