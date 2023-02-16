import { Router } from 'express'
import { authenticateJWT } from '../middleware/authenticateJWT'
import ensureLoggedIn from '../middleware/ensureLoggedIn'
import { walletVerify } from '../bots/collabLand'

const router = Router()
router.get("/", (req, res) => {
    res.send("API Running successfully");
    // next(new Error("hello world"))
});
router.use(authenticateJWT)
router.use(ensureLoggedIn)
router.post('/verifyWallet', (req, res) => { walletVerify(req, res) })

export default router