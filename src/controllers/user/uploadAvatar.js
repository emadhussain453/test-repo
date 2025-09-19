import moment from "moment";
import logger from "../../logger/index.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import s3Client, { GetObjectCommand } from "../../config/aws-s3.js";
import cloudfront, { CreateInvalidationCommand } from "../../config/aws-cloudfront.js";
import keys from "../../config/keys.js";
import Event from "../../Events/databaseLogs.js";
import { EventTypes } from "../../constants/index.js";

const uploadAvatar = async (req, res, next) => {
    try {
        const { user: { _id, avatar: userAvatar }, file, translate } = req;

        if (!file) {
            throw new ApiError("avatar upload error", 400, translate("please_upload_file"), true);
        }
        if (!file?.location) {
            logger.error("failed to locate s3 url");
            throw new ApiError("avatar upload error", 400, translate("something_went_wrong"), true);
        }

        const params = {
            Bucket: keys.AWS.S3_BUCKET_NAME,
            Key: file.key,
        };

        const getObjectFromS3 = new GetObjectCommand(params);
        const object = await s3Client.send(getObjectFromS3);
        const base64Image = await object.Body.transformToString("base64");
        const bufferImage = Buffer.from(base64Image, "base64");

        // generate image blurHash
        const eventPayload = {
            bufferImage,
            userId: _id,
        };
        Event.emit(EventTypes.GenerateBlurHash, eventPayload);

        const avatar = {
            s3Url: file.location,
            url: `${keys.AWS.CLOUDFRONT_DNS}${file.key}`,
            key: file.key,
            uploadedAt: moment(),
        };
        const avatarUpdated = await Users.updateOne({ _id }, { $set: { avatar } });
        if (!avatarUpdated.modifiedCount) {
            logger.error("Avatar url failed to save in database");
            throw new ApiError("avatar upload error", 400, translate("something_went_wrong"), true);
        }

        // invalidate cache from cloudfront , if first image then dont invalidate
        if (userAvatar?.url) {
            const callerRefrance = `${file.key}:${moment()}`;
            const inputForCF = {
                DistributionId: keys.AWS.CLOUDFRONT_DISTRIBUTION_ID,
                InvalidationBatch: {
                    Paths: {
                        Quantity: 1,
                        Items: [`/${file.key}`],
                    },
                    CallerReference: callerRefrance,
                },
            };

            const createCacheInvalidation = new CreateInvalidationCommand(inputForCF);
            const cacheInvalidated = await cloudfront.send(createCacheInvalidation);
        }

        const finalPayload = {
            avatar: {
                ...avatar,
            },
        };

        return sendSuccessResponse(res, 200, true, translate("avatar_uploaded_successfully"), "uploadAvatar", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default uploadAvatar;
