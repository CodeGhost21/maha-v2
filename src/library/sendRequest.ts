import Request from "request-promise";

export const sendRequest = async <T>(
  method: string,
  url: string,
  body?: any
): Promise<T> => {
  if (body == null) {
    const option = {
      method,
      url,
      headers: {
        // 'x-api-key': '4bcc53aa-b0d9-4451-a2e5-124d311b52ef', // token
        "content-Type": "application/json",
      },
      // json: json
      // body: JSON.stringify(body),
    };
    return await Request(option);
  }
  const option = {
    method,
    url,
    headers: {
      // 'x-api-key': '4bcc53aa-b0d9-4451-a2e5-124d311b52ef',// token
      "content-Type": "application/json",
    },
    body: body,
  };
  return await Request(option);
};
