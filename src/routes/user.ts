import { Router } from 'express'
import { authenticateJWT } from '../middleware/authenticateJWT'
import ensureLoggedIn from '../middleware/ensureLoggedIn'
import { walletVerify, getLeaderboard, fetchUser } from '../controller/user'


const router = Router()
router.get('/:jwt', async (req: any, res) => fetchUser(req, res))
router.get('/leaderBoard', (req, res) => getLeaderboard(req, res))

router.use(authenticateJWT)
router.use(ensureLoggedIn)
router.post('/verifyWallet', (req, res) => { walletVerify(req, res) })

export default router