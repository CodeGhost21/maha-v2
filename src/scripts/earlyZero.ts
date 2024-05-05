import { ethers, AbstractProvider } from "ethers";
import fs from "fs";
import { MulticallWrapper } from "ethers-multicall-provider";
import {
  blastProvider,
  ethLrtProvider,
  lineaProvider,
  mantaProvider,
  xLayerProvider,
  zksyncProvider,
} from "../utils/providers";
import EarlyZeroABI from "../abis/EarlyZero.json";
import IncentiveControllerABI from "../abis/IncentiveController.json";
import { WalletUser } from "../database/models/walletUsers";
const fileName = `./earlyZero_${Date.now()}.csv`;

const providers: any = {
  Blast: blastProvider,
  Manta: mantaProvider,
  ZkSync: zksyncProvider,
  EthereumLrt: ethLrtProvider,
  Linea: lineaProvider,
  xLayer: xLayerProvider,
};

const networks = [
  {
    name: "Blast",
    earlyZeroAddress: "0x81b3184A3B5d4612F2c26A53Da8D99474B91B2D2",
    incentiveControllerAddress: "0x94Dc19a5bd17E84d90E63ff3fBA9c3B76E5E4012",
    aTokens: [
      "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34",
      "0x53a3Aa617afE3C12550a93BA6262430010037B04",
      "0xEaad75b283Ec8779B9C7b5b2cC245f4755eD4595",
    ],
    variableDebtTokens: [
      "0x0e914b7669E97fd0c2644Af60E90EA7ddb4F91d1",
      "0x29c2Bc372728dacB472A7E90e5fc8Aa0F203C8CD",
      "0x95241286314B57EBDcDfE7DAA0E0BEC651e8De61",
    ],
  },
  {
    name: "Manta",
    earlyZeroAddress: "0x642CE49f36f74FCC430ff79A76EB984737A7672d",
    incentiveControllerAddress: "0x28F6899fF643261Ca9766ddc251b359A2d00b945",
    aTokens: [
      "0x8b6e58ea81679eecd63468c6d4eaefa48a45868d",
      "0x8d8b70a576113feedd7e3810ce61f5e243b01264",
      "0xb4ffef15daf4c02787bc5332580b838ce39805f5",
      "0x759cb97fbc452bafd49992ba88d3c5da4dd9b0e7",
      "0xe7e54ca3d6f8a5561f8cee361260e537bdc5be48",
      "0x0684fc172a0b8e6a65cf4684edb2082272fe9050",
      "0x0ab214f127998a36ce7ab0087a9b0d20adc2d5ad",
      "0x77e305b4d4d3b9da4e82cefd564f5b948366a44b",
      "0x03114e4c29ea95bf26108c2c47338488555ced1a",
    ],
    variableDebtTokens: [
      "0xf61a1d02103958b8603f1780702982e2ec9f9e68",
      "0x3da71ad7e055ee9716bba4dac53e37cddf60d509",
      "0xcb2da0f5aece616e2cbf29576cfc795fb15c6133",
      "0xc1d9ca73f57930d4303d380c5dc668c40b38598b",
      "0xe6b9b00d42fa5831cce4e44d9d6d8c51ba17cd1e",
      "0xcc7b5fd2f290a61587352343b7cf77bb35cb6f00",
      "0xb5eef4df2e48fb41e6eae6778c14787baaa181f1",
      "0x5f62aea5549cdf5dc309255946d69e516a9c2042",
      "0x061ca6fdf24d586ee9a4e4b4a1d61f9090ab48e9",
    ],
  },
  {
    name: "ZkSync",
    earlyZeroAddress: "0x9793eac2fECef55248efA039BEC78e82aC01CB2f",
    incentiveControllerAddress: "0x54AB34aB3C723bD2674c7082aA6fFcdfd3A5BEdc",
    aTokens: [
      "0x016341e6da8da66b33fd32189328c102f32da7cc",
      "0x9002ecb8a06060e3b56669c6b8f18e1c3b119914",
      "0x9ca4806fa54984bf5da4e280b7aa8bb821d21505",
      "0x52846a8d972abbf49f67d83d5509aa4129257f46",
      "0xd97ac0ce99329ee19b97d03e099eb42d7aa19ddb",
      "0x7c65e6ec6feceb333092e6fe69672a3475c591fb",
      "0x54330d2333adbf715eb449aad38153378601cf67",
      "0xb727f8e11bc417c90d4dcaf82eda06cf590533b5",
      "0x2b1bbe3ba39b943eeef675d6d42607c958f8d20f",
      "0xdb87a5493e308ee0deb24c822a559bee52460afc",
      "0x1f2da4ff84d46b12f8931766d6d728a806b410d6",
      "0xc3b6d357e0beadb18a23a53e1dc4839c2d15bdc2",
      "0x15b362768465f966f1e5983b7ae87f4c5bf75c55",
      "0x0a2374d4387e9c8d730e7c90eed23c045938fdbb",
      "0xe855e73cad110d2f3ee2288d506d6140722c04c7",
    ],
    variableDebtTokens: [
      "0xE60E1953aF56Db378184997cab20731d17c65004",
      "0x56f58d9BE10929CdA709c4134eF7343D73B080Cf",
      "0xa333c6FF89525939271E796FbDe2a2D9A970F831",
      "0x77dcEd4833E3a91437Ed9891117BD5a61C2AD520",
      "0x41c618CCE58Fb27cAF4EEb1dd25de1d03A0DAAc6",
      "0xaBd3C4E4AC6e0d81FCfa5C41a76e9583a8f81909",
      "0x963Cc035Edd4BC0F4a89987888304580DfA9be60",
      "0x3E1F1812c2a4f356d1b4FB5Ff7cca5B2ac653b94",
      "0x0EEDe84dD0dEa309382d23dD5591077127759A77",
      "0x1f3DA58fAC996C2094EeC9801867028953A45325",
      "0x9Bad0035B31c0193Fed4322D1eb2c29AeaD799f8",
      "0xa734aBE2A512dabf23146C97307cfC5B347Ae50A",
      "0x0325F21eB0A16802E2bACD931964434929985548",
      "0xf001d84605B2e7Dbaaec545b431088BBF8E21DEa",
      "0xa351D9EB46D4fB3269e0Fe9B7416ec2318151BC0",
    ],
  },
  {
    name: "Linea",
    earlyZeroAddress: "0x40A59A3F3b16d9e74C811d24D8b7969664cFe180",
    incentiveControllerAddress: "0x28F6899fF643261Ca9766ddc251b359A2d00b945",
    aTokens: [
      "0x2e207eca8b6bf77a6ac82763eeed2a94de4f081d",
      "0x508c39cd02736535d5cb85f3925218e5e0e8f07a",
      "0xb4ffef15daf4c02787bc5332580b838ce39805f5",
      "0x759cb97fbc452bafd49992ba88d3c5da4dd9b0e7",
      "0xe7e54ca3d6f8a5561f8cee361260e537bdc5be48",
      "0x0684fc172a0b8e6a65cf4684edb2082272fe9050",
      "0x8b6e58ea81679eecd63468c6d4eaefa48a45868d",
    ],
    variableDebtTokens: [
      "0xa2703Dc9FbACCD6eC2e4CBfa700989D0238133f6",
      "0x476F206511a18C9956fc79726108a03E647A1817",
      "0xCb2dA0F5aEce616e2Cbf29576CFc795fb15c6133",
      "0xc1d9ca73f57930D4303D380C5DC668C40B38598B",
      "0xe6B9b00d42fA5831ccE4E44D9d6D8C51ba17cd1E",
      "0xcC7b5Fd2F290a61587352343b7Cf77bB35cB6f00",
      "0xF61a1d02103958b8603f1780702982E2ec9F9E68",
    ],
  },
  {
    name: "xLayer",
    earlyZeroAddress: "0x26F2232cd83E5fC6789f2A1D36274753d161523a",
    incentiveControllerAddress: "0x6d0BCD00b3ecd8Cd15729beDBC88Be60F4a75543",
    aTokens: [
      "0xA8184C63fD78EBaEd24e8f9d1c3D322357B4Aedc",
      "0x8C2399B1B6CdeEE1Dce3D211660536aBB6A19eae",
      "0x6D7dF47e72891C0217761b7f9a636FDbB7AD28CB",
      "0x11F1e8AD126D19f58947Cf4555118c456AFF2A41",
      "0xb85018b38030E51745b97e4D1F7814AD724C932A",
      "0xDB32FcF62fc0f8720944F136A72c47C17929C877",
    ],
    variableDebtTokens: [
      "0xa0E48Fe416fF74AE711b01540FF2144E3a1A9171",
      "0xE6C189b3F6cdf47184DC6DD59b28fEF0D0862b39",
      "0xCa63175F32aB1962eeeFD80734Ad2dc360292c3c",
      "0x0c87Ca5de4b9313D15337CDC0dbDE5f835558bDE",
      "0x0D78fac08b5DC929219ed534dF28ce3616d8b9de",
      "0x099963068180E0f616A0040f31144b4F6218A1FC",
    ],
  },
  {
    name: "EthereumLrt",
    earlyZeroAddress: "0x3db28e471fa398bf2527135a1c559665941ee7a3",
    incentiveControllerAddress: "0x5be89bB10E2234204A2607765714916Ed95a73a2",
    aTokens: [
      "0x29a3a6Af690942A3b7665bb2839a3f563C6F987b",
      "0xb2feb2c46305329a340E6188532f31FcE9347a5c",
      "0x6c735966bC965BD4066c14fcA3Df443496CE14fb",
      "0xFb932A75c5F69d03B0F6e59573FDe6976aF0D88C",
      "0x84E55c6Bc5B7e9505d87b3Df6Ceff7753e15A0c5",
      "0x68fD75cF5a91F49EFfAd0E857ef2E97e5d1f35e7",
      "0xeF4A41E692319aE4AA596314D282B3F2a3830bED",
      "0xdD7Afc0f014A1E1716307Ff040704fA12E8D33A3",
      "0xB7caDc9CdFBBEf6d230DD99A7c62e294FC44BFC6",
    ],
    variableDebtTokens: [
      "0x0047cAC82cf5Fb36954de1B9D86d657915ab3b47",
      "0x227f86FbfCCB5664403B62a5b6D4e0e593968275",
      "0xdAccF47046aE4FEE3F9f3bcFe68696A95dB6ccB7",
      "0x7EF98CD28902Ce57b7aEeC66DFB06B454CdA1941",
      "0x53C94fd63Ef4001d45744c311d6BBe2171D4a11e",
      "0x27C1706ddd2467622CA63aaEc03332127919A690",
      "0xE4fe2d282DEAD5759199Df364F3F419DFaC17339",
      "0xF99728A4b9F3371Cfcf671099edF00f49b006125",
      "0xb04adAFF2f221f63B977185F5A7D8EE49aacBafF",
    ],
  },
];

const getEarlyZeroBalance = async (
  earlyZeroContractAddress: string,
  incentiveControllerAddress: string,
  aTokens: string[],
  variableDebtTokens: string[],
  walletAddresses: string[],
  chain: string,
  p: AbstractProvider
) => {
  const provider = MulticallWrapper.wrap(p);
  const earlyZeroContract = new ethers.Contract(
    earlyZeroContractAddress,
    EarlyZeroABI,
    provider
  );
  const incentiveControllerContract = new ethers.Contract(
    incentiveControllerAddress,
    IncentiveControllerABI,
    provider
  );

  const results = await Promise.all(
    walletAddresses.map(async (w) => {
      const earlyZeroBalanceSupply = await earlyZeroContract.balanceOf(w);
      const earlyZeroBalance = Number(earlyZeroBalanceSupply) / 1e18;

      const claimableAmount = await incentiveControllerContract.getUserRewards(
        [...aTokens, ...variableDebtTokens],
        w,
        earlyZeroContractAddress
      );

      return {
        who: w,
        claimedRewards: earlyZeroBalance,
        unclaimedRewards: Number(claimableAmount) / 1e18,
        chain,
      };
    })
  );
  return results;
};

export const main = async () => {
  for (let i = 0; i < networks.length; i++) {
    const batchSize = 1000;
    let skip = 0;
    let walletUsersBatch;
    do {
      walletUsersBatch = await WalletUser.find({ isDeleted: false })
        .skip(skip)
        .limit(batchSize);
      const walletUserAddresses: string[] = walletUsersBatch.map(
        (u) => u.walletAddress
      ) as string[];
      const earlyZero = await getEarlyZeroBalance(
        networks[i].earlyZeroAddress,
        networks[i].incentiveControllerAddress,
        networks[i].aTokens,
        networks[i].variableDebtTokens,
        walletUserAddresses,
        networks[i].name,
        providers[`${networks[i].name}`]
      );
      const filteredData = earlyZero.filter(
        (entry) => entry.claimedRewards > 0
      );
      writeCsvFile(filteredData);
      skip += batchSize;
    } while (walletUsersBatch.length === batchSize);
  }
  console.log("completed.")
};

//write csv file
const writeCsvFile = (data: any) => {
  // Create a header for the CSV if the file doesn't exist yet
  console.log("writing csv");
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
