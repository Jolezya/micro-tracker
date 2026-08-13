// =============================================================================
//  SOURCES & CLASSIFICATION
// -----------------------------------------------------------------------------
//  Every ingested result carries a Source and a result CLASS. The class controls
//  whether the result is trusted enough to feed the model by default. The
//  platform NEVER treats a media report or manual entry as equivalent to an
//  official ECZ result — the distinction is preserved everywhere.
// =============================================================================

export const SOURCES = [
  {
    id: 'ECZ', name: 'Electoral Commission of Zambia', type: 'official',
    tier: 1, description: 'Official constituency/polling-station returns.'
  },
  {
    id: 'ECZ-PS', name: 'ECZ Polling-Station Portal', type: 'official',
    tier: 1, description: 'Official polling-station-level results where published.'
  },
  {
    id: 'NEWS-REUTERS', name: 'Reuters (news desk)', type: 'media',
    tier: 2, description: 'Reputable news organisation — independent tabulation.'
  },
  {
    id: 'NEWS-LOCAL', name: 'National broadcaster', type: 'media',
    tier: 2, description: 'National media collation of returns.'
  },
  {
    id: 'CSV', name: 'CSV / Excel upload', type: 'upload',
    tier: 3, description: 'Structured bulk upload — must be verified before inclusion.'
  },
  {
    id: 'MANUAL', name: 'Manual entry (analyst desk)', type: 'manual',
    tier: 3, description: 'Hand-entered by an authorised analyst.'
  },
  {
    id: 'SOCIAL', name: 'Unverified report (social/field)', type: 'unverified',
    tier: 4, description: 'Unverified field/social report — never auto-trusted.'
  }
];

export const sourceById = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

/**
 * Result classes — the five categories the platform keeps strictly separate.
 * Ingested results are one of: official | verified | unverified.
 * `model` and `projected` are ENGINE OUTPUTS, never ingested data, and are only
 * used as labels for computed figures.
 */
export const RESULT_CLASS = {
  official: { id: 'official', label: 'Officially reported', color: '#2dd4a7', trusted: true },
  verified: { id: 'verified', label: 'Verified / independent', color: '#5eb3ff', trusted: true },
  unverified: { id: 'unverified', label: 'Unverified report', color: '#f5b301', trusted: false },
  model: { id: 'model', label: 'Model estimate', color: '#b78cff', trusted: false },
  projected: { id: 'projected', label: 'Projected result', color: '#ff8f5e', trusted: false }
};

/** Default class implied by a source type. */
export function defaultClassForSource(sourceId) {
  const s = sourceById[sourceId];
  if (!s) return 'unverified';
  if (s.type === 'official') return 'official';
  if (s.type === 'media') return 'verified';
  return 'unverified';
}

// Pipeline stages for the audit trail:
// Source -> received -> validated -> verified -> included (or flagged / rejected)
export const PIPELINE_STAGES = ['received', 'validated', 'verified', 'included'];
