import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, lowercase: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    note: { type: String, trim: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    guestTimezone: { type: String, default: "UTC" },
    googleEventId: { type: String, default: null },
  },
  { timestamps: true }
);

BookingSchema.index({ hostId: 1, startTime: 1, endTime: 1 });

export default mongoose.model("Booking", BookingSchema);
