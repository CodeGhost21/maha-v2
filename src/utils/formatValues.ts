import { BigNumber, ethers } from "ethers";
import Numeral from 'numeral'

export const toDisplayNumber = (value: number) => {
  const bn = BigNumber.from(value.toString());
  const valToNum = ethers.utils.formatEther(bn)
  const numeralVal = Numeral(valToNum).format("0.000")
  if(numeralVal == '0.000') return valToNum
  return numeralVal

};
