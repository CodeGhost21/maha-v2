import nconf from "nconf";
import { sendMessage } from "./discord";

export const sendFeedDiscord = async (feedChannelId: string, msg: string) => {
  sendMessage(feedChannelId, msg);
};
