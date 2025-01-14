import bcrypt from "bcrypt";
import Account from "../models/Account.js";
import Property from "../models/Property.js";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import { v2 as cloudinary } from "cloudinary";
import upload from "../middlewares/uploadFile.js";

const AccountController = {
  // API dang ky tai khoan
  register: async (req, res) => {
    try {
      const { email, password, role, isActive } = req.body;
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
  createProperty: async (req, res) => {
    try {
      const { email } = req.query;
      const account = await Account.findOne({ email });
      if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại" });
      }
      if (account.role !== "MANAGER" && account.role !== "EMPLOYEE") {
        return res
          .status(403)
          .json({ message: "Chỉ Manager hoặc Employee mới được phép tạo nhà" });
      }
      const { address, price, area, status } = req.body;
      let result;
     upload.single("file"),
        async (req, res) => {
          const file = req.file;
          console.log("🚀 ~ file:", file);
          if (!file) {
            return res.status(400).json({ message: "Hình ảnh là bắt buộc" });
          }
          const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString(
            "base64"
          )}`;
          const fileName = file.originalname.split(".")[0];
          result = await cloudinary.uploader.upload(
            dataUrl,
            {
              public_id: fileName,
              resource_type: "auto",
            },
            (err, result) => {
              if (result) {
                console.log(result.secure_url);
              }
              throw new Error("Error during uploading image" + err);
            }
          );
        };
      

      await Property.create({
        address,
        price,
        area,
        status,
        image: result.secure_url,
        employeeId: account.role === "MANAGER" ? null : account._id,
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
  },

  createProperty2: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "File upload failed", error: err.message });
      }

      try {
        const { email } = req.query;
        const account = await Account.findOne({ email });
        if (!account) {
          return res.status(404).json({ message: "Tài khoản không tồn tại" });
        }
        if (account.role !== "MANAGER" && account.role !== "EMPLOYEE") {
          return res
            .status(403)
            .json({ message: "Chỉ Manager hoặc Employee mới được phép tạo nhà" });
        }
        const { address, price, area, status } = req.body;
        const file = req.file;
        console.log("🚀 ~ createProperty: ~ file:", req.body);
        if (!file) {
          return res.status(400).json({ message: "Hình ảnh là bắt buộc" });
        }

        const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
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
          employeeId: account.role === "MANAGER" ? null : account._id,
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
        res.status(500).json({ message: "Đã xảy ra lỗi trong quá trình tạo nhà" });
      }
    });
  },
};

export default AccountController;
