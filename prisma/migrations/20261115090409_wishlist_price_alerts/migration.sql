-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "previousRent" INTEGER,
ADD COLUMN     "rentReducedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SavedProperty" ADD COLUMN     "lastAlertAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "wishlistAlerts" BOOLEAN NOT NULL DEFAULT true;
