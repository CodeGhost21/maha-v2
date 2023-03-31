import nconf from "nconf";
import MAHAX from "../abi/MahaXAbi.json";
import Web3 from "web3";

const provider = new Web3.providers.HttpProvider(nconf.get("ETH_RPC"));
export const web3 = new Web3(provider);

export const contract = async (
  contractAddress: string,
  walletAddress: string,
  operatorAddress?: string
) => {
  const mahaXContract = new web3.eth.Contract(MAHAX as any[], contractAddress);

  const noOfNft = await mahaXContract.methods.balanceOf(walletAddress).call();

  const allTokenURI = [];
  const mahaLocked = [];
  for (let i = 0; i < noOfNft; i++) {
    const nftId = await mahaXContract.methods
      .tokenOfOwnerByIndex(walletAddress, i)
      .call();
    const tokenURI = await mahaXContract.methods.tokenURI(nftId).call();
    allTokenURI.push(tokenURI);
    const locked = await mahaXContract.methods.locked(nftId).call();
    mahaLocked.push([nftId, locked.amount / 10 ** 18]);
  }
  if (operatorAddress !== undefined) {
    const isOpenseaApproved = await mahaXContract.methods
      .isApprovedForAll(walletAddress, operatorAddress)
      .call();
    return { isOpenseaApproved };
  }
  return { allTokenURI, mahaLocked, noOfNft };
};

// const mahaXContract = new web3.eth.Contract(
//   MAHAX as any[],
//   nconf.get("CONTRACT_LOCKER")
// );

// export const tokenURI = async (nftId: number): Promise<string> => {
//   return await mahaXContract.methods.tokenURI(nftId).call();
// };

// export const isOpenseaApproved = async (address: string): Promise<boolean> => {
//   const operator = nconf.get("OPENSEA_SEAPORT_ADDRESS");
//   return await mahaXContract.methods.isApprovedForAll(address, operator).call();
// };

// export const balanceOf = async (address: string): Promise<number> => {
//   return await mahaXContract.methods.balanceOf(address).call();
// };

// export const locked = async (
//   nftId: number
// ): Promise<{ amount: string; end: number; start: number }> => {
//   return await mahaXContract.methods.locked(nftId).call();
// };

// export const tokenOfOwnerByIndex = async (
//   address: string,
//   index: number
// ): Promise<number> => {
//   return await mahaXContract.methods.tokenOfOwnerByIndex(address, index).call();
// };

export const test = async () => {
  const result = await contract(
    "0xbdd8f4daf71c2cb16cce7e54bb81ef3cfcf5aacb",
    "0xFc2A07c3c71B993a623BD33a9fCd6f5f8C3ba3da"
  );
  console.log(result);
};
