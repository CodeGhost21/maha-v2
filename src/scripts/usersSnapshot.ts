import fs from "fs";
import { WalletUser } from "../database/models/walletUsers";
const fileName = `./userPoints.csv`;

export const main = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUser.find({
      isDeleted: false,
      totalPointsV2: { $ne: 0, $gt: 0 },
    })
      .select("walletAddress points totalPointsV2")
      .skip(skip)
      .limit(batchSize);
    writeCsvFile(batch);
    skip += batchSize;
  } while (batch.length === batchSize);
};

//write csv file
const writeCsvFile = (data: any) => {
  // Create a header for the CSV if the file doesn't exist yet
  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(
      fileName,
      "Address,Total Points,Discord Follow,GM,Referral,Supply Zksync,Borrow Zksync,Supply Blast,Borrow Blast,Supply Linea,Borrow Linea,Supply EthereumLrt,Borrow EthereumLrt,PythStaker,MantaStaker,HoldStationStaker,CakeStaker,Supply EthereumLrt ETH,Supply LineaEz ETH,Supply Blast EzEth,Supply EthereumLrt EzEth,Supply EthereumLrt RsEth\n",
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
      const csvRow = `${entry.walletAddress},${entry.totalPointsV2},${
        entry.points.discordFollow ? entry.points.discordFollow : 0
      },${entry.points.gm ? entry.points.gm : 0},${
        entry.points.referral ? entry.points.referral : 0
      },${entry.points.supply ? entry.points.supply : 0},${
        entry.points.borrow ? entry.points.borrow : 0
      },${entry.points.supplyBlast ? entry.points.supplyBlast : 0},${
        entry.points.borrowBlast ? entry.points.borrowBlast : 0
      },${entry.points.supplyLinea ? entry.points.supplyLinea : 0},${
        entry.points.borrowLinea ? entry.points.borrowLinea : 0
      },${
        entry.points.supplyEthereumLrt ? entry.points.supplyEthereumLrt : 0
      },${
        entry.points.borrowEthereumLrt ? entry.points.borrowEthereumLrt : 0
      },${entry.points.PythStaker ? entry.points.PythStaker : 0},${
        entry.points.MantaStaker ? entry.points.MantaStaker : 0
      },${
        entry.points.HoldStationStaker ? entry.points.HoldStationStaker : 0
      },${entry.points.CakeStaker ? entry.points.CakeStaker : 0},${
        entry.points.supplyEthereumLrtEth
          ? entry.points.supplyEthereumLrtEth
          : 0
      },${entry.points.supplyLineaEzEth ? entry.points.supplyLineaEzEth : 0},${
        entry.points.supplyBlastEzEth ? entry.points.supplyBlastEzEth : 0
      },${
        entry.points.supplyEthereumLrtEzEth
          ? entry.points.supplyEthereumLrtEzEth
          : 0
      },${
        entry.points.supplyEthereumLrtRsEth
          ? entry.points.supplyEthereumLrtRsEth
          : 0
      }\n`;
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
