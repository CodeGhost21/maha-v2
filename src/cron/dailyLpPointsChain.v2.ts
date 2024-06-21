import {
  apiBlast,
  apiEth,
  apiLinea,
  apiManta,
  apiStakeZero,
  apiXLayer,
  apiZKSync,
  blastMultiplier,
  ethLrtMultiplier,
  lineaMultiplier,
  mantaMultiplier,
  stakeZeroMultiplier,
  xlayerMultiplier,
  zksyncMultiplier,
} from "../controller/quests/constants";
import { lpRateHourly } from "./updateRatesHourly";

// manta
export const mantaPPSCron = async () => {
  console.log("starting Manta points per second calculations");
  await lpRateHourly(apiManta, mantaMultiplier, "supplyManta", "borrowManta");
};

// zksync
export const zksyncPPSCron = async () => {
  console.log("starting ZkSync points per second calculations");
  await lpRateHourly(
    apiZKSync,
    zksyncMultiplier,
    "supplyZkSync",
    "borrowZkSync"
  );
};

// blast
export const blastPPSCron = async () => {
  console.log("starting Blast points per second calculations");
  await lpRateHourly(apiBlast, blastMultiplier, "supplyBlast", "borrowBlast");
};

// linea
export const lineaPPSCron = async () => {
  console.log("starting Linea points per second calculations");
  await lpRateHourly(
    apiLinea,
    lineaMultiplier,
    "supplyLinea",
    "borrowLinea",
    "stakeLinea",
    apiStakeZero,
    stakeZeroMultiplier
  );
};

// etherum Lrt
export const ethereumLrtPPSCron = async () => {
  console.log("starting EthereumLrt points per second calculations");
  await lpRateHourly(
    apiEth,
    ethLrtMultiplier,
    "supplyEthereumLrt",
    "borrowEthereumLrt"
  );
};

// xlayer
export const xLayerPPSCron = async () => {
  console.log("starting XLayer points per second calculations");
  await lpRateHourly(
    apiXLayer,
    xlayerMultiplier,
    "supplyXLayer",
    "borrowXLayer"
  );
};
