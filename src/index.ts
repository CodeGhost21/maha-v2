// import borrowingOperations from './bots/arthloans/borrowingOperations';
// import strategies from './src/bots/arthloans/strategies'
// import farming from './src/bots/arthloans/farming'
// import mahax from './src/bots/gov/mahax'
// import quickswap from './src/bots/quickswap'
// // import curvePolygon from './src/events/exchange/curvePolygon'
// import troveManager from './src/bots/arthloans/troveManage'
import { twitterMetions } from './output/twitter';
// import fantomNotify from './src/bots/fantomNotify';
import { open } from "./database";
open();

// import mahalend from './bots/mahalend'
// import mahaxNFT from "./bots/mahaxNFT";
// import arth from "./bots/arth";
import "./bots/gm";

twitterMetions()
// mahaxNFT();
// arth();
// mahalend()