import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { AnyBulkWriteOperation } from "mongodb";
import { referralPercent } from "../controller/quests/constants";
import { IWalletUser } from "../database/interface/walletUser/walletUser";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { IAsset, IStakeAsset } from "../database/interface/walletUser/assets";
import { IUserPointTransactions } from "../database/interface/userPoints/userPointsTransactions";
import { UserPointTransactions } from "../database/models/userPointTransactions";

export const updateLPPointsHourly = async () => {
  console.log("updateLPPointsHourly");

  const batchSize = 1000;
  const t1 = Date.now();

  let skip = 0;
  let batch: IWalletUserModel[] = [];

  console.log("----- user skip ----", skip);
  console.log("----- start time for user skip ----", t1);

  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrite: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  do {
    try {
      batch = await WalletUser.find({ pointsPerSecond: { $exists: true } })
        .skip(skip)
        .limit(batchSize)
        .select(
          "pointsPerSecond pointsUpdateTimestamp referredBy totalPoints id boostStake"
        );
    } catch (error) {
      throw new Error(`error while fetching wallet users, ${error}`);
    }
    console.log(
      "calculating points for",
      batch.length,
      "users,",
      "total =",
      skip + batch.length
    );
    await Promise.all(
      batch.map(async (user) => {
        let referredByUser = {} as IWalletUserModel;
        if (user.referredBy) {
          try {
            referredByUser = await WalletUser.findOne({
              _id: user.referredBy,
            }).select("id totalPoints");
          } catch (error) {
            throw new Error(`error while fetching referred by users, ${error}`);
          }
        }
        const pointsKeys = Object.keys(user.pointsPerSecond) as Array<
          keyof IWalletUserPoints
        >;
        // each LP task
        pointsKeys.forEach((task) => {
          if (task.startsWith("erc20")) {
            const assetPointsPerSecond = user.pointsPerSecond[task] as IAsset;
            const assetPointsPerSecondKeys = Object.keys(
              assetPointsPerSecond
            ) as Array<keyof IAsset>;

            if (assetPointsPerSecondKeys.length) {
              const _points: Partial<IWalletUserPoints> = {
                [task]: {} as IAsset,
              };
              const _pointsUpdateTimestamp: { [key: string]: number } = {};
              let _totalPoints = 0;
              let referralPoints = 0;

              // let _totalSupplyPoints = 0;
              // let _totalBorrowPoints = 0;

              // each asset
              assetPointsPerSecondKeys.forEach((asset) => {
                const pointsUpdateTimestamp =
                  (user.pointsUpdateTimestamp?.[task] as IAsset) ?? {};
                // asset level calculations

                const pointsPerSecond =
                  Number(assetPointsPerSecond[asset]) || 0;
                if (pointsPerSecond) {
                  const timestamp = Number(pointsUpdateTimestamp?.[asset] ?? 0);
                  const timeElapsed =
                    timestamp <= 0 ? 0 : (Date.now() - timestamp) / 1000;
                  const newPoints = Number(pointsPerSecond * timeElapsed);
                  let refPointForAsset = 0;
                  if (newPoints > 0) {
                    if (referredByUser && Object.keys(referredByUser).length) {
                      refPointForAsset =
                        timestamp > 0 ? Number(newPoints * referralPercent) : 0;
                      referralPoints += refPointForAsset;
                    }

                    const pointsToAdd =
                      timestamp > 0
                        ? newPoints * (user.boostStake ?? 1) + refPointForAsset
                        : 0;
                    (_points[task] as IAsset)[asset] = pointsToAdd;
                    _totalPoints += pointsToAdd;
                  }
                  _pointsUpdateTimestamp[`${asset}`] = Date.now();
                }
              });
              if (
                referredByUser &&
                Object.keys(referredByUser).length &&
                referralPoints
              ) {
                userBulkWrites.push({
                  updateOne: {
                    filter: { _id: referredByUser.id },
                    update: {
                      $inc: {
                        ["points.referral"]: referralPoints,
                        totalPoints: referralPoints,
                      },
                      $set: {
                        ["pointsUpdateTimestamp.referral"]: Date.now(),
                      },
                    },
                  },
                });

                pointsBulkWrite.push({
                  insertOne: {
                    document: {
                      userId: referredByUser.id,
                      previousPoints: referredByUser.totalPoints,
                      currentPoints:
                        referredByUser.totalPoints + referralPoints,
                      subPoints: 0,
                      addPoints: referralPoints,
                      message: "Referral Points",
                    },
                  },
                });
              }

              userBulkWrites.push({
                updateOne: {
                  filter: { _id: user.id },
                  update: {
                    $inc: {
                      ...Object.keys(_points[task] as IAsset).reduce(
                        (acc, key) => {
                          acc[`points.${task}.${key}`] =
                            (_points[task] as IAsset)[key as keyof IAsset] || 0;
                          return acc;
                        },
                        {} as Record<string, number>
                      ),
                      totalPoints: _totalPoints,
                    },
                    $set: {
                      [`pointsUpdateTimestamp.${task}`]: _pointsUpdateTimestamp,
                    },
                  },
                },
              });

              pointsBulkWrite.push({
                insertOne: {
                  document: {
                    userId: user.id,
                    previousPoints: user.totalPoints,
                    currentPoints: user.totalPoints + _totalPoints,
                    subPoints: 0,
                    addPoints: _totalPoints,
                    message: `${task} points`,
                  },
                },
              });
            }
          }
        });
      })
    );

    try {
      if (userBulkWrites.length > 0) {
        await WalletUser.bulkWrite(userBulkWrites);
      }
      if (pointsBulkWrite.length > 0) {
        await UserPointTransactions.bulkWrite(pointsBulkWrite);
      }
    } catch (error) {
      throw new Error(`error while bulk write operations, ${error}`);
    }
    userBulkWrites.length = 0;
    pointsBulkWrite.length = 0;
    skip += batchSize;
  } while (batch.length === batchSize);

  console.log("----- user skip ----", skip);
  console.log("----- End time for user skip ----", Date.now());
  console.log("----- final time to complete-----", Date.now() - t1);
};
