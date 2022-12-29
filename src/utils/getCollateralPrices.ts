import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys = "MAHA" | "SCLP" | "BNB";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  let result;
  try {
    result = await CoinGeckoClient.simple.price({
      ids: "bitcoin,ethereum,dai,tether,mahadao,arth,usd-coin,scallop,binance-usd,apeswap-finance,wmatic,wbnb,frax-share,binancecoin",
      vs_currencies: "USD",
    });
  } catch (error) {
    console.log("getCollateralPrices error", error);
  }

  return {
    MAHA: result?.data.mahadao.usd || 0,
    SCLP: result?.data.scallop.usd || 0,
    BNB: result?.data["binancecoin"].usd || 0,
  };
};
