-- AlterTable
ALTER TABLE "User" ADD COLUMN     "behaviorTrackingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentGivenAt" TIMESTAMP(3),
ADD COLUMN     "consentUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderNotificationsConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BehaviorProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mostOrderedItems" JSONB,
    "commonOrderTimes" JSONB,
    "averageOrderValue" DOUBLE PRECISION,
    "lastOrderDate" TIMESTAMP(3),
    "orderFrequencyDays" DOUBLE PRECISION,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSent" TIMESTAMP(3),
    "remindersOptOut" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorProfile_userId_key" ON "BehaviorProfile"("userId");

-- CreateIndex
CREATE INDEX "BehaviorProfile_userId_idx" ON "BehaviorProfile"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE INDEX "NotificationLog_type_idx" ON "NotificationLog"("type");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");

-- AddForeignKey
ALTER TABLE "BehaviorProfile" ADD CONSTRAINT "BehaviorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
