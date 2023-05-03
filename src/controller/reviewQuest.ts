import nconf from "nconf";
import { sendRequest } from "./utils/sendRequest";

export const approveQuest = async (
  questId: string[],
  questStatus: string,
  comment?: string
) => {
  const url =
    "https://api.zealy.io/communities/themahadao/claimed-quests/review";
  const header = {
    // "Content-Type": "multipart/form-data",
    "x-api-key": `${nconf.get("ZEALY_API_KEY")}`,
  };
  const body = {
    status: questStatus,
    claimedQuestIds: questId,
    comment: comment,
  };

  const submissions: any = await sendRequest("post", url, header, body);
  console.log(submissions);

  return submissions;
};
