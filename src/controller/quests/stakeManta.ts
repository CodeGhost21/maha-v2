import axios from "axios";
import { ethers } from "ethers";
import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";

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

export const getMantaStakedData = async (walletAddress: string) => {
  try {
    const wsProvider = new WsProvider("wss://ws.manta.systems");
    const api = await ApiPromise.create({
      provider: wsProvider,
      noInitWarn: true,
    });

    const queryURL =
      "https://api.goldsky.com/api/public/project_clnv4qr7e30dv33vpgx7y0f1d/subgraphs/mainnet-staker/1.0.0/gn";

    const graphQuery = `query {
        bindPacificAddresses(where: { pacificAddress: "${walletAddress}" }) {
            id,
            atlanticAddress,
            pacificAddress,
            blockNumber
        }
      }`;

    const headers = {
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      queryURL,
      { query: graphQuery },
      { headers }
    );
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

        let atlanticAddressArray = Object.keys(mantaData);

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
