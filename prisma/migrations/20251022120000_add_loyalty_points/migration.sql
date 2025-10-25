-- Add loyaltyPoints column to User table for tracking customer rewards
ALTER TABLE "User" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
