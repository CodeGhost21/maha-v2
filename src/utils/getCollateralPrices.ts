import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys = "MAHA" | "ETH";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  let result;
  try {
    result = await CoinGeckoClient.simple.price({
      ids: "mahadao,ethereum",
      vs_currencies: "USD",
    });
  } catch (error) {
    console.log("getCollateralPrices error", error);
  }

  return {
    ETH: result?.data?.ethereum?.usd || 0,
    MAHA: result?.data?.mahadao?.usd || 0,
  };
};
