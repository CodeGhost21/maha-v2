import rp from "request-promise";

export const getMahaPrice = async () => {
  const mahaToUsdPrice = await rp(
    `https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`
  );
  const mahaToUsd = Number(
    JSON.parse(mahaToUsdPrice)["mahadao"]["usd"]
  ).toPrecision(4);

  return mahaToUsd;
};

export const getEthToMahaPrice = async () => {
  const mahaToEthPrice = await rp(
    `https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=eth`
  );
  const ethToMaha = Number(
    1 / JSON.parse(mahaToEthPrice)["mahadao"]["eth"]
  ).toPrecision(6);

  return ethToMaha;
};

export const getArthToUSD = async () => {
  const arthToUsdPrice = await rp(
    `https://api.coingecko.com/api/v3/simple/price?ids=arth&vs_currencies=usd`
  );
  const arthToUsd = Number(
    JSON.parse(arthToUsdPrice)["arth"]["usd"]
  ).toPrecision(4);

  return arthToUsd;
};

export const tvlAprFn = async () => {
  const data = JSON.parse(await rp("https://api.arthcoin.com/apy/loans"));

  const tvlAprObj = {
    bsc: {
      tvl: data.chainSpecificData["56"].tvl,
      apr: data.chainSpecificData["56"].apr,
    },
    polygon: {
      tvl: data.chainSpecificData["137"].tvl,
      apr: data.chainSpecificData["137"].apr,
    },
  };

  return tvlAprObj;
};

export const poolTokenVal = async () => {
  const options = {
    method: "POST",
    uri: "https://api.arthcoin.com/apy/lp",
  };
  const data = JSON.parse(await rp(options));

  return data;
};
