// convert oauth methods to promises so we can use async/await syntax
// and keep our code sexier
import { OAuth } from "oauth";

const getCallback = (
  requestTokenURL: string,
  accessTokenURL: string,
  consumerKey: string,
  consumerSecret: string,
  oauthCallbackURL: string
) => {
  const _oauth = new OAuth(
    requestTokenURL,
    accessTokenURL,
    consumerKey, // consumer key
    consumerSecret, // consumer secret
    "1.0",
    oauthCallbackURL,
    "HMAC-SHA1"
  );

  return {
    getOAuthRequestToken: (): Promise<{
      oauthToken: string;
      oauthTokenSecret: string;
      results: object;
    }> =>
      new Promise((resolve, reject) => {
        _oauth.getOAuthRequestToken(
          (error, oauthToken, oauthTokenSecret, results) => {
            if (error) reject(error);
            else
              resolve({
                oauthToken,
                oauthTokenSecret,
                results,
              });
          }
        );
      }),

    getOAuthAccessToken: (
      oauthToken: string,
      oauthTokenSecret: string,
      oauthVerifier: string
    ): Promise<{
      oauthAccessToken: string;
      oauthAccessTokenSecret: string;
      results: object;
    }> => {
      return new Promise((resolve, reject) => {
        _oauth.getOAuthAccessToken(
          oauthToken,
          oauthTokenSecret,
          oauthVerifier,
          (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
            if (error) reject(error);
            else {
              resolve({
                oauthAccessToken,
                oauthAccessTokenSecret,
                results,
              });
            }
          }
        );
      });
    },

    getProtectedResource: (
      url: string,
      method: string,
      oauthAccessToken: string,
      oauthAccessTokenSecret: string
    ): Promise<{ data: any; response: any }> => {
      return new Promise((resolve, reject) => {
        _oauth.getProtectedResource(
          url,
          method,
          oauthAccessToken,
          oauthAccessTokenSecret,
          (error, data, response) => {
            if (error) reject(error);
            else resolve({ data, response });
          }
        );
      });
    },
  };
};

export default getCallback;
