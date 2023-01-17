
import { twitterMetions } from './output/twitter';
import mahaLocks from "./bots/mahaLocks";
import "./bots/gm";

import { open } from "./database";
open();


twitterMetions()
// mahaxNFT();
// arth();
// mahalend()
mahaLocks();

