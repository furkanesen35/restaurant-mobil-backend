const { PrismaClient } = require("../generated/prisma");
const logger = require("../utils/logger");
const prisma = new PrismaClient();

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    return lowered === "true" || lowered === "1";
  }
  return Boolean(value);
};

// Public: list active postal codes for dropdowns
exports.getActivePostalCodes = async (_req, res) => {
  try {
    const postalCodes = await prisma.allowedPostalCode.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: "asc" },
        { postalCode: "asc" },
      ],
    });
    res.json(postalCodes);
  } catch (err) {
    logger.error("Failed to fetch active postal codes", err);
    res.status(500).json({ error: "Unable to load delivery postal codes" });
  }
};

// Admin: list all postal codes (active + inactive)
exports.getAllPostalCodes = async (_req, res) => {
  try {
    const postalCodes = await prisma.allowedPostalCode.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { postalCode: "asc" },
      ],
    });
    res.json(postalCodes);
  } catch (err) {
    logger.error("Failed to fetch postal codes for admin", err);
    res.status(500).json({ error: "Unable to load postal codes" });
  }
};

// Admin: create postal code entry
exports.createPostalCode = async (req, res) => {
  try {
    const { postalCode, city, district, radiusKm, sortOrder = 0, isActive = true } = req.body;
    if (!postalCode || !city) {
      return res.status(400).json({ error: "postalCode and city are required" });
    }

    const normalizedCode = postalCode.trim();
    const parsedRadius =
      radiusKm === undefined || radiusKm === null || radiusKm === ""
        ? null
        : Number(radiusKm);

    const parsedSortOrder = Number.isNaN(parseInt(sortOrder, 10))
      ? 0
      : parseInt(sortOrder, 10);

    const payload = {
      postalCode: normalizedCode,
      city: city.trim(),
      district: district?.trim() || null,
      radiusKm: Number.isNaN(parsedRadius) ? null : parsedRadius,
      sortOrder: parsedSortOrder,
      isActive: normalizeBoolean(isActive, true),
    };

    const created = await prisma.allowedPostalCode.create({ data: payload });
    res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Postal code already exists" });
    }
    logger.error("Failed to create postal code", err);
    res.status(500).json({ error: "Unable to create postal code" });
  }
};

// Admin: update postal code entry
exports.updatePostalCode = async (req, res) => {
  try {
    const { id } = req.params;
    const postalCodeId = parseInt(id, 10);
    if (Number.isNaN(postalCodeId)) {
      return res.status(400).json({ error: "Invalid postal code id" });
    }

    const { postalCode, city, district, radiusKm, sortOrder, isActive } = req.body;
    const data = {};

    if (postalCode) data.postalCode = postalCode.trim();
    if (city) data.city = city.trim();
    if (district !== undefined) data.district = district ? district.trim() : null;
    if (radiusKm !== undefined) {
      if (radiusKm === null || radiusKm === "") {
        data.radiusKm = null;
      } else {
        const parsedRadius = Number(radiusKm);
        data.radiusKm = Number.isNaN(parsedRadius) ? null : parsedRadius;
      }
    }
    if (sortOrder !== undefined) {
      const parsedSort = parseInt(sortOrder, 10);
      data.sortOrder = Number.isNaN(parsedSort) ? 0 : parsedSort;
    }
    if (isActive !== undefined) data.isActive = normalizeBoolean(isActive, true);

    const updated = await prisma.allowedPostalCode.update({
      where: { id: postalCodeId },
      data,
    });
    res.json(updated);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Postal code already exists" });
    }
    logger.error("Failed to update postal code", err);
    res.status(500).json({ error: "Unable to update postal code" });
  }
};

// Admin: delete postal code entry
exports.deletePostalCode = async (req, res) => {
  try {
    const { id } = req.params;
    const postalCodeId = parseInt(id, 10);
    if (Number.isNaN(postalCodeId)) {
      return res.status(400).json({ error: "Invalid postal code id" });
    }

    await prisma.allowedPostalCode.delete({ where: { id: postalCodeId } });
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to delete postal code", err);
    res.status(500).json({ error: "Unable to delete postal code" });
  }
};
