import mongoose, { Schema } from "mongoose";
// Schema for Properties
const PropertySchema = new Schema({
  address: { type: String, required: true },
  price: { type: mongoose.Types.Decimal128, required: true },
  area: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Đang bán", "Đã bán", "Dừng bán"],
    required: true,
  },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
});

export default Property = mongoose.model("Property", PropertySchema);
