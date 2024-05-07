import { Request, Response } from "express";
import { ethers } from "ethers";
import axios from "axios";

interface AddressData {
  address: string;
  totalAmount: string;
  proofs: string[];
}

let addressData: AddressData[];

const getDataForAddress = (walletAddress: string) => {
  return addressData.find(
    (e) => e.address.toLowerCase() === walletAddress.toLowerCase()
  );
};

export const getProofs = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.walletAddress as string;
  if (walletAddress && ethers.isAddress(walletAddress)) {
    if (addressData) {
      const data = getDataForAddress(walletAddress);
      if (data) {
        res.json(data);
      } else {
        res.json(`data for address ${walletAddress} not found`);
      }
    } else {
      try {
        const response = await axios.get(
          "https://raw.githubusercontent.com/deadshotryker/merkle/master/v1.json"
        );
        addressData = response.data.addressData;
        const data = getDataForAddress(walletAddress);
        if (data) {
          res.json(data);
        } else {
          res.json(`data for address ${walletAddress} not found`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        //   throw error;
      }
    }
  }
};
