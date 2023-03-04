import { Router } from "express";
import passport from "passport";
import nconf from "nconf";
import urlJoin from "../utils/urlJoin";

const router = Router();

const successRedirect = urlJoin(nconf.get("DOMAIN"), "/discord/login");

router.get(
  "/login",
  passport.authenticate("discord", {
    successRedirect,
  }),
  (req, res) => {
    res.send(200);
  }
);

router.get("/redirect", passport.authenticate("discord"), (req: any, res) => {
  const frontendUrl = urlJoin(nconf.get("FRONTEND_URL"), `${req.user.userID}`);
  res.redirect(frontendUrl);
});

export default router;
