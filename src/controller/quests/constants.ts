export const points = {
  discordFollow: 100,
  twitterFollow: 100,
  gm: 10,
  LQTYHolder: 1000,
  AAVEStaker: 1000,
  MAHAStaker: 10000,
};

export const referralPercent = 0.2;

export const minSupplyAmount = 100;

export const stakePtsPerManta = 5;

export const stakePtsPerCake = 0.25;

export const stakePtsPerMAHA = 1000;

export interface Multiplier {
  defaultSupply: number;
  defaultBorrow: number;
  ethSupply?: number;
  ethBorrow?: number;
  esethSupply?: number;
  lidoSupply?: number;
}

export const ethLrtMultiplier: Multiplier = {
  defaultSupply: 1,
  defaultBorrow: 4,
  ethSupply: 2,
  ethBorrow: 8,
  esethSupply: 1,
};

export const zksyncMultiplier: Multiplier = {
  defaultSupply: 1,
  defaultBorrow: 4,
  lidoSupply: 2,
};

export const blastMultiplier: Multiplier = {
  defaultSupply: 1,
  defaultBorrow: 4,
};

export const lineaMultiplier: Multiplier = {
  defaultSupply: 1,
  defaultBorrow: 4,
};

export const mantaMultiplier: Multiplier = {
  defaultSupply: 1,
  defaultBorrow: 4,
};

export const xlayerMultiplier: Multiplier = {
  defaultSupply: 1,
  defaultBorrow: 4,
};

export const blastStartDate = new Date("29 Feb 2024").getTime();

export const LQTYHolders: string[] = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
  "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
];

export const AAVEStakers: string[] = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
  "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
];

export const LUSDHolders: string[] = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
];

export const MAHAStakers: string[] = [
  "0x961E45e3666029709C3ac50A26319029cde4e067",
  "0x98a7Fa97B90f1eC0E54cAB708247936a5fa33492",
  "0xa50Bcd7B0B33f60FA26f2c7e7eC6eE33b683A818",
  "0x428c782685a1f223bAA34Eab6ea5c5D7ac6e4E8b",
  "0x7d583D4d3404055a75640d94759A242255d9f5F8",
];

export const whiteListTeam = ["0x961E45e3666029709C3ac50A26319029cde4e067"];

export const mantaWhiteList = [
  {
    pacificAddress: "0xF152dA370FA509f08685Fa37a09BA997E41Fb65b",
    atlanticAddress: "dfbVG31hitAGSAcaYY3x281aWdbGbSoGcVnm485MuPARftLKg",
    bindBlockNumber: 1411966,
    stakedAmount: 100,
  },
  {
    pacificAddress: "0x961E45e3666029709C3ac50A26319029cde4e067",
    atlanticAddress: "dfbVG31hitAGSAcaYY3x281aWdbGbSoGcVnm485MuPARftLKg",
    bindBlockNumber: 1411966,
    stakedAmount: 150,
  },
  {
    pacificAddress: "0x6087D9526fBE09675474749222950f40FfE5400E",
    atlanticAddress: "dfbVG31hitAGSAcaYY3x281aWdbGbSoGcVnm485MuPARftLKg",
    bindBlockNumber: 1411966,
    stakedAmount: 50,
  },
];

export const baseUrl =
  "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/";
export const apiManta = baseUrl + "zerolend-m/1.0.0/gn";
export const apiZKSync = baseUrl + "zerolend-zksync/1.0.0/gn";
export const apiEth = baseUrl + "zerolend-mainnet-lrt/1.0.0/gn";
export const apiLinea = baseUrl + "zerolend-linea/1.0.0/gn";
export const apiBlast = baseUrl + "zerolend-blast/1.0.0/gn";
export const apiXLayer = baseUrl + "zerolend-xlayer/1.0.0/gn";
