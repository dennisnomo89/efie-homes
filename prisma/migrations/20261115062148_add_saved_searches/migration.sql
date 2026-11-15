-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedSearch_emailAlerts_idx" ON "SavedSearch"("emailAlerts");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_userId_query_key" ON "SavedSearch"("userId", "query");

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
