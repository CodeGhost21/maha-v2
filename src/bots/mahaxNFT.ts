import nconf from "nconf";

import MAHAX from "../abi/MAHAX.json";
import * as discord from "../output/discord";
import * as telegram from "../output/telegram";
import { msgToBeSent } from "../utils/msgToBeSent";
import { config } from "../utils/config";
import { ethers } from "ethers";
import { WebSocketProvider } from "@ethersproject/providers";

export default () => {
  const nftContracts = [
    {
      chainName: "Ethereum",
      chainWss: nconf.get("MAINNET_ETH"),
      contract: "0xbdD8F4dAF71C2cB16ccE7e54BB81ef3cfcF5AAcb",
    },
    // {
    //   chainName: "Rinkeby",
    //   chainWss: nconf.get('WSS_RINKEBY'),
    //   contract: {
    //     address: "0xCb3f67601f122190f2F6aE2ce1262cfb8e6361C4"

    //   }
    // },
    // {
    //   chainName: "Polygon Mainnet",
    //   chainWss: nconf.get("MAINNET_MATIC"),
    //   contract: [
    //     {
    //       address: "0x5ce7F38dFF1ff187e80A41D710f32c2Bb1bA87b7"
    //     }
    //   ]
    // }
  ];

  const craftMessage = (data: any, chainName: string, s: string) => {
    // test
  };

  nftContracts.map((nft) => {
    const provider = new WebSocketProvider(nft.chainWss);
    const contract = new ethers.Contract(nft.contract, MAHAX, provider);

    contract.on("Deposit", (...args) => {
      console.log(args);
      // const msg = craftMessage(data, nft.chainName, "", "mahaxnft");
    });
  });
};
