import { NextFunction, Request, Response, Router } from "express";
import discord from "./discord";
import user from "./user";
import twitter from "./twitter";
import HttpError from "../errors/HttpError";
import {
  getUsersData,
  getLeaderBoard,
  getOpensBlockData,
  linkNewReferral,
  getLeaderBoardWithSortKeys,
} from "../controller/user";

export const router = Router();

router.get("/", (_req, res) => {
  res.json({
    uptime: process.uptime(),
    online: true,
    message: "fuck off",
  });
});
router.get("/globalData", getUsersData);
router.patch("/linkReferral", linkNewReferral);
router.get("/leaderBoard", getLeaderBoard);
router.get("/leaderBoardWithSortKeys", getLeaderBoardWithSortKeys);
router.use("/discord", discord);
router.use("/twitter", twitter);
router.use("/user", user);
router.get("/referral/openBlock", getOpensBlockData);

router.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500);
    res.json({
      success: false,
      status: err.status || 500,
      message: err.message || "error",
    });
  }
);

export default router;
