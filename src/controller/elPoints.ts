import axios from "axios";
import { Request, Response } from "express";
import cache from "../utils/cache";

const handleRequest = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export const ELPoints = async () => {
  let elPoints = 0;
  const renzoUrl =
    "https://app.renzoprotocol.com/api/points/0x68fD75cF5a91F49EFfAd0E857ef2E97e5d1f35e7?chainId=1";
  const kelpDaoUrl =
    "https://common.kelpdao.xyz/km-el-points/user/0xeF4A41E692319aE4AA596314D282B3F2a3830bED";

  const renzoData = await handleRequest(renzoUrl);
  const kelpDaoData = await handleRequest(kelpDaoUrl);

  elPoints =
    Number(renzoData.data.totals.eigenLayerPoints) +
    Number(kelpDaoData.value.elPoints);

  const result = {
    elPoints,
    renzoPoints: renzoData.data.totals.renzoPoints,
    kelpMiles: Number(kelpDaoData.value.kelpMiles),
  };
  cache.set("elp:ELPoints", result, 60 * 60 * 1000);
};
