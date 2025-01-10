import mongoose, { Schema } from "mongoose";
// Schema for DepositOrders
const DepositOrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  depositAmount: { type: mongoose.Types.Decimal128, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Đã thanh toán", "Chờ xử lý", "Đã huỷ"],
    required: true,
  },
});

export default DepositOrder = mongoose.model(
  "DepositOrder",
  DepositOrderSchema
);
