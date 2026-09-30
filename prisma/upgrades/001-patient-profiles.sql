-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "patientId" INTEGER;

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "email" TEXT,
    "dateOfBirth" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientVisit" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "appointmentId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "patientName" TEXT NOT NULL,
    "patientTel" TEXT NOT NULL,
    "notes" TEXT,
    "serviceName" TEXT,
    "chargedAmount" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientPayment" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_scopeKey_normalizedPhone_idx" ON "Patient"("scopeKey", "normalizedPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_scopeKey_normalizedName_normalizedPhone_key" ON "Patient"("scopeKey", "normalizedName", "normalizedPhone");

-- CreateIndex
CREATE UNIQUE INDEX "PatientVisit_appointmentId_key" ON "PatientVisit"("appointmentId");

-- CreateIndex
CREATE INDEX "PatientVisit_patientId_date_idx" ON "PatientVisit"("patientId", "date");

-- CreateIndex
CREATE INDEX "PatientVisit_resourceId_date_idx" ON "PatientVisit"("resourceId", "date");

-- CreateIndex
CREATE INDEX "PatientPayment_visitId_paidAt_idx" ON "PatientPayment"("visitId", "paidAt");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientVisit" ADD CONSTRAINT "PatientVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientVisit" ADD CONSTRAINT "PatientVisit_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientVisit" ADD CONSTRAINT "PatientVisit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientPayment" ADD CONSTRAINT "PatientPayment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "PatientVisit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Explicitly unknown amounts remain NULL; recorded money cannot be negative.
ALTER TABLE "PatientVisit" ADD CONSTRAINT "PatientVisit_chargedAmount_nonnegative" CHECK ("chargedAmount" IS NULL OR "chargedAmount" >= 0);
ALTER TABLE "PatientPayment" ADD CONSTRAINT "PatientPayment_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "PatientVisit" ADD CONSTRAINT "PatientVisit_status_valid" CHECK ("status" IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));
