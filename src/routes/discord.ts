import { Router } from "express";
import nconf from "nconf";
import passport from "passport";

import urlJoin from "../utils/url-join";
// import ensureLoggedIn from "../middleware/ensureLoggedIn";
// import deserializeUser from "../middleware/deserializeUser";

const router = Router();

// router.use(deserializeUser);
// router.use(ensureLoggedIn);

router.get(
  "/login",
  passport.authenticate("discord", {
    successRedirect: urlJoin(nconf.get("HOST_URL"), `/discord/callback`),
  }),
  (_req, res) => {
    console.log(_req);

    res.send(200);
  }
);

router.get("/callback", passport.authenticate("discord"), (req: any, res) => {
  console.log(req);

  res.redirect(urlJoin(nconf.get("FRONTEND_URL"), `/#/auth/redirect/callback`));
});

export default router;
