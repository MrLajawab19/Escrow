const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

class LedgerService {
  // Append one event to the hash chain — NEVER called with UPDATE or DELETE
  async appendEvent(deedId, eventType, actorRole, actorId, payload) {
    const timestamp = new Date();

    // Get last entry in this deed chain
    const lastEntry = await prisma.auditLedger.findFirst({
      where: { deedId },
      orderBy: { sequenceNumber: "desc" },
    });

    const prevEntryHash = lastEntry ? lastEntry.entryHash : "GENESIS";
    const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 1;

    const payloadStr = JSON.stringify(payload);
    const payloadHash = crypto.createHash("sha256").update(payloadStr).digest("hex");

    const entryData = `${eventType}|${actorRole}|${actorId}|${payloadHash}|${prevEntryHash}|${timestamp.toISOString()}`;
    const entryHash = crypto.createHash("sha256").update(entryData).digest("hex");

    return prisma.auditLedger.create({
      data: {
        deedId,
        eventType,
        actorRole,
        actorId,
        payloadHash,
        prevEntryHash,
        entryHash,
        sequenceNumber,
        timestamp,
        payload: payloadStr,
      },
    });
  }

  // Verify the full chain for a deed
  async verifyChain(deedId) {
    const entries = await prisma.auditLedger.findMany({
      where: { deedId },
      orderBy: { sequenceNumber: "asc" },
    });

    if (entries.length === 0) return { isValid: true, entryCount: 0 };

    let prevHash = "GENESIS";
    for (const entry of entries) {
      const payloadHash = crypto
        .createHash("sha256")
        .update(entry.payload)
        .digest("hex");

      const entryData = `${entry.eventType}|${entry.actorRole}|${entry.actorId}|${payloadHash}|${prevHash}|${entry.timestamp.toISOString()}`;
      const expectedHash = crypto.createHash("sha256").update(entryData).digest("hex");

      if (expectedHash !== entry.entryHash) {
        return {
          isValid: false,
          brokenAtSequence: entry.sequenceNumber,
          brokenAtEvent: entry.eventType,
        };
      }
      prevHash = entry.entryHash;
    }

    return { isValid: true, entryCount: entries.length };
  }

  // Public view — event types, timestamps, hashes only (no payload content)
  async getPublicLedger(deedId) {
    const entries = await prisma.auditLedger.findMany({
      where: { deedId },
      orderBy: { sequenceNumber: "asc" },
      select: {
        id: true,
        sequenceNumber: true,
        eventType: true,
        actorRole: true,
        entryHash: true,
        prevEntryHash: true,
        timestamp: true,
      },
    });
    return entries;
  }

  // Full view — for parties and admin (includes payload)
  async getFullLedger(deedId) {
    return prisma.auditLedger.findMany({
      where: { deedId },
      orderBy: { sequenceNumber: "asc" },
    });
  }
}

module.exports = new LedgerService();
