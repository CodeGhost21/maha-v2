import axios from "axios";
import { ApiPromise, WsProvider } from "@polkadot/api";

export interface IMantaStakeData {
  pacificAddress: string;
  atlanticAddress: string;
  blockNumber: number;
  stakedAmount: number;
}

export const getMantaStakedData = async (walletAddress: string) => {
  console.log(walletAddress);

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

    const mantaData = {
      stakedAmount: 0,
      atlanticAddress:
        response.data.data.bindPacificAddresses[0].atlanticAddress,
      pacificAddress: response.data.data.bindPacificAddresses[0].pacificAddress,
      blockNumber: response.data.data.bindPacificAddresses[0].blockNumber,
    };

    // Fetch delegator state from Polkadot API
    const delegatorState = await api.query.parachainStaking.delegatorState(
      response.data.data.bindPacificAddresses[0].atlanticAddress
    );
    const currentDelegatorState: any = delegatorState.toJSON();

    if (currentDelegatorState !== null) {
      const delegationsRaw = currentDelegatorState.delegations[0];
      let currentAccountStakingAmount = Number(delegationsRaw.amount) / 1e18;
      // Update staking amount of bind record
      mantaData.stakedAmount = currentAccountStakingAmount;
    }

    console.log("Final mantaData:", mantaData);
    return { success: true, data: mantaData };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};
