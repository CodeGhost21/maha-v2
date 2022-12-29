import CoinGecko from "coingecko-api";

const CoinGeckoClient = new CoinGecko();

export type CollateralKeys =
  | "USDC"
  | "WBTC"
  | "BUSD"
  | "USDT"
  | "ARTH.usd"
  | "bsc.3eps"
  | "polygon.3pool"
  | "DAI"
  | "WETH"
  | "MAHA"
  | "ARTH"
  | "SCLP"
  | "BANNANA"
  | "BSCUSDC"
  | "BSCUSDT"
  | "WMATIC"
  | "WBNB"
  | "FRAX"
  | "BNB";

export type ICollateralPrices = {
  [key in CollateralKeys]: number;
};

export const getCollateralPrices = async (): Promise<ICollateralPrices> => {
  let result
  try {
     result = await CoinGeckoClient.simple.price({
      ids: "bitcoin,ethereum,dai,tether,mahadao,arth,usd-coin,scallop,binance-usd,apeswap-finance,wmatic,wbnb,frax-share,binancecoin",
      vs_currencies: "USD",
    });
  } catch (error) {
    console.log("getCollateralPrices error", error)
  }

  return {
    ARTH: result?.data.arth.usd || 0,
    WBTC: result?.data.bitcoin.usd || 0,
    BUSD: result?.data["binance-usd"].usd || 0,
    USDT: result?.data.tether.usd || 0,
    "polygon.3pool": 1.048 || 0,
    "ARTH.usd": 1 || 0,
    "bsc.3eps": 1.0392 || 0,
    DAI: result?.data.dai.usd || 0,
    USDC: result?.data["usd-coin"].usd || 0,
    WETH: result?.data.ethereum.usd || 0,
    MAHA: result?.data.mahadao.usd || 0,
    SCLP: result?.data.scallop.usd || 0,
    BANNANA: result?.data["apeswap-finance"].usd || 0,
    BSCUSDC: result?.data["usd-coin"].usd || 0,
    BSCUSDT: result?.data.tether.usd || 0,
    WMATIC: result?.data.wmatic.usd || 0,
    WBNB: result?.data.wbnb.usd || 0,
    FRAX: result?.data['frax-share'].usd || 0,
    BNB: result?.data['binancecoin'].usd || 0
  };
};
