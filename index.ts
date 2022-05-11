import nconf from "nconf";

nconf.argv()
   .env()
   .file({ file: './config.json' });
// import borrowingOperations from './src/bots/arthloans/borrowingOperations';
// import strategies from './src/bots/arthloans/strategies'
// import farming from './src/bots/arthloans/farming'
// import mahax from './src/bots/gov/mahax'
// import quickswap from './src/bots/quickswap'
// // import curvePolygon from './src/events/exchange/curvePolygon'
// import troveManager from './src/bots/arthloans/troveManage'
import { twitterMetions } from './src/bots/twitterMention';
// import fantomNotify from './src/bots/fantomNotify';

// At a time 13 connections can be open

const mode = 'production'
// const mode = 'staging'

// borrowingOperations(mode) // 11 instances // opne, close, modify the loan
// strategies(mode) // 2 instances //open and close positions

// farming(mode) // 10 instances // Deposit/Stake, withdraw,claim
// mahax(mode) // 1 instance // Lock, withdraw maha, extend locking period
// quickswap(mode) // 1 instance // polygon.curve 3pool, buy-sell on same site

// // the event in the solidity is not emitted for curvePolygon
// // curvePolygon(mode) // 1 instance // trade

// troveManager(mode) // 8 instances // For Redeem and Liquidate
twitterMetions(mode)
// fantomNotify(mode)

