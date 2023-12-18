export const fetchTweetId = (uri: string) => {
  const tweetId = uri.match("status\\/(\\d+)/?");
  return tweetId && tweetId.length > 0 ? tweetId[1] : undefined;
};

export const fetchTwitterUserName = async (uri: string) => {
  const twitterUserName = uri.match(/https:\/\/twitter\.com\/(\w+)\//);
  return twitterUserName && twitterUserName.length > 0
    ? twitterUserName[1]
    : undefined;
};
