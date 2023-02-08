import * as jwt from "jsonwebtoken";
import nconf from "nconf";
// import * as ethers from 'ethers'
import { client, sendMessage } from "../output/discord";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { User } from "../database/models/user";
// import MAHAX from "../abi/MahaXAbi.json"
const Contract = require("web3-eth-contract");

Contract.setProvider(nconf.get("ETH_RPC"));
const accessTokenSecret = nconf.get("JWT_SECRET");
// const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"))

client.on("guildMemberAdd", async (member) => {
  let token = "";
  const user = await User.findOne({ userID: member.user.id });
  if (user) {
    token = await jwt.sign({ id: String(user.id) }, accessTokenSecret);
    user["jwt"] = token;
    user["signDiscord"] = true;
    await user.save();
  } else {
    const date = Date.now();
    const newUser = new User({
      userTag: `${member.user.username}#${member.user.discriminator}`,
      userID: member.user.id,
      streak: 0,
      maxStreak: 0,
      totalGMs: 0,
      lastGM: date,
      discordName: member.user.username,
      discordDiscriminator: member.user.discriminator,
      discordAvatar: member.user.avatar,
      signDiscord: true,
    });
    await newUser.save();
    token = await jwt.sign({ id: String(newUser.id) }, accessTokenSecret);

    //save jwt
    newUser["jwt"] = token;
    await newUser.save();
  }
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setLabel("Connect Wallet")
      .setStyle("LINK")
      .setURL(`http://localhost:3000/profile/${token}`)
  );
  const message = `Welcome <@${member.id}> to our server`;
  const discordMsgEmbed = new MessageEmbed()
    .setColor("#F07D55")
    .setDescription(message);
  const payload = {
    // content: message,
    embeds: [discordMsgEmbed],
    components: [row],
  };
  sendMessage(nconf.get("CHANNEL_WALLET_CONNECT"), payload);
});

// export const walletVerify = async (req: any, res: any) => {
//     try {
//         const userReq = req.user
//         const userData = await User.findOne({ userID: userReq.userID })
//         if (userData) {
//             const result = ethers.utils.verifyMessage(userData.jwt || '', req.body.hash)
//             if (result === req.body.address) {
//                 userData['walletAddress'] = req.body.address
//                 userData['discordVerify'] = true
//                 await userData.save()
//                 const discordMsgEmbed = new MessageEmbed()
//                     .setColor("#F07D55")
//                     .setDescription('Congratulation your wallet has been connected')
//                 const payload = {
//                     embeds: [discordMsgEmbed]
//                 }
//                 sendMessage(nconf.get("CHANNEL_WALLET_CONNECT"), payload)
//                 res.send({ success: true, user: userData })
//             }
//             else {
//                 res.send({ success: false })
//             }
//         }
//         else {
//             res.send({ success: false })
//         }
//     } catch (error) {
//         console.log(error);
//     }
// }

// export const fetchNFT = async () => {
//     const allUsers = await User.find()
//     if (allUsers.length > 0) {
//         await allUsers.map(async (user) => {
//             if (user.walletAddress !== '') {
//                 const noOfNFTs = await mahaXContract.methods.balanceOf(user.walletAddress).call()
//                 let nftPoints = 0
//                 if (noOfNFTs > 0) {
//                     for (let i = 0; i < noOfNFTs; i++) {
//                         const nftId = await mahaXContract.methods.tokenOfOwnerByIndex(user.walletAddress, i).call()
//                         const nftAmount = await mahaXContract.methods.locked(nftId).call()
//                         if ((nftAmount.amount / 1e18) >= 100) {
//                             nftPoints += 1
//                         }
//                     }
//                 }
//                 await User.updateOne({ walletAddress: user.walletAddress }, { $inc: { nftPoints: nftPoints, totalPoints: nftPoints } })
//             }
//         })
//     }
// }

// fetchNFT()
