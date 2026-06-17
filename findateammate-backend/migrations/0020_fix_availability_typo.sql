-- Fix column name typo: availablility -> availability
ALTER TABLE "posts"
RENAME COLUMN "availablility" TO "availability";
