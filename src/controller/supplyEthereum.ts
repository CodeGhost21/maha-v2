// usersController.ts
import { Request, Response } from "express";
import { supplyPointsEthereumLrtRsETHMulticall } from "./quests/onChainPoints";
import { WalletUser } from "../database/models/walletUsers";

const BATCH_SIZE = 1000;

export const getUsersSupply = async (req: Request, res: Response) => {
  try {
    const usersWithSupply: any[] = await WalletUser.find({ 'points.supplyEthereumLrtRsEth': { $gt: 0 } }, { walletAddress: 1 });
    console.log("-----usersWithSupply count-----", usersWithSupply.length)
    const walletAddresses: string[] = usersWithSupply.map((user: any) => user.walletAddress);
    
    const usersWithSupplyData: { walletAddress: string, supply: number }[] = [];

    for (let i = 0; i < walletAddresses.length; i += BATCH_SIZE) {
      console.log("----running for batches----", i)
      const batch = walletAddresses.slice(i, i + BATCH_SIZE);
      const supplyData = await supplyPointsEthereumLrtRsETHMulticall(batch);

      for (const data of supplyData) {
        if (data.supply.points) {
          usersWithSupplyData.push({
            walletAddress: data.who,
            supply: data.supply.points
          });
        }
      }
    }

    res.json(usersWithSupplyData);
  } catch (error) {
    console.error("Error fetching users with supply:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
