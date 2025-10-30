const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Generate secure random token code
const generateTokenCode = () => {
  const prefix = 'VISIT';
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
};

// Create new visit token (Admin only)
exports.createToken = async (req, res) => {
  try {
    const { points, expiryHours = 24, location, notes } = req.body;
    const adminId = req.user.userId;

    // Validate points
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid points value'
      });
    }

    // Generate unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateTokenCode();
      const existing = await prisma.visitToken.findUnique({
        where: { code }
      });
      if (!existing) isUnique = true;
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Create token
    const token = await prisma.visitToken.create({
      data: {
        code,
        points,
        createdById: adminId,
        expiresAt,
        restaurantLocation: location || null,
        notes: notes || null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      token: {
        id: token.id,
        code: token.code,
        points: token.points,
        qrCodeData: `restaurantapp://loyalty/redeem/${token.code}`,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        location: token.restaurantLocation,
        notes: token.notes
      }
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create token'
    });
  }
};

// Redeem visit token (Authenticated user)
exports.redeemToken = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing code',
        message: 'Bitte geben Sie einen Code ein'
      });
    }

    // Find token
    const token = await prisma.visitToken.findUnique({
      where: { code: code.toUpperCase() }
    });

    // Validate token exists
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid QR code'
      });
    }

    // Check if active
    if (!token.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Token inactive',
        message: 'This QR code has been deactivated'
      });
    }

    // Check if expired
    if (new Date() > new Date(token.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'Token expired',
        message: 'This QR code has expired'
      });
    }

    // Check if already redeemed by this user
    if (token.redeemedById === userId) {
      return res.status(400).json({
        success: false,
        error: 'Already redeemed',
        message: 'You have already redeemed this QR code'
      });
    }

    // Check if already redeemed by someone else (single-use)
    if (token.redeemedById !== null) {
      return res.status(400).json({
        success: false,
        error: 'Already redeemed',
        message: 'This QR code has already been redeemed'
      });
    }

    // Redeem token and update user points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark token as redeemed
      await tx.visitToken.update({
        where: { id: token.id },
        data: {
          redeemedById: userId,
          redeemedAt: new Date()
        }
      });

      // Update user loyalty points
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            increment: token.points
          }
        },
        select: {
          id: true,
          loyaltyPoints: true
        }
      });

      return updatedUser;
    });

    res.json({
      success: true,
      pointsAwarded: token.points,
      newBalance: result.loyaltyPoints,
      message: `${token.points} Treuepunkte erfolgreich gutgeschrieben!`
    });
  } catch (error) {
    console.error('Redeem token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redeem token',
      message: 'Fehler beim Einlösen des QR-Codes'
    });
  }
};

// List visit tokens (Admin only)
exports.listTokens = async (req, res) => {
  try {
    const { active, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (active === 'true') {
      where.isActive = true;
      where.expiresAt = {
        gt: new Date()
      };
    } else if (active === 'false') {
      where.OR = [
        { isActive: false },
        { expiresAt: { lte: new Date() } }
      ];
    }

    const [tokens, total] = await Promise.all([
      prisma.visitToken.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          redeemedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.visitToken.count({ where })
    ]);

    res.json({
      success: true,
      tokens: tokens.map(token => ({
        id: token.id,
        code: token.code,
        points: token.points,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        isActive: token.isActive,
        location: token.restaurantLocation,
        notes: token.notes,
        createdBy: token.createdBy,
        redeemedBy: token.redeemedBy,
        redeemedAt: token.redeemedAt,
        isExpired: new Date() > new Date(token.expiresAt),
        isRedeemed: token.redeemedById !== null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('List tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tokens'
    });
  }
};

// Deactivate token (Admin only)
exports.deactivateToken = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await prisma.visitToken.update({
      where: { id: parseInt(tokenId) },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: 'Token deactivated',
      token: {
        id: token.id,
        code: token.code,
        isActive: token.isActive
      }
    });
  } catch (error) {
    console.error('Deactivate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate token'
    });
  }
};

// Get token details (Admin only)
exports.getToken = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await prisma.visitToken.findUnique({
      where: { id: parseInt(tokenId) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        redeemedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    res.json({
      success: true,
      token: {
        ...token,
        qrCodeData: `restaurantapp://loyalty/redeem/${token.code}`,
        isExpired: new Date() > new Date(token.expiresAt),
        isRedeemed: token.redeemedById !== null
      }
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get token'
    });
  }
};
