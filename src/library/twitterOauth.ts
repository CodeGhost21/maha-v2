import nconf from "nconf";
import oauthCallback from "../utils/oauth-promise";
import urlJoin from "../utils/urlJoin";

const twitterOauth = oauthCallback(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  nconf.get("TWITTER_CONSUMER_KEY"), // consumer key
  nconf.get("TWITTER_CONSUMER_SECRET"), // consumer secret
  urlJoin(nconf.get("FRONTEND_URL"), "twitterCallback")
);

export default twitterOauth;
