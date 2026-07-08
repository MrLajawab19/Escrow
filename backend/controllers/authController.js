const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-production";
const JWT_EXPIRES = "7d";

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ── BUYER SIGNUP ──────────────────────────────────────────────────────────────
async function buyerSignup(req, res) {
  try {
    const { email, password, firstName, lastName, phone, country } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "Email, password, first name, and last name are required" });
    }

    const existing = await prisma.buyer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const buyer = await prisma.buyer.create({
      data: { email, password: hashedPassword, firstName, lastName, phone: phone || null, country: country || null },
    });

    // Initialize wallet
    await prisma.wallet.create({
      data: { userId: buyer.id, userRole: "buyer", currency: "INR" },
    });

    const { password: _, ...buyerData } = buyer;
    const token = makeToken({ id: buyer.id, email: buyer.email, role: 'buyer', firstName: buyer.firstName, lastName: buyer.lastName });

    res.status(201).json({ success: true, message: "Account created", token, buyer: buyerData });
  } catch (err) {
    console.error("buyerSignup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── BUYER LOGIN ───────────────────────────────────────────────────────────────
async function buyerLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const buyer = await prisma.buyer.findUnique({ where: { email } });
    if (!buyer) return res.status(401).json({ success: false, message: "Invalid credentials" });
    if (buyer.status === "suspended") return res.status(403).json({ success: false, message: "Account suspended" });

    const valid = await bcrypt.compare(password, buyer.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    await prisma.buyer.update({ where: { id: buyer.id }, data: { lastLoginAt: new Date() } });

    const { password: _, ...buyerData } = buyer;
    const token = makeToken({ id: buyer.id, email: buyer.email, role: 'buyer', firstName: buyer.firstName, lastName: buyer.lastName });

    res.json({ success: true, token, buyer: buyerData });
  } catch (err) {
    console.error("buyerLogin error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── SELLER SIGNUP ─────────────────────────────────────────────────────────────
async function sellerSignup(req, res) {
  try {
    const { email, password, firstName, lastName, phone, country, businessName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "Email, password, first name, and last name are required" });
    }

    const existing = await prisma.seller.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const seller = await prisma.seller.create({
      data: { email, password: hashedPassword, firstName, lastName, phone: phone || null, country: country || null, businessName: businessName || null },
    });

    // Initialize wallet
    await prisma.wallet.create({
      data: { userId: seller.id, userRole: "seller", currency: "INR" },
    });

    const { password: _, ...sellerData } = seller;
    const token = makeToken({ id: seller.id, email: seller.email, role: 'seller', firstName: seller.firstName, lastName: seller.lastName });

    res.status(201).json({ success: true, message: "Account created", token, seller: sellerData });
  } catch (err) {
    console.error("sellerSignup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── SELLER LOGIN ──────────────────────────────────────────────────────────────
async function sellerLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller) return res.status(401).json({ success: false, message: "Invalid credentials" });
    if (seller.status === "suspended") return res.status(403).json({ success: false, message: "Account suspended" });

    const valid = await bcrypt.compare(password, seller.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    await prisma.seller.update({ where: { id: seller.id }, data: { lastLoginAt: new Date() } });

    const { password: _, ...sellerData } = seller;
    const token = makeToken({ id: seller.id, email: seller.email, role: 'seller', firstName: seller.firstName, lastName: seller.lastName });

    res.json({ success: true, token, seller: sellerData });
  } catch (err) {
    console.error("sellerLogin error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    const { password: _, ...adminData } = admin;
    const token = makeToken({ id: admin.id, email: admin.email, role: 'admin', firstName: admin.name, lastName: '' });

    res.json({ success: true, token, admin: adminData });
  } catch (err) {
    console.error("adminLogin error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
async function getCurrentUser(req, res) {
  try {
    const { id, role } = req.user;
    let user = null;

    if (role === "buyer") {
      user = await prisma.buyer.findUnique({ where: { id } });
      if (user) { const { password: _, ...u } = user; user = u; }
    } else if (role === "seller") {
      user = await prisma.seller.findUnique({ where: { id } });
      if (user) { const { password: _, ...u } = user; user = u; }
    } else if (role === "admin") {
      user = await prisma.admin.findUnique({ where: { id } });
      if (user) { const { password: _, ...u } = user; user = u; }
    }

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user, role });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// ── UPLOAD AVATAR ─────────────────────────────────────────────────────────────
async function uploadAvatar(req, res) {
  try {
    const { id, role } = req.user;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    if (role === "buyer") {
      await prisma.buyer.update({ where: { id }, data: { profileImage: imagePath } });
    } else if (role === "seller") {
      await prisma.seller.update({ where: { id }, data: { profileImage: imagePath } });
    } else {
      return res.status(403).json({ success: false, message: "Admins cannot upload avatars" });
    }

    res.json({ success: true, profileImage: imagePath });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { buyerSignup, buyerLogin, sellerSignup, sellerLogin, adminLogin, getCurrentUser, uploadAvatar };
