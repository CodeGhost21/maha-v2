import { Router } from "express";
const passport = require("passport");

const router = Router();

router.get(
  "/login",
  passport.authenticate("discord", {
    successRedirect: "https://d924-14-142-22-194.in.ngrok.io/discord/redirect",
  }),
  (req, res) => {
    res.send(200);
  }
);

router.get("/redirect", passport.authenticate("discord"), (req: any, res) => {
  res.redirect(`http://localhost:3000/profile/${req.user.jwt}`);
});

export default router;
