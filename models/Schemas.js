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

// Schema for Customers
const CustomerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
});

// Schema for Managers
const ManagerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
});

// Schema for Employees
const EmployeeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: "Manager", required: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
});

// Schema for Properties
const PropertySchema = new Schema({
  address: { type: String, required: true },
  price: { type: mongoose.Types.Decimal128, required: true },
  area: { type: Number, required: true },
  status: { type: String, enum: ["Đang bán", "Đã bán", "Dừng bán"], required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
});

// Schema for DepositOrders
const DepositOrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  depositAmount: { type: mongoose.Types.Decimal128, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Đã thanh toán", "Chờ xử lý", "Đã huỷ"], required: true },
});

// Export models
export const Account = mongoose.model("Account", AccountSchema);
export const Customer = mongoose.model("Customer", CustomerSchema);
export const Manager = mongoose.model("Manager", ManagerSchema);
export const Employee = mongoose.model("Employee", EmployeeSchema);
export const Property = mongoose.model("Property", PropertySchema);
export const DepositOrder = mongoose.model("DepositOrder", DepositOrderSchema);
