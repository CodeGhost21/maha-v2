import nconf from "nconf";
import { sendRequest } from "./sendRequest";

export const twitterRequest = async (method: string, url: string) => {
  const header = {
    Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
  };
  const twitterData: any = await sendRequest(method, url, header);
  const parseTwitterData = JSON.parse(twitterData);

  return parseTwitterData;
};
