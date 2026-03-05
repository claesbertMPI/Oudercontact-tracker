-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "afwezig" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fysiekAanwezig" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "opvangGebruikt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telefonischOnline" BOOLEAN NOT NULL DEFAULT false;
