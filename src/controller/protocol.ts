import { Request, Response } from "express";
import cache from "../utils/cache";

export const getProtocolPoints = async (req: Request, res: Response) => {
  res.json({
    blastPoints: cache.get("bp:blastPoints"),
    elPoints: cache.get("elp:ELPoints"),
  });
};
