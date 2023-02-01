import nconf from "nconf";
import * as ethers from 'ethers'
import * as jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { MessageEmbed } from "discord.js";
const Contract = require('web3-eth-contract');

import { sendMessage } from "../output/discord";
import { User } from "../database/models/user";
import MAHAX from "../abi/MahaXAbi.json"
import leaderBoardData from '../assets/leaderBoard.json'

const secret = nconf.get("JWT_SECRET")

Contract.setProvider(nconf.get("ETH_RPC"));
const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"))

//get user data
export const fetchUser = async (req: Request, res: Response) => {
    try {
        const tokenData: any = await jwt.verify(req.params.jwt, secret)
        const user = await User.findOne({ userID: tokenData.userID })
        if (user) {
            res.send(user)
        }
        else {
            res.send('not a valid user')
        }
    }
    catch (e) {
        console.log(e);
    }
}

//users leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
    res.send(leaderBoardData)
}

//connect wallet verify
export const walletVerify = async (req: any, res: any) => {
    try {
        const userReq = req.user
        const userData = await User.findOne({ userID: userReq.userID })
        if (userData) {
            const result = ethers.utils.verifyMessage(userData.jwt || '', req.body.hash)
            if (result === req.body.address) {
                userData['walletAddress'] = req.body.address
                userData['discordVerify'] = true
                await userData.save()
                const discordMsgEmbed = new MessageEmbed()
                    .setColor("#F07D55")
                    .setDescription('Congratulation your wallet has been connected')
                const payload = {
                    embeds: [discordMsgEmbed]
                }
                sendMessage(nconf.get("CHANNEL_WALLET_CONNECT"), payload)
                res.send({ success: true, user: userData })
            }
            else {
                res.send({ success: false })
            }
        }
        else {
            res.send({ success: false })
        }
    } catch (error) {
        console.log(error);
    }
}

//fetch nft of all users peroidically
export const fetchNFT = async () => {
    const allUsers = await User.find()
    if (allUsers.length > 0) {
        await allUsers.map(async (user) => {
            if (user.walletAddress !== '') {
                const noOfNFTs = await mahaXContract.methods.balanceOf(user.walletAddress).call()
                let nftPoints = 0
                if (noOfNFTs > 0) {
                    for (let i = 0; i < noOfNFTs; i++) {
                        const nftId = await mahaXContract.methods.tokenOfOwnerByIndex(user.walletAddress, i).call()
                        const nftAmount = await mahaXContract.methods.locked(nftId).call()
                        if ((nftAmount.amount / 1e18) >= 100) {
                            nftPoints += 1
                        }
                    }
                }
                await User.updateOne({ walletAddress: user.walletAddress }, { $inc: { nftPoints: nftPoints, totalPoints: nftPoints } })
            }
        })
    }
}

// fetchNFT()