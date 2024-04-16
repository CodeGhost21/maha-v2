import { ethers, Provider, AbstractProvider } from "ethers";
import fs from "fs";
import { MulticallWrapper } from "ethers-multicall-provider";
import {
  blastProvider,
  ethLrtProvider,
  lineaProvider,
  mantaProvider,
  zksyncProvider,
} from "../utils/providers";
import EarlyZeroABI from "../abis/EarlyZero.json";
import { WalletUser } from "../database/models/walletUsers";
const fileName = `./earlyZero.csv`;

const uiIncentiveDataProviderBlast =
  "0x66f3015534fae808773422e32b74f5732668dD5b";

const providers: any = {
  Blast: blastProvider,
  Manta: mantaProvider,
  ZkSync: zksyncProvider,
  EthereumLrt: ethLrtProvider,
  Linea: lineaProvider,
};

const getEaylyZerolBalance = async (
  contractAddress: string,
  walletAddresses: string[],
  chain: string,
  p: AbstractProvider
) => {
  const provider = MulticallWrapper.wrap(p);
  const contract = new ethers.Contract(contractAddress, EarlyZeroABI, provider);
  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const balanceSupply = await contract.balanceOf(w);
      const balance = Number(balanceSupply) / 1e18;
      return {
        who: w,
        claimedRewards: balance,
        chain,
      };
    })
  );
  return results;
};

export const main = async () => {
  const earlyZero = [
    ["0x81b3184A3B5d4612F2c26A53Da8D99474B91B2D2", "Blast"], //blast
    ["0x642CE49f36f74FCC430ff79A76EB984737A7672d", "Manta"], //manta
    ["0x9793eac2fecef55248efa039bec78e82ac01cb2f", "ZkSync"], //zksync
    ["0x40A59A3F3b16d9e74C811d24D8b7969664cFe180", "Linea"], //linea
    // ["0x9793eac2fecef55248efa039bec78e82ac01cb2f", "EthereumLrt"], //etherem Lrt
  ];
  for (let i = 0; i < earlyZero.length; i++) {
    const batchSize = 1000;
    let skip = 0;
    let batch;
    do {
      batch = await WalletUser.find({ isDeleted: false })
        .skip(skip)
        .limit(batchSize);
      const addresses: string[] = batch.map((u) => u.walletAddress) as string[];
      const blastEarlyZero = await getEaylyZerolBalance(
        earlyZero[i][0],
        addresses,
        earlyZero[i][1],
        providers[`${earlyZero[i][1]}`]
      );
      const filteredData = blastEarlyZero.filter(
        (entry) => entry.claimedRewards > 0
      );
      await writeCsvFile(filteredData);
      skip += batchSize;
    } while (batch.length === batchSize);
  }
};

//write csv file
const writeCsvFile = (data: any) => {
  // Create a header for the CSV if the file doesn't exist yet
  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(
      fileName,
      "Address,Chain,Claimed Rewards,UnClaimed Rewards\n",
      {
        encoding: "utf-8",
      }
    );
  }

  // Create a lock file
  const lockFile = `${fileName}.lock`;

  // Acquire a lock
  if (fs.existsSync(lockFile)) {
    console.log("File is being updated by another process. Skipping.");
    return;
  }

  fs.writeFileSync(lockFile, "", { encoding: "utf-8" });

  try {
    // Append each data entry to the CSV content
    data.forEach((entry: any) => {
      const csvRow = `${entry.who},${entry.chain},${
        entry.claimedRewards ? entry.claimedRewards : 0
      },${entry.unclaimedRewards ? entry.unclaimedRewards : 0}\n`;
      fs.appendFileSync(fileName, csvRow, { encoding: "utf-8" });
    });

    console.log(`Data appended to CSV file "${fileName}" successfully.`);
  } catch (err) {
    console.error("Error appending to CSV file:", err);
  } finally {
    // Release the lock
    fs.unlinkSync(lockFile);
  }
};
