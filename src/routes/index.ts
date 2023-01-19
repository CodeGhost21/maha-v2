import { Router, Request, Response } from 'express'
import { authenticateJWT } from '../middleware/authenticateJWT'
import ensureLoggedIn from '../middleware/ensureLoggedIn'


const router = Router()
router.get("/", (req: Request, res: Response) => {
    res.send("API Running successfully");
    // next(new Error("hello world"))
});
router.use(authenticateJWT)
router.use(ensureLoggedIn)

export default router