import { Router } from "express";
import passport from "passport";
import nconf from "nconf";
import urlJoin from "../utils/urlJoin";

const router = Router();

const successRedirect = urlJoin(nconf.get("DOMAIN"), "/discord/redirect");

router.get(
  "/login",
  passport.authenticate("discord", {
    successRedirect,
  })
);

router.get("/redirect", passport.authenticate("discord"), (req, res) => {
  const frontendUrl = urlJoin(nconf.get("FRONTEND_URL"), `#/profile`);
  res.redirect(frontendUrl);
});

export default router;
