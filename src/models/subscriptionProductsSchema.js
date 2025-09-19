import mongoose from "mongoose";

const ProductsSchema = mongoose.Schema({
    active: {
        type: "Boolean",
    },
    amountInLocal: {
        type: Number,
    },
    productDescription: {
        type: "String",
    },
    productId: {
        type: "String",
    },
    productLogo: {
        type: "String",
    },
    productType: {
        type: "String",
    },
    currency: {
        type: "String",
    },
    serviceFeeAmount: {
        type: Number,
    },
    stableFeeAmount: {
        type: Number,
    },
    totalAmountInSUSD: {
        type: Number,
    },
    totalFeeInLocal: {
        type: Number,
    },
    totalFeeInSUSD: {
        type: Number,
    },
    amount: {
        type: Number,
    },
    exchangeDetail: {
        type: [
            "Mixed",
        ],
    },
});

export default ProductsSchema;
