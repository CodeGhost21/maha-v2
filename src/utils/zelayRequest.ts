import nconf from "nconf";

import { sendRequest } from "../utils/sendRequest";

export const zelayRequest = async (method: string, url: string, body?: any) => {
  try {
    const header = {
      "x-api-key": `${nconf.get("ZEALY_API_KEY")}`,
    };
    const response: any = await sendRequest(method, url, header, body);
    const parseResponse = JSON.parse(response);
    return { success: true, data: parseResponse };
  } catch (e: any) {
    return { success: false, statuscode: e.statusCode };
  }
};
