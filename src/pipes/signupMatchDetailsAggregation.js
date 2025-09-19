const signupAggregationMatchUser = (userDetail) => {
    const { email, phoneNumber, firstName, lastName, dateOfBirth } = userDetail;
    const arr = [
        {
            $match: {
                $or: [
                    {
                        email,
                    }, {
                        phoneNumber,
                    },
                ],
            },
        }, {
            $group: {
                _id: null,
                email: {
                    $max: {
                        $cond: [
                            {
                                $eq: [
                                    "$email", email,
                                ],
                            }, "Email already exists", "",
                        ],
                    },
                },
                phoneNumber: {
                    $max: {
                        $cond: [
                            {
                                $eq: [
                                    "$phoneNumber", phoneNumber,
                                ],
                            }, "Phone number already exists", "",
                        ],
                    },
                },
            },
        }, {
            $project: {
                _id: 0,
                error: {
                    $cond: [
                        {
                            $or: [
                                {
                                    $ne: [
                                        "$email", "",
                                    ],
                                }, {
                                    $ne: [
                                        "$phoneNumber", "",
                                    ],
                                },
                            ],
                        }, true, false,
                    ],
                },
                email: 1,
                phoneNumber: 1,
            },
        },
    ];
    return arr;
};
export default signupAggregationMatchUser;
