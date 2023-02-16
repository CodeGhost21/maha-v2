import { Router } from "express";
import passport from "passport";
import nconf from "nconf";

const router = Router();

router.get(
  "/login",
  passport.authenticate("discord", {
    successRedirect: nconf.get("DISCORD_CALLBACK_URL"),
  }),
  (req, res) => {
    res.send(200);
  }
);

router.get("/redirect", passport.authenticate("discord"), (req: any, res) => {
  res.redirect(`${nconf.get("REDIRECT_URL")}/${req.user.userID}`);
});

export default router;
