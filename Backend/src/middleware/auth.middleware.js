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

export function verifyAdmin(req, res, next) {
  // First ensure the user is authenticated
  verifyToken(req, res, () => {
    // Check if the authenticated user has the 'admin' role
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
  });
}
