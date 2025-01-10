import bcrypt from "bcrypt";
import Account from "../models/Account.js";
import jwt from "jsonwebtoken";

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
};

export default AccountController;
