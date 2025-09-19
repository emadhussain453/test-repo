export const createAggreationPipe = (_id, contacts) => [
    {
        $match: {
            phoneNumber: {
                $in: contacts,
            },
        },
    },
    {
        $addFields: {
            userId: _id,
            favourite: false,
        },
    },
    {
        $project: {
            userId: 1,
            email: 1,
            phoneNumber: 1,
            firstName: 1,
            lastName: 1,
            favourite: 1,
            countryCode: 1,
        },
    },
    // if you are converting all above docs in an array and then unwinding them makes no sense , that why these both pipeline are removed in optimizedAggregation
    {
        $group: {
            _id: 0,
            matchedUsers: {
                $push: "$$ROOT",
            },
        },
    },
    {
        $unwind: {
            path: "$matchedUsers",
        },
    },
    {
        $lookup: {
            from: "payees",
            let: {
                userId: _id, // use $userId as it has been added in the project stage
                phoneNumber:
                    "$matchedUsers.phoneNumber",
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $eq: ["$userId", "$$userId"],
                                },
                                {
                                    $eq: [
                                        "$phoneNumber",
                                        "$$phoneNumber",
                                    ],
                                },
                            ],
                        },
                    },
                },
            ],
            as: "matchedPayess",
        },
    },
    {
        $match: {
            matchedPayess: {
                $eq: [],
            },
        },
    },
    {
        $group: {
            _id: 0,
            fieldN: {
                $push: "$matchedUsers", // instead of pushing the wohole array pic and choose why fields are required
            },
        },
    },
];

export const optimizedSyncContectsAggregationPipeline = (_id, contacts) => [
    {
        $match: {
            phoneNumber: {
                $in: contacts,
            },
        },
    }, {
        $project: {
            userId: _id,
            email: 1,
            phoneNumber: 1,
            firstName: 1,
            lastName: 1,
            favourite: {
                $toBool: false,
            },
            countryCode: 1,
        },
    }, {
        $lookup: {
            from: "payees",
            let: {
                userId: "$userId",
                phoneNumber: "$phoneNumber",
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $eq: [
                                        "$userId", "$$userId",
                                    ],
                                }, {
                                    $eq: [
                                        "$phoneNumber", "$$phoneNumber",
                                    ],
                                },
                            ],
                        },
                    },
                },
            ],
            as: "usersToCreatePayeeFor",
        },
    }, {
        $match: {
            usersToCreatePayeeFor: {
                $eq: [],
            },
        },
    }, {
        $group: {
            _id: 0,
            newPayeesToAdd: {
                $push: {
                    $mergeObjects: [
                        {
                            phoneNumber: "$phoneNumber",
                            userId: "$userId",
                            favourite: "$favourite",
                            email: "$email",
                            firstName: "$firstName",
                            lastName: "$lastName",
                            countryCode: "$countryCode",
                            payeeUserId: "$_id",
                        },
                    ],
                },
            },
        },
    },
];
