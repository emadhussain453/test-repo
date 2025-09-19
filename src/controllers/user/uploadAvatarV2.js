/* eslint-disable import/no-extraneous-dependencies */
import moment from "moment";
import isBase64 from "is-base64";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import logger from "../../logger/index.js";
import Users from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import sendSuccessResponse from "../../utils/responses/sendSuccessResponse.js";
import s3Client from "../../config/aws-s3.js";
import keys from "../../config/keys.js";
import Event from "../../Events/databaseLogs.js";
import { EventTypes } from "../../constants/index.js";
import cloudfront from "../../config/aws-cloudfront.js";

const uploadAvatarV2 = async (req, res, next) => {
    try {
        const { user: { _id, avatar: userAvatar }, body: { base64, contentType }, translate } = req;

        if (!base64) {
            throw new ApiError("avatar upload error", 400, translate("please_upload_file"), true);
        }
        if (!isBase64(base64, { allowMime: true })) throw new ApiError("avatar upload error", 400, translate("invalid_base64"), true);
        const filetypes = /^(image\/jpeg|image\/jpg|image\/png|image\/gif)$/;
        if (!filetypes.test(contentType?.toLowerCase())) {
            throw new ApiError("invalid Details", 400, translate("file_types_allowed"), true);
        }
        const fileKey = `avatar:${_id}.${contentType}`;
        const bufferImage = Buffer.from(base64, "base64");

        const avatar = {
            s3Url: `${keys.AWS.CLOUDFRONT_DNS}${fileKey}`,
            url: `${keys.AWS.CLOUDFRONT_DNS}${fileKey}`,
            key: fileKey,
            uploadedAt: moment(),
        };
        const uploadParams = {
            Bucket: keys.AWS.S3_BUCKET_NAME,
            Key: fileKey,
            Body: bufferImage,
            ContentType: contentType,
        };
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        const avatarUpdated = await Users.updateOne({ _id }, { $set: { avatar } });
        if (!avatarUpdated.modifiedCount) {
            logger.error("Avatar url failed to save in database");
            throw new ApiError("avatar upload error", 400, translate("something_went_wrong"), true);
        }

        // generate image blurHash
        // const eventPayload = {
        //     bufferImage,
        //     userId: _id,
        // };
        // Event.emit(EventTypes.GenerateBlurHash, eventPayload);

        // invalidate cache from cloudfront , if first image then dont invalidate
        if (userAvatar?.url) {
            const callerRefrance = `${fileKey}:${moment()}`;
            const inputForCF = {
                DistributionId: keys.AWS.CLOUDFRONT_DISTRIBUTION_ID,
                InvalidationBatch: {
                    Paths: {
                        Quantity: 1,
                        Items: [`/${fileKey}`],
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

        return sendSuccessResponse(res, 200, true, translate("avatar_uploaded_successfully"), "uploadAvatarV2", finalPayload);
    } catch (error) {
        next(error);
    }
    return false;
};

export default uploadAvatarV2;
