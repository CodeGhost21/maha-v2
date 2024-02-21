import axios from "axios";
import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { mantaWhiteList } from "./constants";
// import { IMantaStaker } from "../interface/IMantaStaker";

export const getMantaStakedData = async (walletAddress: string) => {
  console.log(walletAddress);

  try {
    const checkWhileListed = mantaWhiteList.find(
      (item) =>
        item.pacificAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    if (checkWhileListed) {
      return {
        success: true,
        data: {
          ...checkWhileListed,
          stakedAmount: checkWhileListed.stakedAmount,
        },
      };
    } else {
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
      if (response.data.data) {
        if (response.data.data.bindPacificAddresses.length > 0) {
          const mantaData = {
            stakedAmount: 0,
            atlanticAddress:
              response.data.data.bindPacificAddresses[0].atlanticAddress,
            pacificAddress:
              response.data.data.bindPacificAddresses[0].pacificAddress,
            blockNumber: response.data.data.bindPacificAddresses[0].blockNumber,
          };

          // Fetch delegator state from Polkadot API
          const delegatorState =
            await api.query.parachainStaking.delegatorState(
              response.data.data.bindPacificAddresses[0].atlanticAddress
            );
          const currentDelegatorState: any = delegatorState.toJSON();

          if (currentDelegatorState !== null) {
            const delegationsRaw = currentDelegatorState.delegations[0];
            let currentAccountStakingAmount =
              Number(delegationsRaw.amount) / 1e18;
            // Update staking amount of bind record
            mantaData.stakedAmount = currentAccountStakingAmount;
          }

          console.log("Final mantaData:", mantaData);
          return { success: true, data: mantaData };
        } else if (response.data.data.bindPacificAddresses.length === 0) {
          return { success: false, message: "no data found" };
        }
      } else if (response.data.errors) {
        return { success: false, message: response.data.errors[0].message };
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};
