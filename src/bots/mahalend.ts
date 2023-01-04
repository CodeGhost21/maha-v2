import nconf from "nconf";
import { ethers } from "ethers";
import { WebSocketProvider } from "@ethersproject/providers";

import Mahalend from "../abi/Mahalend.json"
import * as discord from "../output/discord";
import { getDisplayBalance } from "../utils/formatValues";
// import { getCollateralPrices } from "../utils/getCollateralPrices";
import { IEvent } from "../utils/interfaces";
import { getAssetName } from "../utils/getAssetName";

const mahalendContracts = [
    {
      chainWss: nconf.get("MAINNET_ETH"),
      explorer: "https://etherscan.io",
      contract: "0x76F0C94Ced5B48020bf0D7f3D0CEabC877744cB5",
      opensea: "https://opensea.io/assets/ethereum/0xbdd8f4daf71c2cb16cce7e54bb81ef3cfcf5aacb",
    },
    // {
    //     chainWss: nconf.get("GOERLI_WSS"),
    //     explorer: "https://goerli.etherscan.io/",
    //     contract: "0x5978142f5772dF301c6D61C853BAb4c183bAB0F6",
    //     opensea: "https://opensea.io/assets/ethereum/0xbdd8f4daf71c2cb16cce7e54bb81ef3cfcf5aacb"
    // }
];

const craftMessageFromEvent = async (
    data: IEvent,
    explorer: string,
    opensea: string
  ) => {
    let msg = "";
    let noOfTotalDots = 0
    // const prices = await getCollateralPrices();
    const asset = getAssetName(data.args[0])
    const who = data.args[1]
    const value = Number(getDisplayBalance(data.args[3], asset === "USDC" ? 6 : 18));


    if(data.event == "Borrow") {
        const interestRateMode = data.args[4] === 1 ? 'Stable' : 'Variable'
        // const borrowRate = Number(data.args[5]._hex)
        noOfTotalDots = Math.ceil(value / 10);
        msg = `${value} ${asset} borrowed by ${who} with ${interestRateMode} interest rate.`
    }
    if(data.event == "Supply") {

        noOfTotalDots = Math.ceil(value / 10);
        msg = `${value} ${asset} supplied by ${who}.`
    }
    if(data.event == "Withdraw") {

        noOfTotalDots = Math.ceil(value / 10);
        msg = `${value} ${asset} withdrawn by ${who}.`
    }
    if(data.event == "Repay") {

        noOfTotalDots = Math.ceil(value / 10);
        msg = `${value} ${asset} repaid by ${who}.`
    }

    return(
        craftMessage(msg,  data.transactionHash, noOfTotalDots, explorer, data.event === 'Withdraw' || data.event == 'Repay' ? 'red' : 'green')
    )

  }

const craftMessage = (
    msg: string,
    txHash: string,
    noOfTotalDots: number,
    explorer: string,
    dotType?: "green" | "red"
  ) => {
    let dots = "";

    if (dotType) {
        for (let i = 0; i < noOfTotalDots; i++) {
          if (dotType == "green") dots += "🚀";
          else dots += "🔴";
        }
    
        dots += "";
    }
    
    const hash = `<${explorer}/tx/${txHash}>`;

    console.log(`${msg}\n\n` + `${dots}\n\n` + `Hash: ${hash}\n`)

    return (
        `${msg}\n\n` + `${dots}\n\n` + `Hash: ${hash}\n`
    );

  }


export default () => {
    console.log("listening for mahalend events");

    mahalendContracts.map((lend) => {
        const provider = new WebSocketProvider(lend.chainWss);
        const contract = new ethers.Contract(lend.contract, Mahalend, provider);

        contract.on("Supply", async (...args) => {
            const msg = await craftMessageFromEvent(
                args[5],
                lend.explorer,
                lend.opensea
            );

        discord.sendMessage(nconf.get("Mahalend_Discordchannel"), msg);
        });

        contract.on("Withdraw", async (...args) => {
            const msg = await craftMessageFromEvent(
                args[4],
                lend.explorer,
                lend.opensea
            );

        discord.sendMessage(nconf.get("Mahalend_Discordchannel"), msg);
        });

        contract.on("Borrow", async (...args) => {
            const msg = await craftMessageFromEvent(
                args[7],
                lend.explorer,
                lend.opensea
            );

        discord.sendMessage(nconf.get("Mahalend_Discordchannel"), msg);
        });

        contract.on("Repay", async (...args) => {
            const msg = await craftMessageFromEvent(
                args[5],
                lend.explorer,
                lend.opensea
            );

        discord.sendMessage(nconf.get("Mahalend_Discordchannel"), msg);
        });
        
    });
};