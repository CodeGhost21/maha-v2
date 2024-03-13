import { Request, Response } from "express";
import { ELPoints } from "./elPoints";
import { BlastPoints } from "./quests/blastPoints";
import cache from "../utils/cache";

export const getProtocolPoints = async (req: Request, res: Response) => {
  const cached = cache.get("pp:protocolPoints");
  if (cached) {
    return res.json(cached);
  }
  const blastPoints = await BlastPoints();
  const elPoints = await ELPoints();

  const result = {
    blastPoints,
    ...elPoints,
  };
  cache.set("pp:protocolPoints", result, 60 * 60 * 1000);
  res.json(result);
};
