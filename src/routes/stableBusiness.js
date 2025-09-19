import express from "express";
import { getUser, businessTransaction } from "../controllers/business/index.js";
import getCategories from "../controllers/tapi/getCatgories.js";
import getCompaniesCategories from "../controllers/tapi/getCompaniesCategories.js";
import getCategoriesV2 from "../controllers/tapi/getCategoriesV2.js";

const router = express.Router();

router.get("/", getUser);
router.get("/categories", getCategoriesV2);
router.get("/companies", getCompaniesCategories);
router.post("/", businessTransaction);

export default router;
