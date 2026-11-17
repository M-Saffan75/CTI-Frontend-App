import i18n from '@/i18n';
// Copied from the web (CategoryInfoSections.jsx) without the images
export const GRADE_TABS = ["Superb","Good","Fair","Best Value"] as const;

export type DeviceType = 'phone' | 'laptop' | 'tablet';

export const GRADE_DATA: Record<DeviceType, Record<string, { overall: string; checks: { label: string; desc: string }[] }>> = {
  "phone": {
    "Superb": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.noDefects'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screenGlass'); },
          get "desc"() { return i18n.t('customer.minimalScratchesOnlyVisibleWhen'); }
        },
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.brightSharpPanelWithNo'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.lightCosmeticWearOnlyWith'); }
        }
      ]
    },
    "Good": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.reliable'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screenGlass'); },
          get "desc"() { return i18n.t('customer.lightScratchesVisibleWhenThe'); }
        },
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.perfectlyWorkingPanelWithNo'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.normalSignsOfUseWith'); }
        }
      ]
    },
    "Fair": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.allWorking'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screen'); },
          get "desc"() { return i18n.t('customer.noticeableScratchesArePresentBut'); }
        },
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.functionalAndReadableWithAcceptable'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.visibleWearWithScratchesDents'); }
        }
      ]
    },
    "Best Value": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.visibleWear'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screen'); },
          get "desc"() { return i18n.t('customer.visibleMarksButStillTouch'); }
        },
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.worksCorrectlyWithMinorCosmetic'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.heavyCosmeticWearButStill'); }
        }
      ]
    }
  },
  "laptop": {
    "Superb": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.noDefects'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.cleanScreenWithNoDead'); }
        },
        {
          get "label"() { return i18n.t('customer.keyboard'); },
          get "desc"() { return i18n.t('customer.responsiveKeysWithNoFaded'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.minimalCosmeticWearWithA'); }
        }
      ]
    },
    "Good": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.fullyFunctional'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.minorMarksOnlyVisibleOn'); }
        },
        {
          get "label"() { return i18n.t('customer.keyboard'); },
          get "desc"() { return i18n.t('customer.allKeysWorkCorrectlyWith'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.smallScratchesAndModerateSigns'); }
        }
      ]
    },
    "Fair": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.allWorking'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.visibleMarksButStillUsable'); }
        },
        {
          get "label"() { return i18n.t('customer.keyboard'); },
          get "desc"() { return i18n.t('customer.visibleKeyWearButFull'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.noticeableScratchesAndDentsOn'); }
        }
      ]
    },
    "Best Value": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.visibleWear'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.display'); },
          get "desc"() { return i18n.t('customer.stillWorksWellWithCosmetic'); }
        },
        {
          get "label"() { return i18n.t('customer.keyboard'); },
          get "desc"() { return i18n.t('customer.heavyUseButStillOperational'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.heavyCosmeticWearButUseful'); }
        }
      ]
    }
  },
  "tablet": {
    "Superb": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.noDefects'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screen'); },
          get "desc"() { return i18n.t('customer.cleanDisplayWithNoMajor'); }
        },
        {
          get "label"() { return i18n.t('customer.touch'); },
          get "desc"() { return i18n.t('customer.responsiveTouchAcrossTheFull'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.veryLightCosmeticWearAnd'); }
        }
      ]
    },
    "Good": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.fullyFunctional'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screen'); },
          get "desc"() { return i18n.t('customer.lightMarksVisibleOnlyIn'); }
        },
        {
          get "label"() { return i18n.t('customer.touch'); },
          get "desc"() { return i18n.t('customer.strongResponseWithNoMajor'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.minorScuffsOnTheEdges'); }
        }
      ]
    },
    "Fair": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.allWorking'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screen'); },
          get "desc"() { return i18n.t('customer.noticeableMarksButStillComfortable'); }
        },
        {
          get "label"() { return i18n.t('customer.touch'); },
          get "desc"() { return i18n.t('customer.touchRemainsFunctionalWithNormal'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.visibleSignsOfUseOn'); }
        }
      ]
    },
    "Best Value": {
      get "overall"() { return i18n.t('customerMsg.gradeOverall.visibleWear'); },
      "checks": [
        {
          get "label"() { return i18n.t('customer.screen'); },
          get "desc"() { return i18n.t('customer.visibleScruffsButStillVery'); }
        },
        {
          get "label"() { return i18n.t('customer.touch'); },
          get "desc"() { return i18n.t('customer.theScreenRespondsWellFor'); }
        },
        {
          get "label"() { return i18n.t('customer.body'); },
          get "desc"() { return i18n.t('customer.strongCosmeticWearButFully'); }
        }
      ]
    }
  }
};

export function detectDeviceType(categorySlug?: string, categoryName?: string): DeviceType {
  const slug = (categorySlug || '').toLowerCase();
  const name = (categoryName || '').toLowerCase();
  if (slug.includes('phone') || slug.includes('mobile') || slug.includes('cell') || name.includes('phone') || name.includes('mobile')) return 'phone';
  if (slug.includes('laptop') || slug.includes('notebook') || name.includes('laptop') || name.includes('notebook')) return 'laptop';
  if (slug.includes('tablet') || slug.includes('ipad') || name.includes('tablet')) return 'tablet';
  return 'phone';
}
