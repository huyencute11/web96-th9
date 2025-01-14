import mongoose, { Schema } from "mongoose";
// Schema for Properties
const PropertySchema = new Schema({
  address: { type: String, required: true },
  price: { type: String, required: true },
  area: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Đang bán", "Đã bán", "Dừng bán"],
    required: true,
  },
  image: { type: String, required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
});

const Property = mongoose.model("Property", PropertySchema);
export default Property
