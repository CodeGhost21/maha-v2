import nconf from "nconf";
import oauthCallback from "../utils/oauth-promise";

const twiiterOauth = oauthCallback(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  nconf.get("TWITTER_CONSUMER_KEY"), // consumer key
  nconf.get("TWITTER_CONSUMER_SECRET"), // consumer secret
  nconf.get("TWITTER_CALLBACK_URL")
);

export default twiiterOauth;
