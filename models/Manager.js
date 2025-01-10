import mongoose, { Schema } from "mongoose";
// Schema for Managers
const ManagerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
});

export default Manager = mongoose.model("Manager", ManagerSchema);
