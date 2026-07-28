-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER', 'ANALYST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VIEWER';
