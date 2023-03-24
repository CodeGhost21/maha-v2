import Request from "request-promise";
import nconf from "nconf";

export const sendRequest = async <T>(
  method: string,
  url: string,
  body?: object
): Promise<T> => {
  if (body == null) {
    const option = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
      },
    };
    return await Request(option);
  }
  const option = {
    method,
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
    },
    body: body,
  };
  return await Request(option);
};
