import nconf from "nconf";
import { sendMessage } from "./discord";

export const sendFeedDiscord = async (msg: string) => {
  sendMessage(nconf.get("CHANNEL_FEED"), msg);
};
