/**
 * Feature flags for phased development.
 * Flip these as features become stable.
 */
export const DEV_FLAGS = {
  ENABLE_TYPING: false,
  ENABLE_PULSE: false,
  ENABLE_ADMIN: false,
  ENABLE_PRESENCE: false,
  ENABLE_OPTIMISTIC_SEND: false,
  ENABLE_GOOGLE_AUTH: false,
} as const;
