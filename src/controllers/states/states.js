import States from "../../models/states.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";

const getStates = async (req, res, next) => {
  try {
    const { query: { search }, translate } = req;

    const query = {};
    if (search) {
      const regexPattern = new RegExp(`^${search}`);
      query.state = { $regex: regexPattern, $options: "i" };
    }

    const aggregationPipeline = [
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          States: { $addToSet: "$state" },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          States: {
            $sortArray: {
              input: "$States",
              sortBy: 1,
            },
          },
          totalCount: {
            $size: "$States",
          },
        },
      },
    ];
    const states = await States.aggregate(aggregationPipeline);
    const finalResponse = {
      states: states[0]?.States ?? [],
      totalCount: states[0]?.totalCount ?? 0,
    };

    return sendSuccessResponse(res, 200, true, translate("state_details_fetched_success"), "states", finalResponse);
  } catch (error) {
    next(error);
  }
  return false;
};

export default getStates;
