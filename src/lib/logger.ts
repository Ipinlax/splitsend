// =============================================================================
// SplitSend Logger
//
// Security logging for important events:
//   - Authentication events
//   - Payment initialization and verification
//   - Match creation and contact reveals
//   - Admin actions
//   - Security-sensitive errors
//
// SECURITY: Never log sensitive fields (passwords, full contact details, etc.)
// =============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info") as LogLevel;

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

function formatLog(
  level: LogLevel,
  event: string,
  meta?: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString();
  const sanitized = meta ? sanitizeMeta(meta) : {};
  return JSON.stringify({ timestamp, level, event, ...sanitized });
}

/** Remove sensitive fields before logging */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const REDACTED_KEYS = [
    "password", "token", "secret", "whatsapp", "phone",
    "email", "full_name", "access_code", "authorization",
  ];
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const isRedacted = REDACTED_KEYS.some((k) => key.toLowerCase().includes(k));
    result[key] = isRedacted ? "[REDACTED]" : value;
  }
  return result;
}

export const logger = {
  debug(event: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) console.debug(formatLog("debug", event, meta));
  },
  info(event: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) console.log(formatLog("info", event, meta));
  },
  warn(event: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) console.warn(formatLog("warn", event, meta));
  },
  error(event: string, meta?: Record<string, unknown>) {
    if (shouldLog("error")) console.error(formatLog("error", event, meta));
  },

  // Security-specific events
  security: {
    login(userId: string, success: boolean, ip?: string) {
      logger.info("auth.login", { userId, success, ip });
    },
    logout(userId: string) {
      logger.info("auth.logout", { userId });
    },
    paymentInit(userId: string, matchId: string, reference: string) {
      logger.info("payment.init", { userId, matchId, reference });
    },
    paymentVerified(userId: string, matchId: string, reference: string, status: string) {
      logger.info("payment.verified", { userId, matchId, reference, status });
    },
    contactRevealed(matchId: string, userId: string) {
      logger.info("contact.revealed", { matchId, userId });
    },
    matchCreated(matchId: string, initiatorId: string, partnerId: string) {
      logger.info("match.created", { matchId, initiatorId, partnerId });
    },
    adminAction(adminId: string, action: string, targetId?: string) {
      logger.info("admin.action", { adminId, action, targetId });
    },
    reportSubmitted(reporterId: string, reportId: string, reason: string) {
      logger.info("report.submitted", { reporterId, reportId, reason });
    },
    rateLimited(ip: string, endpoint: string) {
      logger.warn("rate.limited", { ip, endpoint });
    },
    unauthorizedAccess(userId: string | null, resource: string) {
      logger.warn("access.unauthorized", { userId, resource });
    },
  },
};
