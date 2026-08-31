const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const disputeConfig = require('../config/disputeConfig');
const { processTimeoutSettlement } = require('../services/settlementService');

/**
 * Sweeps for CHALLENGE_PHASE disputes where the most recent AI_REPORT is older than the timeout window.
 * Runs every 15 minutes via node-cron.
 */
async function sweepExpiredDisputes() {
  try {
    const now = new Date();

    // Query CHALLENGE_PHASE disputes and include their most recent AI_REPORT event
    const disputes = await prisma.deedDispute.findMany({
      where: {
        status: 'CHALLENGE_PHASE'
      },
      include: {
        deed: true,
        events: {
          where: { type: 'AI_REPORT' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    for (const dispute of disputes) {
      try {
        const latestAiReport = dispute.events[0];
        if (!latestAiReport) continue;

        const totalAiReports = await prisma.disputeEvent.count({
          where: { deedDisputeId: dispute.id, type: 'AI_REPORT' }
        });

        let readyToSettle = false;
        let shouldTriggerReAnalysis = false;
        
        if (totalAiReports >= 2) {
          // Verdict 2 is complete. Challenge phase is permanently over. Auto-settle immediately.
          readyToSettle = true;
        } else {
          // Only Verdict 1 exists. Check if the 24h challenge window has passed.
          const reportAgeHours = (now.getTime() - new Date(latestAiReport.createdAt).getTime()) / (1000 * 60 * 60);
          
          if (reportAgeHours > disputeConfig.CHALLENGE_WINDOW_HOURS) {
            const challengeCount = await prisma.disputeEvent.count({
              where: { deedDisputeId: dispute.id, type: 'CHALLENGE' }
            });
            
            if (challengeCount === 0) {
              // No one challenged. Settle based on Verdict 1.
              readyToSettle = true;
            } else if (challengeCount === 1) {
              // 24h passed, only 1 party challenged. The other party forfeited their right to counter-challenge.
              // Trigger Verdict 2 based on the single challenge.
              shouldTriggerReAnalysis = true;
            }
          }
        }

        if (shouldTriggerReAnalysis) {
          console.log(`[DisputeTimeout Cron] 24h elapsed for ${dispute.id} with 1 challenge. Triggering AI Re-Analysis (Verdict 2)...`);
          const { generateAIReport } = require('../services/disputeAI');
          
          // Mark status as 'ESCALATED' temporarily? No, leave in CHALLENGE_PHASE so it gets swept next time.
          generateAIReport(dispute.id).catch(err => console.error("AI Re-Analysis Error from Cron:", err));
        } else if (readyToSettle) {
          const recommendation = latestAiReport?.payload?.recommendation;

          if (recommendation !== 'REFUND_BUYER' && recommendation !== 'RELEASE_TO_SELLER') {
            const updated = await prisma.deedDispute.updateMany({
              where: { id: dispute.id, status: 'CHALLENGE_PHASE' },
              data: { status: 'ESCALATED', lastActivity: now }
            });
            
            if (updated.count === 1) {
              console.log(`[DisputeTimeout Cron] Ready to settle, but recommendation was ${recommendation}. Escalating...`);
              await prisma.disputeEvent.create({
                data: {
                  deedDisputeId: dispute.id,
                  type: 'ESCALATED',
                  actorRole: 'system-cron',
                  payload: { 
                    reason: 'Auto-settlement condition reached, but AI recommendation was MANUAL_REVIEW_REQUIRED (or missing/unparseable) — routing to human review instead of auto-resolving.' 
                  }
                }
              });
            }
          } else {
            // Valid Recommendation - process the auto-settlement
            await processTimeoutSettlement({
              dispute,
              deed: dispute.deed,
              recommendation,
              triggerSource: 'system-cron'
            });
          }
        }
      } catch (innerErr) {
        console.error(`[DisputeTimeout Cron] Failed to process dispute ${dispute.id}:`, innerErr);
      }
    }
  } catch (err) {
    console.error('[DisputeTimeout Cron] Error checking for expired disputes:', err);
  }
}

/**
 * Start the cron job. Called once from server.js on startup.
 */
function startDisputeTimeoutCron() {
  // Run immediately on startup
  sweepExpiredDisputes();

  // Then schedule every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    sweepExpiredDisputes();
  });

  console.log('[DisputeTimeout Cron] Cron job started — checking every 15 minutes');
}

module.exports = { startDisputeTimeoutCron, sweepExpiredDisputes };
