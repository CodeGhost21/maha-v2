import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys = "MAHA";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  let result;
  try {
    result = await CoinGeckoClient.simple.price({
      ids: "mahadao",
      vs_currencies: "USD",
    });
  } catch (error) {
    console.log("getCollateralPrices error", error);
  }

  return {
    MAHA: result?.data?.mahadao?.usd || 0,
  };
};
