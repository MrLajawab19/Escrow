/**
 * Configuration for the Dispute Engine and Arbitration logic.
 */
module.exports = {
  // Value threshold triggering mandatory human review (bypassing AI resolution)
  HIGH_VALUE_THRESHOLD_USD: 100,
  HIGH_VALUE_THRESHOLD_INR: 10000,
  
  // The minimum confidence score (0-100) the AI must have in its report. 
  // If lower, dispute automatically escalates to a human.
  AI_MIN_CONFIDENCE: 70,

  // Windows in hours
  EVIDENCE_WINDOW_HOURS: 24,
  EVIDENCE_LATE_WINDOW_HOURS: 48,
  CHALLENGE_WINDOW_HOURS: 48,
};
