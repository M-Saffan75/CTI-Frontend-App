/**
 * Demo data for the two job-detail screens. Only one record each for now —
 * once the API exists, the screens will fetch by the job id passed through
 * navigation instead of reading these fixed objects.
 */

export const JOB_DETAIL = {
  title: 'Redmi Note 12 (green) - Panel',
  chips: ['Offer Recived', 'Medium priority', 'Job posting'],
  priceLabel: 'TRY 45 - 50,000',
  urgencyNote: 'Express in expired',
  description:
    'Screen flickers intermittently and the display panel shows faint discoloration near the top edge. Panel replacement requested to restore normal display quality. The device otherwise powers on normally and the touch response is unaffected, so the issue looks isolated to the panel itself.',
  services: ['Panel'],
  locationNote:
    "Repair drop-off available at the customer's preferred branch, with pickup also possible on request within the local service area.",
  locationLabel: 'Latifabad no 7',
  servicePreference: 'Drop - off',
  stats: [
    { label: 'Max offer', value: '10' },
    { label: 'Current offer', value: '1' },
    { label: 'View Count', value: '0' },
    { label: 'Auto select Best', value: '0' },
  ],
  createdAt: '6/29/2026',
};

export const DISPUTE_DETAIL = {
  title: 'SAMSUNG samsung a 73 Mobile Repairing',
  price: 'TRY 4,533',
  status: 'Quatation Accepted',
  description: 'This is the end',
  services: ['Panel', 'Bettery', 'Mother Board'],
  pricing: [
    { label: 'Base Price', value: 'TRY 4,533' },
    { label: 'Parts Price', value: 'TRY 0' },
    { label: 'Services Charger', value: 'TRY N/A' },
  ],
  totalAmount: 'TRY 4,533',
  serviceDetails: [
    { label: 'Services types', value: 'TRY 4,533' },
    { label: 'Astimated duration', value: 'TRY 0' },
    { label: 'Parts quiltity', value: 'TRY N/A' },
  ],
  warranty: { duration: '365 days', details: '365' },
  repairmanNotes: 'No Additional notes here',
  quotationSent: '3/1/2026',
  accepted: '3/1/2026',
};
