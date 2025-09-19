import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import s3Client from "../config/aws-s3.js";
import { ApiError } from "../utils/ApiError.js";
import keys from "../config/keys.js";

function uploadAvatarMiddleware(request, response, next) {
    const uploadAvatarConfig = multer({
        storage: multerS3({
            s3: s3Client,
            bucket: keys.AWS.S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key(req, file, cb) {
                const extname = path.extname(file.originalname).toLowerCase();
                const fileKey = `avatar:${req.user._id}${extname}`;
                cb(null, fileKey);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
        fileFilter: (req, file, cb) => {
            const { translate } = req;
            const filetypes = /jpeg|jpg|png|gif/;
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);
            if (!extname) {
                return cb(new ApiError("multerError", 400, translate("file_types_allowed"), true));
            }
            if (mimetype && extname) {
                return cb(null, true);
            }
            return cb(new ApiError("multerError", 400, translate("only_images_allowed"), true));
        },
    }).single("image");

    uploadAvatarConfig(request, response, (err) => {
        const { translate } = request;

        let errMessage = "";
        if (err) {
            const errorCode = err?.code?.toLowerCase() ?? null;
            errMessage = errorCode;
            if (!errorCode) {
                errMessage = err.message;
            }
        }

        if (err instanceof multer.MulterError) {
            return next(new ApiError("multer", 400, translate(errMessage), true));
        } if (err instanceof Error) {
            return next(new ApiError("multer", 400, translate(errMessage), true));
        }
        // All is well
        return next();
    });
}

export default uploadAvatarMiddleware;
