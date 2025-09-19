import mongoose from "mongoose";
import { Status } from "../constants/index.js";

const Schema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cronjobs",
  },
  jobName: {
    type: String,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: [...Object.values(Status)],
    },
    message: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
    _id: false,
  }],
}, {
  timestamps: true,
});

const CronJobStatuses = mongoose.model("cron_jos_statuses", Schema);
export default CronJobStatuses;
