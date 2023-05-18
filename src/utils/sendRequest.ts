import Request from "request-promise";

export const sendRequest = async <T>(
  method: string,
  url: string,
  header: any,
  body?: any
): Promise<T> => {
  if (body == null) {
    const option = {
      method,
      url,
      headers: header,
    };
    return await Request(option);
  }

  const option = {
    method,
    url,
    headers: header,
    body: body,
    json: true,
  };
  return await Request(option);
};
