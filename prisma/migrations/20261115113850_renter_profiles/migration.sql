-- CreateTable
CREATE TABLE "RenterProfile" (
    "userId" TEXT NOT NULL,
    "occupation" TEXT,
    "householdSize" INTEGER,
    "moveInFrom" DATE,
    "about" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenterProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "RenterProfile" ADD CONSTRAINT "RenterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
