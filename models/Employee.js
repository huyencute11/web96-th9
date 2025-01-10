import mongoose, { Schema } from "mongoose";
// Schema for Employees
const EmployeeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: "Manager", required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
});

export default Employee = mongoose.model("Employee", EmployeeSchema);
