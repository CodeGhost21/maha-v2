import { sendMessage } from "./discord";

export const sendFeedDiscord = async (feedChannelId: string, msg: string, isRowComp?: boolean) => {
  sendMessage(feedChannelId, msg, isRowComp);
};
