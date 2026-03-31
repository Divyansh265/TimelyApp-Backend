import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    availableDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    timeSlots: { type: [TimeSlotSchema], default: [{ start: "09:00", end: "17:00" }] },
    meetingDurations: { type: [Number], default: [30] },
    defaultDuration: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export default mongoose.model("Availability", AvailabilitySchema);
