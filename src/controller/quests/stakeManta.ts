import axios from "axios";
import { ethers } from "ethers";
import nconf from "nconf";
import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { MulticallWrapper } from "ethers-multicall-provider";
import { mantaProvider ,moonbeamProvider} from "../../utils/providers";

const MantaABI = ["function balanceOf(address owner) view returns (uint256)"];

const getBalance = async (
  walletAddress: string,
  rpc: string,
  tokenAddress: string
) => {
  const provider = new ethers.JsonRpcProvider(rpc);
  const contract = new ethers.Contract(
    tokenAddress,
    ["function balanceOf(address owner) view returns (uint256)"],
    provider
  );
  const balance = await contract.balanceOf(walletAddress);
  return balance;
};

const mantaQueryData = async (graphQuery: string) => {
  const queryURL =
    "https://api.goldsky.com/api/public/project_clnv4qr7e30dv33vpgx7y0f1d/subgraphs/mainnet-staker/1.0.0/gn";

  const headers = {
    "Content-Type": "application/json",
  };

  const response = await axios.post(
    queryURL,
    { query: graphQuery },
    { headers }
  );

  return response;
};

export const getMantaStakedData = async (walletAddress: string) => {
  try {
    const wsProvider = new WsProvider("wss://ws.manta.systems");
    const api = await ApiPromise.create({
      provider: wsProvider,
      noInitWarn: true,
    });
    const graphQuery = `query {
        bindPacificAddresses(where: { pacificAddress: "${walletAddress}" }) {
            id,
            atlanticAddress,
            pacificAddress,
            blockNumber
        }
      }`;
    const response = await mantaQueryData(graphQuery);
    const mantaData: any = {};
    if (response.data.data) {
      if (response.data.data.bindPacificAddresses.length > 0) {
        const records = response.data.data.bindPacificAddresses;
        records.map((item: any) => {
          // if (item.blockNumber <= snapshotBlockNumber) {
          item.stakingAmount = 0;
          mantaData[item.atlanticAddress] = item;
          // }
        });

        const atlanticAddressArray = Object.keys(mantaData);

        const delegatorState =
          await api.query.parachainStaking.delegatorState.multi(
            atlanticAddressArray
          );

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
          mantaData[atlanticAddressArray[i]].stakingAmount =
            currentAccountStakingAmount;
        }

        //sum of staking amount
        let totalStakingAmount = 0;
        Object.keys(mantaData).map((key) => {
          totalStakingAmount += mantaData[key].stakingAmount;
        });
        mantaData.totalStakingAmount = totalStakingAmount;
        return { success: true, data: mantaData };
      } else if (response.data.data.bindPacificAddresses.length === 0) {
        return { success: false, message: "no data found" };
      }
    } else if (response.data.errors) {
      return { success: false, message: response.data.errors[0].message };
    }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};

export const getMantaStakedDataAccumulate = async (walletAddress: string) => {
  const balance = await getBalance(
    walletAddress,
    "https://pacific-rpc.manta.network/http",
    "0x7AC168c81F4F3820Fa3F22603ce5864D6aB3C547"
  );
  return Number(balance) / 1e18;
};

export const getMantaStakedDataBifrost = async (walletAddress: string) => {
  const balance = await getBalance(
    walletAddress,
    "https://rpc.api.moonbeam.network",
    "0xffffffffda2a05fb50e7ae99275f4341aed43379"
  );

  return Number(balance) / 1e18;
};

//manta stakers data
export const getMantaStakersData = async (walletAddress: string) => {
  const manta: any = await getMantaStakedData(walletAddress);
  const mantaAccumulate = await getMantaStakedDataAccumulate(walletAddress);
  const mantaBifrost = await getMantaStakedDataBifrost(walletAddress);

  let totalStakedManta = 0;
  if (manta.success) {
    totalStakedManta += manta.data.totalStakingAmount;
  }
  if (mantaAccumulate > 0) {
    totalStakedManta += mantaAccumulate;
  }
  if (mantaBifrost > 0) {
    totalStakedManta += mantaBifrost;
  }
  return { totalStakedManta: totalStakedManta };
};

export const updateMantaStakersData = async (walletAddresses: string[]) => {
  const addressesString = JSON.stringify(walletAddresses);
  const wsProvider = new WsProvider("wss://ws.manta.systems");
    const api = await ApiPromise.create({
      provider: wsProvider,
      noInitWarn: true,
    });
  const graphQuery = `{
    bindPacificAddresses(where: { pacificAddress_in: ${addressesString} }) {
        id,
        atlanticAddress,
        pacificAddress,
        blockNumber
    }
  }`;
  const response = await mantaQueryData(graphQuery);
  const mantaData: any = {};
  const allMantaData=[]
  if (response.data.data) {
    if (response.data.data.bindPacificAddresses.length > 0) {
      const records = response.data.data.bindPacificAddresses;

      //
      records.map((item: any) => {
        item.stakingAmount = 0;
        mantaData[item.atlanticAddress] = item;
      });

      const atlanticAddressArray = Object.keys(mantaData);

      const delegatorState =
        await api.query.parachainStaking.delegatorState.multi(
          atlanticAddressArray
        );

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
        mantaData[atlanticAddressArray[i]].stakingAmount =
          currentAccountStakingAmount;
        allMantaData.push(mantaData[atlanticAddressArray[i]])
      }
      return { allMantaData };
    } 
  }
  return response.data.data.bindPacificAddresses;
};

export const updateMantaStakersAccumulate = async (
  walletAddresses: string[]
) => {
  const provider =await  MulticallWrapper.wrap(mantaProvider);
  const pool = new ethers.Contract(
    "0x7AC168c81F4F3820Fa3F22603ce5864D6aB3C547",
    MantaABI,
    provider
  );

  const results = await Promise.all(
    walletAddresses.map((w) => pool.balanceOf(w))
  );

  return results.map((userBalance, index) => {
    return {
      address: walletAddresses[index],
      balance: Number(userBalance) / 1e18,
    };
  });
};

export const updateMantaStakersBifrost = async (walletAddresses: string[]) => {
  const provider =await  MulticallWrapper.wrap(moonbeamProvider);
  const pool = new ethers.Contract(
    "0xFFfFFfFfdA2a05FB50e7ae99275F4341AEd43379",
    MantaABI,
    provider
  );
  // console.log(198,pool)
  const results = await Promise.all(
    walletAddresses.map((w) => pool.balanceOf(w))
  );
  return results.map((userBalance, index) => {
    return {
      address: walletAddresses[index],
      balance: Number(userBalance) / 1e18,
    };
  });
};
