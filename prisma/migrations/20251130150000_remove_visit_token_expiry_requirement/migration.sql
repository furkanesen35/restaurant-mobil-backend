-- Make expiresAt optional and simplify related indexes
ALTER TABLE "VisitToken"
ALTER COLUMN "expiresAt" DROP NOT NULL;

DROP INDEX IF EXISTS "VisitToken_isActive_expiresAt_idx";
CREATE INDEX IF NOT EXISTS "VisitToken_isActive_idx" ON "VisitToken"("isActive");
