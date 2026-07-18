import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}   
