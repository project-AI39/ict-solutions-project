-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "joinedEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "postedEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
