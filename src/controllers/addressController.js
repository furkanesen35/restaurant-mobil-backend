const { PrismaClient } = require("../generated/prisma");
const logger = require('../utils/logger');
const prisma = new PrismaClient();

// Create Address
exports.createAddress = async (req, res) => {
  try {
    const {
      label,
      street,
      city,
      postalCode,
      phone,
      saveToProfile = true,
    } = req.body;
    logger.info("[DEBUG] req.user:", req.user);
    logger.info("[DEBUG] saveToProfile:", saveToProfile);
    const userId = req.user.userId;

    const normalizedPostalCode = (postalCode || "").trim();
    if (!normalizedPostalCode) {
      return res.status(400).json({ error: "Postal code is required" });
    }

    const allowedPostalCode = await prisma.allowedPostalCode.findFirst({
      where: { postalCode: normalizedPostalCode, isActive: true },
    });

    if (!allowedPostalCode) {
      return res
        .status(422)
        .json({ error: "Address is outside current delivery area" });
    }

    // Create the address
    const address = await prisma.address.create({
      data: {
        label,
        street,
        city,
        postalCode: normalizedPostalCode,
        phone,
        temporary: !saveToProfile, // Mark as temporary if not saving to profile
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
    // Only return non-temporary addresses (saved to profile)
    const addresses = await prisma.address.findMany({
      where: {
        userId,
        temporary: false, // Only get saved addresses
      },
    });
    res.json(addresses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, street, city, postalCode, phone } = req.body;

    let normalizedPostalCode;
    if (postalCode !== undefined) {
      normalizedPostalCode = (postalCode || "").trim();
      if (!normalizedPostalCode) {
        return res.status(400).json({ error: "Postal code is required" });
      }

      const allowedPostalCode = await prisma.allowedPostalCode.findFirst({
        where: { postalCode: normalizedPostalCode, isActive: true },
      });

      if (!allowedPostalCode) {
        return res
          .status(422)
          .json({ error: "Address is outside current delivery area" });
      }
    }

    const address = await prisma.address.update({
      where: { id: parseInt(id) },
      data: {
        label,
        street,
        city,
        postalCode:
          normalizedPostalCode !== undefined ? normalizedPostalCode : undefined,
        phone,
      },
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

