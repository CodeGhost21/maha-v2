import axios from "axios";

export const getHoldStationData = async () => {
  const response = await axios.get(
    "https://dashboard.holdstation.com/api/public/dashboard/f759eb55-f119-4c20-80f0-96c252e1f7c3/dashcard/629/card/509?parameters=%5B%5D"
  );
  return response.data.data.rows;
};

export const getUserHoldStationData = async (walletAddress: string) => {
  const holdStationData = await getHoldStationData();
  let foundData = null;

  for (const data of holdStationData) {
    if (data[1] === walletAddress) {
      foundData = data;
      break;
    }
  }
  const stakedAmount = foundData ? foundData[2] : 0;
  console.log(stakedAmount);
  return stakedAmount;
};
// getUserHoldStationData("0xa2aa64673eb82d52cbbc5e528b89434eb487c1ca");
