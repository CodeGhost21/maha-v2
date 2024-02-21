import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
import { WalletUser } from "../database/models/walletUsers";

open();

const checkReferralCodeExists = async (referralCode: string) => {
  console.log(17, referralCode, new RegExp("^" + referralCode + "$", "i"));

  const existingReferral = await WalletUser.findOne({
    referralCode: { $regex: new RegExp("^" + referralCode + "$", "i") },
  });
  console.log(existingReferral);

  return !!existingReferral;
};

const referralCodesNew = [
  "CryptoBanter",
  "MilesDeutscher",
  "CryptoWizard",
  "IvanonTech",
  "top7",
  "Boxmining",
  "LadyofCrypto",
  "SpiderCrypto",
  "0xJeff",
  "Stronghedge",
  "Pentoshi",
  "AltcoinSherpa",
  "TraderLenny",
  "AlexKruger",
  "Blackbeard",
  "JustinWu",
  "CryptoZein",
  "BrianDEvans",
  "MrBlock",
  "Jett",
  "Kong",
  "IBCIG",
  "NickRose",
  "Gainzy",
  "TheMartiniGuy",
  "Koko",
  "CryptoxHunter",
  "Nekoz",
  "Pwnlord69",
  "Smol",
  "Sidebae",
  "Doomsdart",
  "Corgil",
  "OverDose",
  "Sugar",
  "NFTdefi",
  "Ericcryptoman",
  "Pows",
  "Acid",
  "CryptoDiffer",
  "WizardCapital",
  "FastEdward",
  "CryptoLark",
  "TraderDaink",
  "Eurosniper",
  "ShardiB",
  "DannyLes",
  "TraderSZ",
  "LeTimeTou",
  "Fastlife",
  "Cryptotoast",
  "Kashkysh",
  "Talktoumang",
  "CharlesReid",
  "Buddy",
  "BasementDAO",
  "Dingaling",
  "Shan",
  "TassoLogo",
  "UncleRick",
  "Kirby",
  "ABCryptoTalks",
  "AshWSBCrypto",
  "SamBitcoinDuniya",
  "Fomocatcher",
  "HiteshMalviya",
  "Aniakormichelle",
  "CryptoVikings",
  "TraderKoz",
  "CryptoMich",
  "SalsaTekila",
  "Phoenix_Ash3s",
  "TeddyCleps",
  "Pastore1314",
  "SilverBulletBTC",
  "TheCryptoMonk",
  "Damskotrades",
  "CryptopepperP",
  "SmokeyHosoda",
  "GonzoXBT",
  "CryptoAM17",
  "CryptoChapo",
  "CryptoFundamentalss",
  "Elontrades",
  "Dentoshi",
  "CryptoAmsterdam",
  "PyroCapital",
  "RaAres",
  "Cryptoiso",
  "TechMoonWalker",
  "MiddleChildPabk",
  "Asedd72",
  "Axel_bitblaze69",
  "Hrithik",
  "HitNetwork",
  "Wendy",
  "CryptoStylo",
  "Blaze",
  "CryptoJones",
  "CryptoMendo",
  "Storm",
  "Vegito",
  "Holliday",
  "Randy",
  "CryptoLiff",
  "MarkADAO",
  "tenevick",
  "DohidUA",
  "Di_krass",
  "cryptozombies9514",
  "HareCrypta",
  "dencryptohodl",
  "prorock9135",
  "crypto_solyanka",
  "nftup",
  "swiper_money",
  "swoptoky",
  "MoonPatrol_media",
  "mindsCrypt",
  "crypto_temper",
  "benznft",
  "binance_temki",
  "bogateinadivane",
  "capycryptos",
  "coin_pocket",
  "crafty_jew",
  "crypt_biznes",
  "crypto_sharkk",
  "CryptoAbuzik",
  "cryptobox_club",
  "cryptocrossua",
  "cryptoniteua",
  "CryptoPartyCrew",
  "cryptopreacher",
  "cryptothunder1",
  "cryptotrackerswork",
  "cryptoukrainian7",
  "cryptowebz",
  "CryptoXGlobal",
  "easycryptv",
  "etrcrypto",
  "FounderCrypto1",
  "harecrypta_chat",
  "HareCrypta_lab_ann",
  "igorizuchaetcrypty",
  "KATANACRYPTO2",
  "kryptodohidua",
  "learncryptotg",
  "mavrodi_call",
  "nftcapta1n",
  "NFTGuide",
  "PepeKrypto",
  "philip_v_kripte",
  "TVS_TEAM",
  "umperium",
  "undercryptoo",
  "uspeshniy_temshik",
  "zarobitok_vn",
  "BablCashCrypto",
  "BN_invest",
  "capone_in_crypto",
  "crypto_man_tg",
  "CRYPTOGENNN",
  "cryptonit_k2",
  "d4side",
  "emotion_Crypto",
  "enakench",
  "farmimcryptu",
  "fomodaoSS",
  "hamsterdrops",
  "MishaFyk",
  "nonamebitok",
  "phmcrypto",
  "rudtyt",
  "sergeybusko",
  "tokito_btc",
  "xl1bra",
  "young_rich_nosmart",
  "portal_gem",
  "bulletresearchq",
  "crypto_airdrop_NFTs",
  "crypto_hom4ik",
  "crypto_penguin4ik",
  "cryptomaven0",
  "DK_Cryptonit",
  "eazyscalping",
  "kinomakera",
  "Kryptonchik",
  "lizacallit",
  "lowbank_street",
  "lviv_abuzers",
  "lvivcriptan22",
  "maycrypto",
  "MetaVersas",
  "murchimpronft",
  "oboriak",
  "posleshkolynazavod",
  "proofitly",
  "raduscrypto94",
  "rafaelcrypt",
  "romcry",
  "tesla_crypto1",
  "waxscamru",
  "balakhonov_invest",
  "Keyur",
  "M6Labs",
  "VirtualBacon",
  "MadCripto",
];

const deleteAddress = ["Keyur", "M6Labs", "VirtualBacon", "MadCripto"];

const deletePythUsers = async () => {
  deleteAddress.map(async (item: string) => {
    if (await checkReferralCodeExists(item)) {
      const response = await WalletUser.deleteOne({
        referralCode: item,
      });
      console.log(response);
    } else {
      console.log("no referral code");
    }
  });
};

// deletePythUsers();

const addPythUsers = async () => {
  referralCodesNew.map(async (item: string) => {
    if (!(await checkReferralCodeExists(item))) {
      console.log("does not exists");
      await WalletUser.create({
        referralCode: item,
      });
    } else {
      console.log("already added");
    }
  });
};

addPythUsers();
