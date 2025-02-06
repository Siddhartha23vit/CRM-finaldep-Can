import mongoose from "mongoose"

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Sell", "Rent", "Lease"],
    default: "Sell",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  callHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      duration: Number,
      recording: String,
    },
  ],
})

export const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema)

