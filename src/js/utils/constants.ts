export const SUPPORTED_ORGS = {
  Scratch: 'Scratch' as const,
  Persistent: 'Persistent' as const,
  Both: 'Both' as const,
};

export type SupportedOrgs = 'Persistent' | 'Scratch' | 'Both';
