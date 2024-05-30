import { ethers } from "ethers";
import { MulticallWrapper } from "ethers-multicall-provider";
import { zksyncProvider } from "../utils/providers";
import EarlyZeroABI from "../abis/EarlyZero.json";
import nconf from "nconf";
import fs from "fs";

interface Data {
  amount: number;
  address: string;
}

interface Result {
  amount: number;
  address: string;
  txHash: string;
}

const provider = MulticallWrapper.wrap(zksyncProvider);
const earlyZeroZksyncAddress = "0x9793eac2fECef55248efA039BEC78e82aC01CB2f";
const earlyZeroContract = new ethers.Contract(
  earlyZeroZksyncAddress,
  EarlyZeroABI,
  provider
);
const signer = new ethers.Wallet(
  nconf.get("ZKSYNC_EARLYZERO_HOLDER_SIGNER_PRIVATE_KEY"),
  provider
);

export const transferEarlyZeroTokensOnZkSync = async (
  addressesData: Data[]
) => {
  const transactionHashes: Result[] = [];
  await Promise.all(
    addressesData.map(async (d) => {
      const _amount = ethers.parseUnits(`${d.amount}`, 18);

      const data = earlyZeroContract.interface.encodeFunctionData("transfer", [
        d.address,
        _amount,
      ]);
      const tx = await signer.sendTransaction({
        to: earlyZeroZksyncAddress,
        from: signer.address,
        value: ethers.parseUnits("0.000", 18),
        data: data,
      });
      console.log("Mining transaction...");
      console.log("transfer to", d.address, " Hash =>", tx.hash);
      const receipt: any = await tx.wait();

      // The transaction is now on chain!
      console.log(`Mined in block ${receipt.blockNumber}`);
      transactionHashes.push({
        amount: d.amount,
        address: d.address,
        txHash: tx.hash,
      });
    })
  );

  console.log("transaction hashes", transactionHashes);
  fs.writeFileSync(
    `${Date.now()}_earlyZeroTransfer.json`,
    JSON.stringify(transactionHashes, null, 2)
  );
};
