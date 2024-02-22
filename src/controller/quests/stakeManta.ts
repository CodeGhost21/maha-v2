import axios from "axios";
import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
// import { mantaWhiteList } from "./constants";
// import { IMantaStaker } from "../interface/IMantaStaker";

export const getMantaStakedData = async (walletAddress: string) => {
  console.log(walletAddress);

  try {
    // const checkWhileListed = mantaWhiteList.find(
    //   (item) =>
    //     item.pacificAddress.toLowerCase() === walletAddress.toLowerCase()
    // );
    // if (checkWhileListed) {
    //   return {
    //     success: true,
    //     data: {
    //       ...checkWhileListed,
    //       stakedAmount: checkWhileListed.stakedAmount,
    //     },
    //   };
    // } else {
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
    // }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};
