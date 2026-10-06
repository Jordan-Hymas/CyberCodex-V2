-- Index used by pruneLabSessions() to find idle Linux lab environments
CREATE INDEX "LinuxLabSession_updatedAt_idx" ON "LinuxLabSession"("updatedAt");
