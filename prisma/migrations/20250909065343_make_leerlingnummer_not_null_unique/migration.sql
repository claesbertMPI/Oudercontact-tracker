/*
  Warnings:

  - A unique constraint covering the columns `[leerlingnummer]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Made the column `leerlingnummer` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "leerlingnummer" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_leerlingnummer_key" ON "Student"("leerlingnummer");
