import { eventBus, logger } from "@veap/kernel";
import { User } from "../models/User.js";

/**
 * Checks if the system is installed.
 * A system is considered installed if at least one user exists in the database.
 * This function also has a side-effect: it publishes the 'system:not-installed' event
 * if it detects the system is not installed.
 */
export async function isSystemInstalled(): Promise<boolean> {
  try {
    const res = await User.query().count();
    let count = 0;
    if (Array.isArray(res) && res.length > 0) {
      const first = res[0];
      const rawVal =
        typeof first === "object" && first !== null
          ? Object.values(first)[0]
          : first;
      count = Number(rawVal) || 0;
    } else if (typeof res === "number") {
      count = res;
    }

    if (count === 0) {
      logger.debug("veap:setup", "System not installed. Publishing event.");
      await eventBus.publish("system:not-installed", { timestamp: Date.now() });
    }

    return count > 0;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      // Re-throw redirect errors to let Next.js handle them
      throw error;
    }

    // This typically happens on the very first run when the users table doesn't exist yet.
    logger.debug(
      "veap:setup",
      "isSystemInstalled check failed (most likely table does not exist)",
      error.message,
    );

    // If an error occurs (e.g., table not found), assume not installed and publish the event.
    await eventBus.publish("system:not-installed", { timestamp: Date.now() });
    return false;
  }
}
