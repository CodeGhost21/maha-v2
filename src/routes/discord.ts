import { Router } from 'express'
const passport = require('passport')

const router = Router()

router.get('/login',
    passport.authenticate('discord',
        {
            successRedirect: "https://0631-14-143-239-186.ngrok.io/discord/redirect"
        }), (req, res) => {
            console.log(1234, req);
            res.send(200)
        }
)

router.get('/redirect', passport.authenticate('discord'), (req: any, res) => {
    console.log(req.user);
    res.redirect(`http://localhost:3000/profile/${req.user.jwt}`)
})

export default router
