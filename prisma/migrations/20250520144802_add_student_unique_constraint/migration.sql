/*
  Warnings:

  - A unique constraint covering the columns `[firstName,lastName,class]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_firstName_lastName_class_key" ON "Student"("firstName", "lastName", "class");
