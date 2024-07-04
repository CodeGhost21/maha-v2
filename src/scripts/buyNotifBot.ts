import { MessageEmbed, WebhookClient } from "discord.js";
import { ethers } from "ethers";
import { lineaProvider } from "../utils/providers";
import nconf from "nconf";
import { getPriceCoinGecko } from "../controller/quests/onChainPoints";
import axios from "axios";


export const getMarketCap = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/zerolend');
    const marketCap = response.data.market_data.market_cap.usd;
    console.log(`Ethereum Market Cap: $${marketCap}`);
    return marketCap
  } catch (error) {
    console.error('Error fetching market cap:', error);
  }
}

const zeroTokenABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

const zeroTokenAddress = "0x78354f8DcCB269a615A7e0a24f9B0718FDC3C7A7";
const webhookClient = new WebhookClient({
  url: nconf.get("DISCORD_CHANNEL_WEBHOOK"),
});

export default () => {
  console.log("listening for Zero Transfer events");

  const zero = new ethers.Contract(
    zeroTokenAddress,
    zeroTokenABI,
    lineaProvider
  );

  const emb = new MessageEmbed()
    .setColor("GREEN")
    .setTitle("$ZERO buy notification");

  zero.on("Transfer", async (from, to, value, event) => {
    if (from === "0xb88261e0DBAAc1564f1c26D78781F303EC7D319B") {
      const _value = ethers.formatEther(value);
      const marketPrice = await getPriceCoinGecko()
      const usdValue = Number(_value) * marketPrice.zerolend

      if (usdValue > 50) {

        const spent = `$${usdValue.toFixed(2)} (${(usdValue / marketPrice.eth).toFixed(4)} WETH)`;
        const got = `${Number(Number(_value).toFixed(2)).toLocaleString()} ZERO`;
        const buyer = `${to}`;
        const price = `$${marketPrice.zerolend}`;//(${(marketPrice.zerolend / marketPrice.eth).toFixed(4)} WETH)
        const marketCap = await getMarketCap()

        const greenDotsCount = Math.floor(usdValue / 50);
        const greenDots = "🟢".repeat(greenDotsCount);

        const message = `
        ${greenDots}\n
       💰 Spent: ${spent}
       💱 Got: ${got}
       🤵‍♂️ ${buyer}
       💵 Price: ${price}
       🧢 MCap: ${marketCap.toLocaleString()}\n
       Transaction: https://lineascan.build/tx/${event.log.transactionHash}
     `;

        webhookClient.send({
          username: "ZERO-Buy-bot",
          avatarURL:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4KPJ9jv03VeOT1ORvwAMyFfs53CCay4mDfQ1cJETiHFQQgH3xO7fRyeQ4dw&s",
          embeds: [emb.setDescription(message)],
        });
      }
    }
  });
};
