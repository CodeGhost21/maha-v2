import { WalletUser } from "../database/models/walletUsers";

export const duplicateUsers = async () => {
  const bulkOperations: any = [];

  const result = await WalletUser.aggregate(
    [
      {
        $match: {
          isDeleted: false, // Only consider documents where isDeleted is false
        },
      },
      {
        $group: {
          _id: {
            walletAddress: "$walletAddress",
            totalPointsv2: "$totalPointsv2", // Include totalPointsv2 in grouping
          },
          count: { $sum: 1 },
          latestCreatedAt: { $max: "$createdAt" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $project: {
          walletAddress: "$_id",
          count: 1,
          _id: 0,
          latestCreatedAt: 1,
        },
      },
    ],
    { allowDiskUse: true }
  );
  console.log(result);
  // result.map((user) => {
  //   bulkOperations.push({
  //     updateOne: {
  //       filter: {
  //         walletAddress: user.walletAddress,
  //         createdAt: user.latestCreatedAt,
  //       },
  //       update: {
  //         $set: {
  //           isDeleted: true,
  //         },
  //       },
  //     },
  //   });
  // });
  // console.log(bulkOperations[0]);
  // console.log(bulkOperations[0].updateOne.update);

  // if (bulkOperations.length > 0) {
  //   WalletUser.bulkWrite(bulkOperations);
  // }
};

export const setIsDelete = async () => {
  const bulkOperations: any = [];
  const nonDeletedUsers = await WalletUser.find({
    $and: [{ isDeleted: { $exists: false } }, { isDeleted: null }],
  });
  console.log(nonDeletedUsers.length);

  nonDeletedUsers.map((user: any) => {
    bulkOperations.push({
      updateOne: {
        filter: { walletAddress: user.walletAddress },
        update: {
          $set: {
            isDeleted: false,
          },
        },
      },
    });
  });

  // if (bulkOperations.length > 0) {
  //   WalletUser.bulkWrite(bulkOperations);
  // }
};
