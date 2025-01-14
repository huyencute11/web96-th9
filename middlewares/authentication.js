import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ message: "No token provided" });
    }
  
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'huyentran', (err, decoded) => {
      if (err) {
        return res.status(500).json({ message: "Failed to authenticate token" });
      }
      req.account = decoded;
      next();
    });
}
export default verifyToken;