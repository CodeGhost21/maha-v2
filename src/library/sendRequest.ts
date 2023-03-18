import Request from "request-promise";

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
      },
    };
    return await Request(option);
  }
  const option = {
    method,
    url,
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  };
  return await Request(option);
};
