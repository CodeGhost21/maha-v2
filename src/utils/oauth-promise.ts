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
      oauth_token: string;
      oauth_token_secret: string;
      results: object;
    }> =>
      new Promise((resolve, reject) => {
        _oauth.getOAuthRequestToken(
          (error, oauth_token, oauth_token_secret, results) => {
            console.log(error, oauth_token, oauth_token_secret, results);
            if (error) reject(error);
            else resolve({ oauth_token, oauth_token_secret, results });
          }
        );
      }),

    getOAuthAccessToken: (
      oauth_token: string,
      oauth_token_secret: string,
      oauth_verifier: string
    ): Promise<{
      oauth_access_token: string;
      oauth_access_token_secret: string;
      results: object;
    }> => {
      return new Promise((resolve, reject) => {
        _oauth.getOAuthAccessToken(
          oauth_token,
          oauth_token_secret,
          oauth_verifier,
          (error, oauth_access_token, oauth_access_token_secret, results) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                oauth_access_token,
                oauth_access_token_secret,
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
      oauth_access_token: string,
      oauth_access_token_secret: string
    ): Promise<{ data: any; response: any }> => {
      return new Promise((resolve, reject) => {
        _oauth.getProtectedResource(
          url,
          method,
          oauth_access_token,
          oauth_access_token_secret,
          (error, data, response) => {
            if (error) {
              reject(error);
            } else {
              resolve({ data, response });
            }
          }
        );
      });
    },
  };
};

export default getCallback;
