import { Request, Response } from 'express'
import marketplaceData from '../assets/marketPlace.json'

export const getMarketPlaceData = async (req: Request, res: Response) => {
    res.send(marketplaceData)
}