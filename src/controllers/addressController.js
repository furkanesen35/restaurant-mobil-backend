const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Create Address
exports.createAddress = async (req, res) => {
  try {
    const { label, street, city, postalCode, country, phone } = req.body;
    console.log("[DEBUG] req.user:", req.user);
    const userId = req.user.userId;
    const address = await prisma.address.create({
      data: {
        label,
        street,
        city,
        postalCode,
        country,
        phone,
        user: { connect: { id: userId } },
      },
    });
    res.status(201).json(address);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all addresses for user
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const addresses = await prisma.address.findMany({ where: { userId } });
    res.json(addresses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, street, city, postalCode, country, phone } = req.body;
    const address = await prisma.address.update({
      where: { id: parseInt(id) },
      data: { label, street, city, postalCode, country, phone },
    });
    res.json(address);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
