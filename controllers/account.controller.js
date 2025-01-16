import bcrypt from "bcrypt";
import Account from "../models/Account.js";
import Customer from "../models/Customer.js";
import Property from "../models/Property.js";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import { v2 as cloudinary } from "cloudinary";
import upload from "../middlewares/uploadFile.js";
import Manager from "../models/Manager.js";
import DepositOrder from "../models/DepositOrder.js";

const AccountController = {
  // API dang ky tai khoan
  register: async (req, res) => {
    try {
      const {
        email,
        password,
        role,
        isActive,
        name,
        phone,
        address,
        department,
      } = req.body;
      // Kiểm tra thông tin đầu vào
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email và mật khẩu là bắt buộc" });
      }
      // Kiểm tra email đã tồn tại chưa
      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);
      // Tạo tài khoản mới
      const newAccount = new Account({
        email,
        password: hashedPassword,
        role: role || "CUSTOMER", // Nếu không cung cấp role, mặc định là CUSTOMER
        isActive,
      });

      // Lưu tài khoản vào database
      await newAccount.save();
      //Luu vao customer
      if (role === "CUSTOMER") {
        const newCustomer = new Customer({
          name,
          email,
          phone,
          address,
          accountId: newAccount._id,
        });
        await newCustomer.save();
      }
      if (role === "MANAGER") {
        const newManager = new Manager({
          name,
          email,
          phone,
          department,
          accountId: newAccount._id,
        });
        await newManager.save();
      }

      res.status(201).json({
        message: "Đăng ký thành công",
        account: {
          email: newAccount.email,
          role: newAccount.role,
        },
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình đăng ký" });
    }
  },
  //  4. Viết API đăng nhập tài khoản, nếu isActive là true cho phép đăng nhập (trả về các token)
  // POST /login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      // Kiểm tra thông tin đầu vào
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email và mật khẩu là bắt buộc" });
      }
      // Tìm tài khoản trong database
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      // Kiểm tra mật khẩu
      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Mật khẩu không chính xác" });
      }
      // Kiểm tra tài khoản có đang hoạt động không
      if (!account.isActive) {
        return res.status(403).json({ message: "Tài khoản đã bị khóa" });
      }
      // Trả về thông tin tài khoản
      const token = jwt.sign(
        { email: account.email, role: account.role },
        "huyentran",
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "Đăng nhập thành công",
        token: token,
        account: {
          email: account.email,
          role: account.role,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình đăng nhập" });
    }
  },

  // Viết API lấy thông tin cá nhân tương ứng với role của tài khoản
  // GET /account/profile
  getProfile: async (req, res) => {
    try {
      const { email } = req.query;
      console.log("email", email);
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      res.status(200).json({
        email: account.email,
        role: account.role,
      });
    } catch (error) {
      console.error("Error during getting profile:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình lấy thông tin" });
    }
  },
  //Viết API cho phép người dùng tạo thông tin cá nhân theo role tương ứng của tài khoản (Người dùng đã đăng nhập)

  // POST /account/profile
  createProfile: async (req, res) => {
    try {
      const { email } = req.query;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      const { name, address, phone } = req.body;
      account.profile = { name, address, phone };
      await account.save();
      res.status(200).json({
        message: "Tạo thông tin cá nhân thành công",
        profile: account.profile,
      });
    } catch (error) {
      console.error("Error during creating profile:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình tạo thông tin" });
    }
  },
  // Viết API cho phép Manager (quản lý) tạo tài khoản, thông tin cho Employee (nhân viên)

  // POST /account/employee
  createEmployee: async (req, res) => {
    try {
      const { email } = req.query;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      if (account.role !== "MANAGER") {
        return res
          .status(403)
          .json({ message: "Chỉ Manager mới được phép tạo nhân viên" });
      }
      const {
        email: employeeEmail,
        name,
        phone,
        department,
        password,
        role,
        isActive,
      } = req.body;

      const existingAccount = await Account.findOne({ email: employeeEmail });
      if (existingAccount) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAccount = new Account({
        email: employeeEmail,
        password: hashedPassword,
        role,
        isActive,
      });
      await newAccount.save();

      const newEmployee = new Employee({
        name: name,
        email: employeeEmail,
        phone,
        department,
        managerId: account._id,
        accountId: newAccount._id,
      });
      await newEmployee.save();

      res.status(201).json({
        message: "Tạo nhân viên thành công",
        account: {
          email: newAccount.email,
          role: newAccount.role,
        },
        employee: {
          name: newEmployee.name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          department: newEmployee.department,
        },
      });
    } catch (error) {
      console.error("Error during creating employee:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình tạo nhân viên" });
    }
  },

  //8. Viết API cho phép Manager (quản lý) hoặc Employee (nhân viên) tạo
  //  thông tin Property (nhà ở) (Bao gồm cả thông tin hình ảnh của căn nhà)
  // POST /account/property
  createProperty2: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "File upload failed", error: err.message });
      }

      try {
        const { email } = req.query;
        const account = await Account.findOne({ email });
        if (!account) {
          return res.status(404).json({ message: "Tài khoản không tồn tại" });
        }
        if (account.role !== "MANAGER" && account.role !== "EMPLOYEE") {
          return res.status(403).json({
            message: "Chỉ Manager hoặc Employee mới được phép tạo nhà",
          });
        }
        const { address, price, area, status } = req.body;
        const file = req.file;
        console.log("🚀 ~ createProperty: ~ file:", req.body);
        if (!file) {
          return res.status(400).json({ message: "Hình ảnh là bắt buộc" });
        }

        const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;
        const fileName = file.originalname.split(".")[0];
        const result = await cloudinary.uploader.upload(dataUrl, {
          public_id: fileName,
          resource_type: "auto",
        });

        await Property.create({
          address,
          price,
          area,
          status,
          image: result.secure_url,
          employeeId: account._id,
        });

        res.status(201).json({
          message: "Tạo nhà thành công",
          property: {
            address,
            price,
            area,
            status,
            image: result.secure_url,
          },
        });
      } catch (error) {
        console.error("Error during creating property:", error);
        res
          .status(500)
          .json({ message: "Đã xảy ra lỗi trong quá trình tạo nhà" });
      }
    });
  },
  // 9. Viết API cho phép Manager (quản lý) hoặc Employee (nhân viên) cập nhật thông tin Property (nhà ở) (Bao gồm cả thông tin hình ảnh của căn nhà)
  // PUT /account/property/:id
  updateProperty: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "File upload failed", error: err.message });
      }

      try {
        const { email } = req.query;
        const account = await Account.findOne({ email });
        if (!account) {
          return res.status(404).json({ message: "Tài khoản không tồn tại" });
        }
        if (account.role !== "MANAGER" && account.role !== "EMPLOYEE") {
          return res.status(403).json({
            message: "Chỉ Manager hoặc Employee mới được phép cập nhật nhà",
          });
        }
        const updateFields = {};
        const { address, price, area, status } = req.body;
        if (address) updateFields.address = address;
        if (price) updateFields.price = price;
        if (area) updateFields.area = area;
        if (status) updateFields.status = status;

        const file = req?.file;
        if (file) {
          const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString(
            "base64"
          )}`;
          const fileName = file.originalname.split(".")[0];
          const result = await cloudinary.uploader.upload(dataUrl, {
            public_id: fileName,
            resource_type: "auto",
          });
          updateFields.image = result.secure_url;
        }

        const updatedProperty = await Property.findByIdAndUpdate(
          req.params.id,
          { $set: updateFields },
          { new: true }
        );

        res.status(200).json({
          message: "Cập nhật nhà thành công",
          property: updatedProperty,
        });
      } catch (error) {
        console.error("Error during updating property:", error);
        res
          .status(500)
          .json({ message: "Đã xảy ra lỗi trong quá trình cập nhật nhà" });
      }
    });
  },

  // 10 Viết API cho phép Customer (khách hàng) tạo đơn đặt cọc
  // POST /account/createDepositOrder
  createDepositOrder: async (req, res) => {
    try {
      const { email } = req.query;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      if (account.role !== "CUSTOMER") {
        return res.status(403).json({
          message: "Chỉ Customer mới được phép tạo đơn đặt cọc",
        });
      }

      const { propertyId, depositAmount } = req.body;
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Nhà không tồn tại" });
      }
      const newOrder = {
        customerId: account._id,
        propertyId,
        depositAmount,
        date: new Date(),
        status: "Chờ xử lý",
      };
      await DepositOrder.create(newOrder);
      res.status(201).json({
        message: "Tạo đơn đặt cọc thành công",
        order: newOrder,
      });
    } catch (error) {
      console.error("Error during creating deposit order:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình tạo đơn đặt cọc" });
    }
  },
  //1111Viết API cho phép  Manager (quản lý) hoặc Employee (nhân viên) lấy thông tin các đơn đặt cọc,
  // kèm theo thông tin của khách hàng (tên, email, số điện thoại) (Có thực hiện phân trang, filter, sort)
  // GET /account/depositOrders
  getDepositOrders: async (req, res) => {
    try {
      const { email } = req.query;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      if (account.role !== "MANAGER" && account.role !== "EMPLOYEE") {
        return res.status(403).json({
          message: "Chỉ Manager hoặc Employee mới được phép xem đơn đặt cọc",
        });
      }
      const { page, limit } = req.query;

      const orders = await DepositOrder.find({
        depositAmount: { $lt: 45000000 },
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ depositAmount: -1 });
      // $lt ==>less than = nho hon
      // $gt ==> greater than or equal = lon hon hoac bang <=

      res.status(200).json({
        orders,
      });
    } catch (error) {
      console.error("Error during getting deposit orders:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình lấy đơn đặt cọc" });
    }
  },
  //12. Viết API cho phép Customer (khách hàng) xem thông tin các đơn đặt cọc của bản thân bao gồm thông Property (Nhà ở)
  //  và Employee (nhân viên) (tên, email, số điện thoại)
  //  hỗ trợ cho đơn đó (là nhân viên có trách nhiệm với căn nhà đặt cọc) (Có thực hiện phân trang, filter).
  // GET /account/myDepositOrders
  getMyDepositOrders: async (req, res) => {
    try {
      const { email } = req.params;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      if (account.role !== "CUSTOMER") {
        return res.status(403).json({
          message: "Chỉ Customer mới được phép xem đơn đặt cọc của mình",
        });
      }
      const { page, limit } = req.query;
      const orders = await DepositOrder.find({ customerId: account._id })
        .skip((page - 1) * limit)
        .limit(limit);
      const data = [];
      orders.forEach(async (order) => {
        const property = await Property.findById(order.propertyId);
        const employee = await Account.findOne({ _id: property.employeeId });
      
      });
      res.status(200).json({
        orders,
      });
    } catch (error) {
      console.error("Error during getting my deposit orders:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi trong quá trình lấy đơn đặt cọc" });
    }
  },
  //Viết API cho phép Nhân viên (Employee) xem danh sách nhà ở mà họ đang quản lý (Có thực hiện phân trang, filter, sort)
  // GET /account/myProperties
  getMyProperties: async (req, res) => {
    try {
      const { email } = req.query;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      if (account.role !== "EMPLOYEE") {
        return res.status(403).json({
          message: "Chỉ Employee mới được phép xem nhà mình quản lý",
        });
      }
      const { page, limit } = req.query;
      const properties = await Property.find({ employeeId: account._id })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ price: -1 });
      res.status(200).json({
        properties,
      });
    } catch (error) {
      console.error("Error during getting my properties:", error);
      res.status(500).json({
        message: "Đã xảy ra lỗi trong quá trình lấy nhà mình quản lý",
      });
    }
  },
};

export default AccountController;
