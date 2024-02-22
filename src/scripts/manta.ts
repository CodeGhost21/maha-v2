import axios from "axios";
import fs from "fs";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { ethers } from "ethers";

const snapshotBlockNumber = 1412658;

let skip = 0;
let first = 500;
let bindRecords: any = {};
const fileName = `./snapshot-block-${snapshotBlockNumber}.csv`;
interface BindRecord {
  pacificAddress: string;
  atlanticAddress: string;
  blockNumber: number;
  stakingAmount: number;
}
const main = async () => {
  // Construct API provider
  console.log("main");

  const wsProvider = new WsProvider("wss://ws.manta.systems");
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });

  // generate snapshot file
  const writeStream = fs.createWriteStream(fileName, { encoding: "utf-8" });

  writeStream.on("open", async () => {
    writeStream.write(
      "pacificAddress,atlanticAddress,bindBlockNumber,stakingAmount\n",
      "utf-8"
    );
    await queryStakedRecord(api, writeStream);
  });
};

// main();

const queryStakedRecord = async (api: any, writeStream: any) => {
  const queryURL =
    "https://api.goldsky.com/api/public/project_clnv4qr7e30dv33vpgx7y0f1d/subgraphs/mainnet-staker/1.0.0/gn";

  // Define the query to fetch a list of stake records
  const graphQuery = `query {
      bindPacificAddresses(first:${first}, skip:${skip}, orderBy:blockNumber){
        id,
        atlanticAddress,
        pacificAddress,
        blockNumber
      }
    }`;

  // Set the request headers
  const headers = {
    "Content-Type": "application/json",
  };

  console.log(`Query bind records from subgraph, first:${first}, skip:${skip}`);

  try {
    // Get the response using Axios
    const response = await axios.post(
      queryURL,
      { query: graphQuery },
      { headers }
    );
    const records = response.data.data.bindPacificAddresses;
    //@ts-ignore
    records.map((item) => {
      if (item.blockNumber <= snapshotBlockNumber) {
        item.stakingAmount = 0;
        //@ts-ignore
        bindRecords[item.atlanticAddress] = item;
      }
    });

    let atlanticAddressArray = Object.keys(bindRecords);
    const delegatorState =
      await api.query.parachainStaking.delegatorState.multi(
        atlanticAddressArray
      );
    // console.log(delegatorState);
    for (let i = 0; i < atlanticAddressArray.length; i++) {
      const currentDelegatorState: any = delegatorState[i];

      const delegationsRaw = currentDelegatorState.isSome
        ? currentDelegatorState.value.delegations
        : [];

      let currentAccountStakingAmount = 0;
      await delegationsRaw.map((delegationRaw: any) => {
        currentAccountStakingAmount =
          Number(currentAccountStakingAmount) +
          Number(delegationRaw.amount / 1e18);
      });

      // update staking amount of bind record
      //@ts-ignore
      bindRecords[atlanticAddressArray[i]].stakingAmount =
        currentAccountStakingAmount;
    }
    if (records.length == first) {
      skip = 500 + skip;
      await queryStakedRecord(api, writeStream);
    } else {
      // save bind record into file
      for (const [key, value] of Object.entries<BindRecord>(bindRecords)) {
        const records = [];
        records.push(ethers.getAddress(value.pacificAddress));
        records.push(value.atlanticAddress);
        records.push(value.blockNumber);
        records.push(value.stakingAmount);

        const toString = records.join(",");

        writeStream.write(toString + "\n", "utf-8");
      }
      console.log(`snapshot records saved into ${fileName}`);
      writeStream.end();
      await api.disconnect();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// export const getMantaStakedData = async (walletAddress: string) => {
//   console.log(walletAddress);

//   try {
//     // const checkWhileListed = mantaWhiteList.find(
//     //   (item) =>
//     //     item.pacificAddress.toLowerCase() === walletAddress.toLowerCase()
//     // );
//     // if (checkWhileListed) {
//     //   return {
//     //     success: true,
//     //     data: {
//     //       ...checkWhileListed,
//     //       stakedAmount: checkWhileListed.stakedAmount,
//     //     },
//     //   };
//     // } else {
//     const wsProvider = new WsProvider("wss://ws.manta.systems");
//     const api = await ApiPromise.create({
//       provider: wsProvider,
//       noInitWarn: true,
//     });

//     const queryURL =
//       "https://api.goldsky.com/api/public/project_clnv4qr7e30dv33vpgx7y0f1d/subgraphs/mainnet-staker/1.0.0/gn";

//     const graphQuery = `query {
//         bindPacificAddresses(where: { pacificAddress: "${walletAddress}" }) {
//             id,
//             atlanticAddress,
//             pacificAddress,
//             blockNumber
//         }
//       }`;

//     const headers = {
//       "Content-Type": "application/json",
//     };

//     const response = await axios.post(
//       queryURL,
//       { query: graphQuery },
//       { headers }
//     );
//     const mantaData: any = {};
//     if (response.data.data) {
//       if (response.data.data.bindPacificAddresses.length > 0) {
//         const records = response.data.data.bindPacificAddresses;
//         records.map((item: any) => {
//           // if (item.blockNumber <= snapshotBlockNumber) {
//           item.stakingAmount = 0;
//           mantaData[item.atlanticAddress] = item;
//           // }
//         });

//         let atlanticAddressArray = Object.keys(mantaData);

//         const delegatorState =
//           await api.query.parachainStaking.delegatorState.multi(
//             atlanticAddressArray
//           );

//         for (let i = 0; i < atlanticAddressArray.length; i++) {
//           const currentDelegatorState: any = delegatorState[i];

//           const delegationsRaw = currentDelegatorState.isSome
//             ? currentDelegatorState.value.delegations
//             : [];

//           let currentAccountStakingAmount = 0;
//           await delegationsRaw.map((delegationRaw: any) => {
//             currentAccountStakingAmount =
//               Number(currentAccountStakingAmount) +
//               Number(delegationRaw.amount / 1e18);
//           });

//           // update staking amount of bind record
//           mantaData[atlanticAddressArray[i]].stakingAmount =
//             currentAccountStakingAmount;
//         }

//         //sum of staking amount
//         let totalStakingAmount = 0;
//         Object.keys(mantaData).map((key) => {
//           totalStakingAmount += mantaData[key].stakingAmount;
//         });
//         mantaData.totalStakingAmount = totalStakingAmount;
//         console.log(mantaData);
//         return { success: true, data: mantaData };
//       } else if (response.data.data.bindPacificAddresses.length === 0) {
//         return { success: false, message: "no data found" };
//       }
//     } else if (response.data.errors) {
//       return { success: false, message: response.data.errors[0].message };
//     }
//     // }
//   } catch (error) {
//     console.error("Error:", error);
//     return { success: false, error };
//   }
// };

// getMantaStakedData("0x8149780202bed8fccec2f4c82e158cc61728f31c");
