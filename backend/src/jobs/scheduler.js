import { syncMeetingStatuses } from "../modules/meetings/meeting.service.js";
import { markNoShows } from "../modules/visits/visit.service.js";
import { expireOverduePasses } from "../modules/visitorPasses/visitorPass.service.js";
import { logger } from "../utils/logger.js";

const INTERVAL_MS = 60 * 1000;
let timer = null;

/** Periodic housekeeping: meeting statuses, no-show visits and expired passes. */
export async function runHousekeeping() {
  try {
    const [, noShows, expiredPasses] = await Promise.all([
      syncMeetingStatuses(),
      markNoShows(),
      expireOverduePasses(),
    ]);
    if (noShows || expiredPasses) {
      logger.info(
        `Housekeeping: ${noShows} no-show visit(s), ${expiredPasses} expired pass(es)`,
      );
    }
  } catch (err) {
    logger.error(`Housekeeping failed: ${err.message}`);
  }
}

export function startScheduler() {
  if (timer) return;
  runHousekeeping();
  timer = setInterval(runHousekeeping, INTERVAL_MS);
  timer.unref();
}

export function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
