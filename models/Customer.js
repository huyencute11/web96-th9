import mongoose, { Schema } from "mongoose";

// Schema for Customers
const CustomerSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  });
export default Customer = mongoose.model("Customer", CustomerSchema);