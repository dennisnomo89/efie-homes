-- CreateTable
CREATE TABLE "PropertyViewDay" (
    "propertyId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PropertyViewDay_pkey" PRIMARY KEY ("propertyId","day")
);

-- AddForeignKey
ALTER TABLE "PropertyViewDay" ADD CONSTRAINT "PropertyViewDay_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
