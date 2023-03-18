//convert oauth methods to promises so we can use async/await syntax
//and keep our code sexier
import { OAuth } from "oauth";
import nconf from "nconf";

const getCallback = (oauthCallback: string) => {
  const CONSUMER_KEY = nconf.get("TWITTER_CONSUMER_KEY");
  const CONSUMER_SECRET = nconf.get("TWITTER_CONSUMER_SECRET");

  const _oauth = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    CONSUMER_KEY, // consumer key
    CONSUMER_SECRET, // consumer secret
    "1.0",
    oauthCallback,
    "HMAC-SHA1"
  );

  const oauth = {
    getOAuthRequestToken: (): Promise<{
      oauth_token: string;
      oauth_token_secret: string;
      results: object;
    }> => {
      return new Promise((resolve, reject) => {
        _oauth.getOAuthRequestToken(
          (error, oauth_token, oauth_token_secret, results) => {
            if (error) {
              reject(error);
            } else {
              resolve({ oauth_token, oauth_token_secret, results });
            }
          }
        );
      });
    },

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
    ) => {
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

  return oauth;
};

export default getCallback;
