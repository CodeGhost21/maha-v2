import { Request, Response } from "express";
import { ethers } from "ethers";
import { BlastUser } from "../database/models/blastUsers";

export const getBlastUser = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.walletAddress as string;
  if (walletAddress && ethers.isAddress(walletAddress)) {
    const result = await BlastUser.findOne({
      walletAddress: walletAddress.toLowerCase().trim(),
    });
    if (result) {
      const response = {
        blastPoint: result.blastPoints.pointsGiven || 0,
        blastGold: result.blastGold.pointsGiven || 0,
      };

      res.json({ success: true, response });
    } else {
      res.json({ success: false, message: "no data found" });
    }
  }
};
