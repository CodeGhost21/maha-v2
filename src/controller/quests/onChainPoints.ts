
import axios from "axios";
import { IWalletUserModel } from "../../database/models/walletUsers";
import {
  assetDenomination,
} from "./constants";

export const tokenBalanceGQL = async (
  api: string,
  userBatch: IWalletUserModel[],
) => {
  try {
    const tokenBalances = new Map();
    const tempBatch = Array.from(userBatch);
    while (tempBatch.length) {
      const subBatch = tempBatch.splice(0, 100);
      const graphQuery = `query {
        tokenBalances(where: {id_in:  [${subBatch.map(
        (u) => `"${u.walletAddress}"`
      )}]}, first: 1000) {
        id
        usdz
        susdz
        maha
        }
      }`;

      const headers = {
        "Content-Type": "application/json",
      };
      const data = await axios.post(
        api,
        { query: graphQuery },
        { headers, timeout: 300000 }
      ); // 5 minute
      if (data.data.errors) {
        console.log(data.data.errors);
      }
      const result = data.data.data.tokenBalances;

      if (result.length) {
        result.forEach((user: any) => {
          tokenBalances.set(user.id, {
            usdz:
              (user.usdz / assetDenomination.usdz),
            susdz:
              (user.susdz / assetDenomination.susdz),
            maha:
              (user.maha / assetDenomination.maha),
            szaifraxbp:
              (user.szaifraxbp / assetDenomination.szaifraxbp),
          });
        });
      }
    }
    return tokenBalances;
  } catch (error) {
    console.log("error while fetching stake data");
    throw error;
  }
};


