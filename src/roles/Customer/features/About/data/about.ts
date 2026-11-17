import i18n from '@/i18n';
export const PROMISES = [
  {
    get title() { return i18n.t('customer.fairValue'); },
    get text() { return i18n.t('customer.weGuaranteeTheMostCompetitive'); },
  },
  {
    get title() { return i18n.t('customer.sustainabilityFirst'); },
    get text() { return i18n.t('customer.everyDeviceRefurbishedSaves61kg'); },
  },
  {
    get title() { return i18n.t('customer.qualityAssured'); },
    get text() { return i18n.t('customer.rigorousTestingAndCertificationEnsure'); },
  },
  {
    get title() { return i18n.t('customer.quickAndEasy'); },
    get text() { return i18n.t('customer.doorstepPickupHassleFreeSelling'); },
  },
];

export const TIMELINE = [
  {
    year: '2019',
    get title() { return i18n.t('customer.theBeginning'); },
    get highlight() { return i18n.t('customerMsg.timelineHl.started'); },
    get stats() { return i18n.t('customerMsg.timelineStat.store'); },
    get description() { return i18n.t('customer.weFoundedOurCompanyWith'); },
  },
  {
    year: '2020',
    get title() { return i18n.t('customer.goingDigital'); },
    get highlight() { return i18n.t('customerMsg.timelineHl.app'); },
    get stats() { return i18n.t('customerMsg.timelineStat.users10k'); },
    get description() { return i18n.t('customer.launchedOurOnlinePlatformEnabling'); },
  },
  {
    year: '2021',
    get title() { return i18n.t('customer.rapidExpansion'); },
    get highlight() { return i18n.t('customerMsg.timelineHl.stores'); },
    get stats() { return i18n.t('customerMsg.timelineStat.employees'); },
    get description() { return i18n.t('customer.expandedToMultipleCitiesAcross'); },
  },
  {
    year: '2022',
    get title() { return i18n.t('customer.industryRecognition'); },
    get highlight() { return i18n.t('customerMsg.timelineHl.devices'); },
    get stats() { return i18n.t('customerMsg.timelineStat.awards'); },
    get description() { return i18n.t('customer.receivedMultipleAwardsForOur'); },
  },
  {
    year: '2023',
    get title() { return i18n.t('customer.gameChanger'); },
    get highlight() { return i18n.t('customerMsg.timelineHl.ai'); },
    get stats() { return i18n.t('customerMsg.timelineStat.cities'); },
    get description() { return i18n.t('customer.introducedAiPoweredDeviceValuation'); },
  },
  {
    year: '2024',
    get title() { return i18n.t('customer.theFutureIsNow'); },
    get highlight() { return i18n.t('customerMsg.timelineHl.users'); },
    get stats() { return i18n.t('customerMsg.timelineStat.global'); },
    get description() { return i18n.t('customer.reached1MillionActiveUsers'); },
  },
];

export const PRINCIPLES = [
  {
    number: '01',
    get title() { return i18n.t('customer.transparency'); },
    get text() { return i18n.t('customer.weBelieveInCompleteTransparency'); },
  },
  {
    number: '02',
    get title() { return i18n.t('customer.responsibility'); },
    get text() { return i18n.t('customer.weTakeResponsibilityForEvery'); },
  },
  {
    number: '03',
    get title() { return i18n.t('customer.innovation'); },
    get text() { return i18n.t('customer.constantlyInnovatingToFindNew'); },
  },
  {
    number: '04',
    get title() { return i18n.t('customer.community'); },
    get text() { return i18n.t('customer.buildingACommunityOfConscious'); },
  },
];

export const SOLUTION_STATS = [
  { value: '10K+', get label() { return i18n.t('customer.phonesReused'); } },
  { value: '9M+', get label() { return i18n.t('customer.litersWaterSaved'); } },
  { value: '720K+', get label() { return i18n.t('customer.kwhEnergySaved'); } },
];

// translation keys
export const WASTE_POINTS = ['customerMsg.impact.toxic', 'customerMsg.impact.resources', 'customerMsg.impact.future'];
