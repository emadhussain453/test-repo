import mongoose from "mongoose";

const promotionFieldSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    color: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });

const promotionsSchema = new mongoose.Schema({
    typeId: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        default: "image",
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    frontImageV1: {
        type: String,
        trim: true,
    },
    thumbnailImage: {
        type: String,
        trim: true,
    },
    isOldPromotionImageUpdated: {
        type: Boolean,
        default: false,
    },
    thumbnailImage: {
        type: String,
        trim: true,
    },
    isNewImage: {
        type: Boolean,
        default: false,
    },
    isThumbnail: {
        type: Boolean,
        default: false,
    },
    frontTitle: {
        type: promotionFieldSchema,
    },
    frontDescription: {
        type: promotionFieldSchema,
    },
    frontTitleSpanish: {
        type: promotionFieldSchema,
    },
    frontDescriptionSpanish: {
        type: promotionFieldSchema,
    },
    frontImage: {
        type: String,
        trim: true,
    },
    videoUrl: {
        type: String,
        trim: true,
    },
    backTitle: {
        type: promotionFieldSchema,
    },
    backDescription: {
        type: promotionFieldSchema,
    },
    backTitleSpanish: {
        type: promotionFieldSchema,
    },
    backDescriptionSpanish: {
        type: promotionFieldSchema,
    },
    backCode: {
        type: promotionFieldSchema,
    },
    backCopyIconColor: {
        type: String,
        trim: true,
    },
    backBorderColor: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    publishTime: {
        type: Date,
        trim: true,
    },
    expiryTime: {
        type: Date,
        trim: true,
    },
}, {
    timestamps: true,
});

promotionsSchema.index({ isActive: 1 });
promotionsSchema.index({ createdAt: -1 });

const Promotions = mongoose.model("promotions", promotionsSchema);

export default Promotions;
