import { AnyBulkWriteOperation } from "mongodb";
import _ from "underscore";

import {
  IWalletUser,
  IWalletUserPoints,
  WalletUser,
} from "../database/models/walletUsers";
import {
  IUserPointTransactions,
  UserPointTransactions,
} from "../database/models/userPointTransactions";
import { referralPercent } from "../controller/quests/constants";
import {
  IAssignPointsTask,
  assignPoints,
} from "../controller/quests/assignPoints";

export const updatePoints = async (
  userId: string,
  previousPoints: number,
  latestPoints: number,
  previousReferralPoints: number,
  message: string,
  isAdd: boolean,
  taskId: keyof IWalletUserPoints,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  const user = await WalletUser.findById(userId);
  if (!user) return;
  const userTotalPoints = Number(user.totalPointsV2) || 0;
  let newMessage = message;
  let points = latestPoints;
  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({
      _id: user.referredBy,
      isDeleted: false,
    });
    if (referredByUser) {
      const newReferralPoints = Number(latestPoints * referralPercent) || 0;
      points = points + newReferralPoints;
      newMessage = message + " plus referral points";
      const refPoints = (referredByUser.points || {}).referral || 0;
      pointsBulkWrites.push({
        insertOne: {
          document: {
            userId: referredByUser.id,
            previousPoints: refPoints,
            currentPoints:
              refPoints + (newReferralPoints - previousReferralPoints),
            addPoints: isAdd
              ? 0
              : Math.abs(newReferralPoints - previousReferralPoints),
            subPoints: !isAdd
              ? 0
              : Math.abs(newReferralPoints - previousReferralPoints),
            message: `${isAdd ? "add" : "subtract"} referral points`,
          },
        },
      });

      userBulkWrites.push({
        updateOne: {
          filter: { _id: referredByUser.id },
          update: {
            $inc: {
              ["points.referral"]: newReferralPoints - previousReferralPoints,
              totalPointsV2: newReferralPoints - previousReferralPoints,
            },
          },
        },
      });
    }
  }

  pointsBulkWrites.push({
    insertOne: {
      document: {
        userId: user.id,
        previousPoints: userTotalPoints,
        currentPoints:
          userTotalPoints + points - previousPoints - previousReferralPoints,
        subPoints: isAdd
          ? 0
          : Math.abs(points - previousPoints - previousReferralPoints),
        addPoints: !isAdd
          ? 0
          : Math.abs(points - previousPoints - previousReferralPoints),
        message: newMessage,
      },
    },
  });

  userBulkWrites.push({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $inc: {
          [`points.${taskId}`]:
            points - previousPoints - previousReferralPoints,
          totalPointsV2: points - previousPoints - previousReferralPoints,
        },
        $set: {
          epoch: epoch || user.epoch,
          [`checked.${taskId}`]: true,
          [`pointsUpdateTimestamp.${taskId}`]: Date.now(),
        },
      },
    },
  });

  return {
    userBulkWrites,
    pointsBulkWrites,
    execute: async () => {
      await WalletUser.bulkWrite(userBulkWrites);
      await UserPointTransactions.bulkWrite(pointsBulkWrites);
    },
  };
};

const lpPoints = [
  {
    address: "0x4508BA79566E41d5241831E3385D424803355900",
    chain: "Zksync",
    supply: 60721,
    borrow: 158000,
  },
  {
    address: "0xb3A71e19fD0f60A8ca8E54f0F76Cb4540d3d84E9",
    chain: "Zksync",
    supply: 134014,
    borrow: 423219,
  },
  {
    address: "0x20B985b22Ee8C34E8cd52aD0F3B58b88Fb975c60",
    chain: "Linea",
    supply: 14837,
    borrow: 13928,
  },
  {
    address: "0x20B985b22Ee8C34E8cd52aD0F3B58b88Fb975c60",
    chain: "Manta",
    supply: 6090,
    borrow: 0,
  },
  {
    address: "0x20B985b22Ee8C34E8cd52aD0F3B58b88Fb975c60",
    chain: "Blast",
    supply: 6263,
    borrow: 11640,
  },
  {
    address: "0x301B6444Fc9599cEc0872B76f8187D5AA643640d",
    chain: "Linea",
    supply: 9776,
    borrow: 0,
  },
  {
    address: "0x516e726f53576ee00db9b96291cdd0f7eb5f8cc7",
    chain: "EthereumLrt",
    supply: 128696,
    borrow: 201440,
  },
  {
    address: "0xbF3FdED28953a8726cc57913FcA34FBD0a7AdA15",
    chain: "Zksync",
    supply: 124644,
    borrow: 77164,
  },
  {
    address: "0x781256B663bB3557540c5CaEEcddA5153D7ED8FC",
    chain: "Linea",
    supply: 66374,
    borrow: 82416,
  },

  {
    address: "0x02D268804d99aACcc74a9Eb82A58C8C24f0f49Ff",
    chain: "Linea",
    supply: 984,
    borrow: 504,
  },
  {
    address: "0x02D268804d99aACcc74a9Eb82A58C8C24f0f49Ff",
    chain: "Zksync",
    supply: 88475,
    borrow: 112140,
  },

  {
    address: "0x35e8b11f43c74631c4ff26da5b9a6a09956d02cf",
    chain: "Blast",
    supply: 25863,
    borrow: 43720,
  },
  {
    address: "0x35e8b11f43c74631c4ff26da5b9a6a09956d02cf",
    chain: "Linea",
    supply: 74436,
    borrow: 49840,
  },
  {
    address: "0x35e8b11f43c74631c4ff26da5b9a6a09956d02cf",
    chain: "Zksync",
    supply: 21071,
    borrow: 25184,
  },
  {
    address: "0x146f2Aaa6e6B36Cdf8FAF037d2C50a00b38Be34d",
    chain: "Blast",
    supply: 17471,
    borrow: 33516,
  },
  {
    address: "0x146f2Aaa6e6B36Cdf8FAF037d2C50a00b38Be34d",
    chain: "Linea",
    supply: 38124,
    borrow: 34040,
  },
  {
    address: "0x146f2Aaa6e6B36Cdf8FAF037d2C50a00b38Be34d",
    chain: "Zksync",
    supply: 11718,
    borrow: 19824,
  },
  {
    address: "0x146f2Aaa6e6B36Cdf8FAF037d2C50a00b38Be34d",
    chain: "Blast",
    supply: 27146,
    borrow: 1224,
  },
  {
    address: "0x5bf50cbb8389cf11a6a54cdfcc08ed1bb5565696",
    chain: "Manta",
    supply: 27146,
    borrow: 1224,
  },
  {
    address: "0x30eD3C3DF92f2F3c6A7ae9094A614a5E487aA14f",
    chain: "Blast",
    supply: 26598,
    borrow: 25200,
  },
  {
    address: "0x30eD3C3DF92f2F3c6A7ae9094A614a5E487aA14f",
    chain: "Linea",
    supply: 28680,
    borrow: 1600,
  },
  {
    address: "0xB8D984d27F4Dc7Bfd15d2323378AcaDbcB8e2be0",
    chain: "Blast",
    supply: 7348,
    borrow: 21120,
  },
  {
    address: "0xB8D984d27F4Dc7Bfd15d2323378AcaDbcB8e2be0",
    chain: "Linea",
    supply: 15760,
    borrow: 20960,
  },
  {
    address: "0xB8D984d27F4Dc7Bfd15d2323378AcaDbcB8e2be0",
    chain: "Zksync",
    supply: 18920,
    borrow: 28640,
  },
  {
    address: "0xdE438a305fA86fCBAc945367FC4402406542172F",
    chain: "EthereumLrt",
    supply: 100800,
    borrow: 0,
  },
  {
    address: "0xdE438a305fA86fCBAc945367FC4402406542172F",
    chain: "Blast",
    supply: 1011909,
    borrow: 871084,
  },
  {
    address: "0xdE438a305fA86fCBAc945367FC4402406542172F",
    chain: "Manta",
    supply: 84976,
    borrow: 216548,
  },
  {
    address: "0xdE438a305fA86fCBAc945367FC4402406542172F",
    chain: "Linea",
    supply: 196308,
    borrow: 194720,
  },
  {
    address: "0xac6ef7a70033ac1f2bb6e978a039c762046539c5",
    chain: "Blast",
    supply: 415414,
    borrow: 798216,
  },
  {
    address: "0xac6ef7a70033ac1f2bb6e978a039c762046539c5",
    chain: "Linea",
    supply: 4804,
    borrow: 10768,
  },

  {
    address: "0xf08a4CeD20984dCac122De4535161eBF390625ba",
    chain: "Linea",
    supply: 17311,
    borrow: 25644,
  },
  {
    address: "0xf08a4CeD20984dCac122De4535161eBF390625ba",
    chain: "Zksync",
    supply: 41525,
    borrow: 34660,
  },
  {
    address: "0xf08a4CeD20984dCac122De4535161eBF390625ba",
    chain: "Manta",
    supply: 314574,
    borrow: 482796,
  },
  {
    address: "0xf08a4CeD20984dCac122De4535161eBF390625ba",
    chain: "Blast",
    supply: 1805,
    borrow: 5400,
  },
  {
    address: "0x61f4678ea8c4e6402fbd390d58dc59c1ae2de3a7",
    chain: "Linea",
    supply: 382419,
    borrow: 687004,
  },
  {
    address: "0x084ccf7fe5383849080e0bb4b5d5f6d575232041",
    chain: "Zksync",
    supply: 9124,
    borrow: 0,
  },
  {
    address: "0x084ccf7fe5383849080e0bb4b5d5f6d575232041",
    chain: "Manta",
    supply: 57429,
    borrow: 0,
  },
  {
    address: "0xD34E206C5c1299Fb2A7406766CFdBEb2326EE339",
    chain: "Blast",
    supply: 2080213,
    borrow: 4937844,
  },
  {
    address: "0xD34E206C5c1299Fb2A7406766CFdBEb2326EE339",
    chain: "Linea",
    supply: 1697899,
    borrow: 2968352,
  },
  {
    address: "0xafde48C521053c1556A0131b1c6e3019bf1bF04B",
    chain: "Zksync",
    supply: 1325164,
    borrow: 1730200,
  },
  {
    address: "0xafde48C521053c1556A0131b1c6e3019bf1bF04B",
    chain: "Linea",
    supply: 2549487,
    borrow: 4635536,
  },
  {
    address: "0xafde48C521053c1556A0131b1c6e3019bf1bF04B",
    chain: "Blast",
    supply: 249637,
    borrow: 1431116,
  },
  {
    address: "0xafde48C521053c1556A0131b1c6e3019bf1bF04B",
    chain: "XLayer",
    supply: 194700,
    borrow: 270408,
  },

  {
    address: "0xf49c764de0f0e2d1cf41c9dca1af54e37b43dbb6",
    chain: "Blast",
    supply: 1800,
    borrow: 4280,
  },
  {
    address: "0x67b7712514faCF5bCeb4f0790f9570Fd0BA0b7EB",
    chain: "Blast",
    supply: 900,
    borrow: 0,
  },
  {
    address: "0x81bfb3B2F4F7dF7d1DB43D7dD7B3b28fdAfd9434",
    chain: "Zksync",
    supply: 1878,
    borrow: 2973,
  },
  {
    address: "0x81bfb3B2F4F7dF7d1DB43D7dD7B3b28fdAfd9434",
    chain: "Linea",
    supply: 0,
    borrow: 0,
  },

  {
    address: "0x2F37154d72DD470558D8699a5A20361716239d61",
    chain: "Blast",
    supply: 53795,
    borrow: 62944,
  },
  {
    address: "0xB5C32eCaED4fe62F7Abf26f83451cA3fa7265023",
    chain: "Zksync",
    supply: 135323,
    borrow: 101664,
  },
  {
    address: "0x45EE97D604674cA864be7C3b8DE522B2341ad72d",
    chain: "Manta",
    supply: 106353,
    borrow: 0,
  },
  {
    address: "0x58b17c261086d47CaC4eC904E4884E508fC40624",
    chain: "Zksync",
    supply: 195078,
    borrow: 546000,
  },
  {
    address: "0x51a7f1582d8700Ac979b1E6EA97DDf1F99E03FaD",
    chain: "Zksync",
    supply: 9588,
    borrow: 12408,
  },
  {
    address: "0x56a459529093aB662d68C8A176E05451A456b281",
    chain: "Manta",
    supply: 33636,
    borrow: 4000,
  },
  {
    address: "0x54691741f6451F4eAe797bd365A17B45eCE418f3",
    chain: "Linea",
    supply: 0,
    borrow: 0,
  },
  {
    address: "0x484af705B49c7b99896fAB1Ce9f0a9fe88Cb4039",
    chain: "Linea",
    supply: 128494,
    borrow: 0,
  },
  {
    address: "0xfE902C52372Aa980fAA75DD466C09039C1760587",
    chain: "Manta",
    supply: 123785,
    borrow: 0,
  },
  {
    address: "0xfE902C52372Aa980fAA75DD466C09039C1760587",
    chain: "Linea",
    supply: 13040,
    borrow: 0,
  },
  {
    address: "0xEE19E84a494768a636d6beB0AD5a60EB9f7cbCF3",
    chain: "EthereumLrt",
    supply: 10479,
    borrow: 18068,
  },
  {
    address: "0xdd05686ff53968bb43972bb31bf4076d532f50ad",
    chain: "Blast",
    supply: 19554627,
    borrow: 45307620,
  },

  //gigawhales
  // {
  //   address: "0xdd05686ff53968bb43972bb31bf4076d532f50ad",
  //   chain: "Linea",
  //   supply: 1104610,
  //   borrow: 21394732,
  // },
  // {
  //   address: "0x24274f51C9Ca980B1698CE25D28Bd60a01AF2cFC",
  //   chain: "Blast",
  //   supply: 2064911,
  //   borrow: 3780480,
  // },
  // {
  //   address: "0xD9cfab54f1234AeEA22B2818AB919866A2809c1C",
  //   chain: "zksync",
  //   supply: 87015379,
  //   borrow: 304161344,
  // },
];

type TaskId = keyof IWalletUserPoints | "";
export const pointsDistribution = async () => {
  const tasks: IAssignPointsTask[] = [];
  // lpPoints.map(async (item: any) => {
  for (const item of lpPoints) {
    const user = await WalletUser.findOne({
      walletAddress: item.address.toLocaleLowerCase().trim(),
    });
    console.log(item);

    if (item.supply > 0) {
      const taskId: TaskId =
        item.chain === "Zksync"
          ? "supply"
          : (`supply${item.chain}` as keyof IWalletUserPoints);
      console.log(taskId);

      const t = await assignPoints(
        user?.id,
        item.supply,
        `Added Final set of LP Points of ${item.supply} supply on ${item.chain}`,
        true,
        taskId
      );
      if (t) tasks.push(t);
    }
    if (item.borrow > 0) {
      const taskId: TaskId =
        item.chain === "Zksync"
          ? "borrow"
          : (`borrow${item.chain}` as keyof IWalletUserPoints);
      const t = await assignPoints(
        user?.id,
        item.borrow,
        `Added Final set of LP Points of ${item.borrow} borrow on ${item.chain}`,
        true,
        taskId
      );
      if (t) tasks.push(t);
    }
  }
  console.log(tasks);

  await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
  await UserPointTransactions.bulkWrite(
    _.flatten(tasks.map((r) => r.pointsBulkWrites))
  );
};
