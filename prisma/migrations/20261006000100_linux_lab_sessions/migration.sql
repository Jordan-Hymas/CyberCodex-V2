CREATE TABLE "LinuxLabSession" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL,
 "exerciseId" TEXT NOT NULL,
 "state" TEXT NOT NULL,
 "flagHash" TEXT NOT NULL,
 "version" INTEGER NOT NULL DEFAULT 0,
 "attempts" INTEGER NOT NULL DEFAULT 0,
 "solvedAt" DATETIME,
 "nextAttemptAt" DATETIME,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" DATETIME NOT NULL,
 CONSTRAINT "LinuxLabSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LinuxLabSession_userId_exerciseId_key" ON "LinuxLabSession"("userId", "exerciseId");
CREATE INDEX "LinuxLabSession_userId_idx" ON "LinuxLabSession"("userId");
