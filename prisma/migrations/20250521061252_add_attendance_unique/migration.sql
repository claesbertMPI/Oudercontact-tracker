/*
  Warnings:

  - A unique constraint covering the columns `[studentId,oudercontactId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_oudercontactId_key" ON "Attendance"("studentId", "oudercontactId");
