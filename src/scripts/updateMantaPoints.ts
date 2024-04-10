import _ from "underscore";

import { IAssignPointsTask } from "../controller/quests/assignPoints";
import { updateMantaStakersData,updateMantaStakersAccumulate,updateMantaStakersBifrost} from "../controller/quests/stakeManta";
import { WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { updatePoints } from "./updatePoints";

import { stakePtsPerManta } from "../controller/quests/constants";


export const updateMantaPoints= async()=>{
  const batchSize = 1000;
  let skip = 395000;
  let batch;
  do {
    batch = await WalletUser.find({ walletAddress: { $exists: true, $ne: null ,$not: { $eq: "" } } }).skip(skip).limit(batchSize); // Use lean() to get plain JavaScript objects instead of Mongoose documents
    // console.log("batch", batch);
    const tasks: IAssignPointsTask[] = [];
    const addresses: string[] = batch
    .map((u) => u.walletAddress) 
    
    const mantaUsersData= await updateMantaStakersData(addresses)
    const mantaUsersDataBifrost=await updateMantaStakersBifrost(addresses)
    const mantaUsersDataAccumulate=await updateMantaStakersAccumulate(addresses)
  
    for (const user of batch) {
      //manta
      const filteredMantaData = mantaUsersData.allMantaData.filter((item :any)=> item.pacificAddress.toLowerCase().trim() === user.walletAddress.toLowerCase().trim());
      const mantaAmount = filteredMantaData.reduce((accumulator:any, currentValue:any) => accumulator + currentValue.stakingAmount, 0);
      
      //accumulate manta 
      const mantaBifrostAmount= mantaUsersDataBifrost.filter(item => item.address.toLowerCase().trim() === user.walletAddress.toLowerCase().trim())[0]?.balance || 0;
      
      //bifrost manta
      const mantaAccumulateAmount=mantaUsersDataAccumulate.filter(item => item.address.toLowerCase().trim() === user.walletAddress.toLowerCase().trim())[0]?.balance || 0;
      
      //total Manta points
      const totalMantaAmount=(mantaAmount+mantaBifrostAmount+mantaAccumulateAmount)*stakePtsPerManta
      
      if(totalMantaAmount>0){
        // console.log(user.walletAddress,totalMantaAmount);
        
        const latestPoints = totalMantaAmount;
        const oldMantaPoints = Number(user.points.MantaStaker) || 0;
        let previousPoints = oldMantaPoints;
        let previousReferralPoints = 0;
        let stakedAmountDiff = latestPoints - oldMantaPoints;
        
        if (user.referredBy) {
          previousPoints = oldMantaPoints / 1.2;
          previousReferralPoints = oldMantaPoints - previousPoints;
          stakedAmountDiff = (latestPoints * 1e18 - previousPoints * 1e18)/1e18;
        }
        else
        //  stakedAmountDiff = latestPoints - oldMantaPoints;
        
        // console.log('previousPoints',previousReferralPoints);
        
        if (stakedAmountDiff !== 0) {
          const pointsAction = stakedAmountDiff > 0 ? "added" : "subtracted";
          const pointsMessage = `${pointsAction} ${Math.abs(
            stakedAmountDiff
          )} MantaStakers points from user ${user.walletAddress}`;
          //assign points logic
          const t = await updatePoints(
            user._id,
            previousPoints,
            latestPoints,
            previousReferralPoints,
            pointsMessage,
            pointsAction === "added" ? true : false,
            "MantaStaker"
          );
          if (t) tasks.push(t);
        } else {
          console.log("no difference");
        }
      }
    }
    await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
    await UserPointTransactions.bulkWrite(
      _.flatten(tasks.map((r) => r.pointsBulkWrites))
    );
    skip += batchSize;
  } while (batch.length === batchSize);
}