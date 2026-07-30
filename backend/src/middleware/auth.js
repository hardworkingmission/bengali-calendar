const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "একটি বৈধ টোকেন প্রয়োজন (login required)" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "টোকেনের মেয়াদ শেষ অথবা অবৈধ (invalid or expired token)" });
  }
}

module.exports = { requireAuth };
