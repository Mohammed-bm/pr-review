const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith("Bearer")) {
    try {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.id; // attach user id to request
      next();
    } catch (err) {
      return res.status(401).json({ msg: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
};

module.exports = { protect };
