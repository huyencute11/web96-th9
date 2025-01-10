import mongoose, { Schema } from "mongoose";

// Schema for Account
const AccountSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  role: {
    type: String,
    enum: ["MANAGER", "CUSTOMER", "EMPLOYEE"],
    default: "CUSTOMER",
  },
});

const Account = mongoose.model("Account", AccountSchema);
export default Account; 
