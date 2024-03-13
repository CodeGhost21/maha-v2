import axios from "axios";
import { ethers } from "ethers";
import nconf from "nconf";

const baseUrl = "https://waitlist-api.prod.blast.io";

type RequestChallenge = {
  contractAddress: string; // contract with points to be distributed
  operatorAddress: string; // the EOA configured with IBlastPoints
};
type ResponseChallenge = {
  success: boolean;
  challengeData: string;
  message: string;
};

type RequestOAuth = {
  challengeData: string; // from challenge response
  signature: string; // ERC-191 signature of `message` from the challenge
};

type ResponseOAuth = {
  success: boolean;
  bearerToken: string; // will last 1 hour
};

const getBlastChallenge = async (contractAddress: string) => {
  const url = "v1/dapp-auth/challenge";
  const operatorAddress = nconf.get("OPERATOR_ADDRESS");
  const requestBody: RequestChallenge = {
    contractAddress: contractAddress,
    operatorAddress: operatorAddress,
  };
  const response = await axios.post(`${baseUrl}/${url}`, requestBody);
  return response.data as ResponseChallenge;
};

const getBearerToken = async (challengeData: any) => {
  const privateKey = nconf.get("OPERATOR_PRIVATE_KEY");

  // Create a wallet instance from the private key
  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(challengeData.message);
  const url = "v1/dapp-auth/solve";
  const requestBody: RequestOAuth = {
    challengeData: challengeData.challengeData,
    signature: signature,
  };
  const response = await axios.post(`${baseUrl}/${url}`, requestBody);
  return response.data.bearerToken as string;
};

const getPoints = async (token: string, contractAddress: string) => {
  const url = `v1/contracts/${contractAddress}/point-balances`;

  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const response = await axios.get(`${baseUrl}/${url}`, { headers });
  return response.data;
};

export const BlastPoints = async () => {
  //USDB
  const contractAddressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
  const challengeUSDB = await getBlastChallenge(contractAddressUSDB);
  const tokenUSDB = await getBearerToken(challengeUSDB);
  const pointsUSDB = await getPoints(tokenUSDB, contractAddressUSDB);
  // console.log(pointsUSDB);

  //WETH
  const contractAddressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";
  const challengeWETH = await getBlastChallenge(contractAddressWETH);
  const tokenWETH = await getBearerToken(challengeWETH);
  const pointsWETH = await getPoints(tokenWETH, contractAddressWETH);
  // console.log(pointsWETH);

  const totalPoints =
    Number(pointsUSDB.balancesByPointType.LIQUIDITY.available) +
    Number(pointsWETH.balancesByPointType.LIQUIDITY.available);
  return totalPoints;
};
