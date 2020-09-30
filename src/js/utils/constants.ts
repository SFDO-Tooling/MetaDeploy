export const SUPPORTED_ORGS = {
  Scratch: 'Scratch' as const,
  Persistent: 'Persistent' as const,
  Both: 'Both' as const,
};
export type SupportedOrgs = 'Persistent' | 'Scratch' | 'Both';

export const SCRATCH_ORG_STATUSES = {
  started: 'started' as const,
  complete: 'complete' as const,
  failed: 'failed' as const,
  canceled: 'canceled' as const,
};
export type ScratchOrgStatuses = 'started' | 'complete' | 'failed' | 'canceled';
