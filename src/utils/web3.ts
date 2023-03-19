import nconf from "nconf";
import MAHAX from "../abi/MahaXAbi.json";
import Web3 from "web3";
import { BigNumber } from "ethers";

const provider = new Web3.providers.HttpProvider(nconf.get("ETH_RPC"));
export const web3 = new Web3(provider);

const mahaXContract = new web3.eth.Contract(
  MAHAX as any[],
  nconf.get("CONTRACT_LOCKER")
);

export const tokenURI = async (nftId: number): Promise<string> => {
  return await mahaXContract.methods.tokenURI(nftId).call();
};

export const isOpenseaApproved = async (address: string): Promise<boolean> => {
  const operator = nconf.get("OPENSEA_SEAPORT_ADDRESS");
  return await mahaXContract.methods.isApprovedForAll(address, operator).call();
};

export const balanceOf = async (address: string): Promise<number> => {
  return await mahaXContract.methods.balanceOf(address).call();
};

export const locked = async (
  nftId: number
): Promise<{ amount: string; end: number; start: number }> => {
  return await mahaXContract.methods.locked(nftId).call();
};

export const tokenOfOwnerByIndex = async (
  address: string,
  index: number
): Promise<number> => {
  return await mahaXContract.methods.tokenOfOwnerByIndex(address, index).call();
};
