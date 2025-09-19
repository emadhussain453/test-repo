import { StableModelsNames } from "../constants/index.js";

const getBalanceHistory = (userId) => {
  const aggregation = [
    {
      $match: {
        _id: userId,
      },
    },
    {
      $lookup: {
        from: StableModelsNames.CASHIN_V1,
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $match: {
              status: "COMPLETED",
            },
          },
        ],
        as: "cashinTransactions_v1",
      },
    },
    {
      $lookup: {
        from: "transactions_p2ps",
        localField: "_id",
        foreignField: "to",
        pipeline: [
          {
            $match: {
              status: "COMPLETED",
            },
          },
        ],
        as: "p2pTransactions",
      },
    },
    {
      $project: {
        totalCashinBalance: {
          $sum: {
            $sum: "$cashinTransactions_v1.amount",
          },
        },
        totalp2pBalance: {
          $sum: {
            $sum: "$p2pTransactions.amount",
          },
        },
      },
    },
    {
      $project: {
        totalBalanceToOrderCard: {
          $toDouble: {
            $sum: [
              "$totalp2pBalance",
              "$totalCashinBalance",
            ],
          },
        },
      },
    },
  ];
  return aggregation;
};
export default getBalanceHistory;
