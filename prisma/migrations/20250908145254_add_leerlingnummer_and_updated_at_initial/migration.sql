-- Laat deze DROP gerust staan als die index ooit bestond; met IF EXISTS is veiliger.
DROP INDEX IF EXISTS "Student_firstName_lastName_class_key";

-- BELANGRIJK: We droppen de oude tekstkolom "class" NU NOG NIET.
-- Eerst voegen we kolommen toe waarmee we kunnen backfillen.

-- Student: kolommen toevoegen op een manier die toepasbaar is met bestaande data
ALTER TABLE "Student"
    ADD COLUMN IF NOT EXISTS "classId" INTEGER,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- leerlingnummer voorlopig **nullable** houden (geen NOT NULL, geen UNIQUE)
    ADD COLUMN IF NOT EXISTS "leerlingnummer" TEXT,
    -- updatedAt meteen mét default zodat bestaande rijen een waarde krijgen
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Nieuwe Class tabel
CREATE TABLE IF NOT EXISTS "Class" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "naam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- Unieke code per klas
CREATE UNIQUE INDEX IF NOT EXISTS "Class_code_key" ON "Class"("code");

-- Handige indexen (optioneel maar oké om te laten staan)
CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE INDEX IF NOT EXISTS "Attendance_oudercontactId_idx" ON "Attendance"("oudercontactId");
CREATE INDEX IF NOT EXISTS "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");
CREATE INDEX IF NOT EXISTS "Student_classId_idx" ON "Student"("classId");

-- Nog GEEN UNIQUE op leerlingnummer in deze stap (eerst backfillen)
-- CREATE UNIQUE INDEX "Student_leerlingnummer_key" ON "Student"("leerlingnummer");

-- Foreign key voor classId
ALTER TABLE "Student"
    ADD CONSTRAINT "Student_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "Class"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
