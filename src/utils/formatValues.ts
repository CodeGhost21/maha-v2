import { BigNumber, ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import Numeral from "numeral";

export const toDisplayNumber = (value: number) => {
  const bn = BigNumber.from(value.toString());
  const valToNum = ethers.utils.formatEther(bn);
  const numeralVal = Numeral(valToNum).format("0.000");
  if (numeralVal == "0.000") return valToNum;
  return numeralVal;
};

export function getBalance(balance: BigNumber | string, decimals = 18): string {
  try {
    return formatUnits(balance, decimals);
  } catch (err) {
    return "0";
  }
}

export const getDisplayBalance = (
  balance: BigNumber | string,
  decimals = 18,
  fractionDigits = 5
): string => {
  try {
    const formattedBalance: string = getBalance(balance, decimals);
    const decimalsPointIndex = formattedBalance.indexOf(".");
    if (decimalsPointIndex === -1) {
      return formattedBalance;
    }
    return (
      formattedBalance.slice(0, decimalsPointIndex) +
      "." +
      formattedBalance.slice(
        decimalsPointIndex + 1,
        decimalsPointIndex + 1 + fractionDigits
      )
    );
  } catch (error) {
    return "0";
  }
};
