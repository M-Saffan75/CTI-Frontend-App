import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import Button from '@/components/Button';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  checkCircleBold,
  chevronLeftBold,
  chevronRightBold,
  shieldBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { CONDITION_QUESTIONS } from '../data/refurbishedData';
import { getSellDeviceConfig } from '../services/refurbishedApi';

interface ConditionOption {
  id: string | number;
  label: string;
  description?: string;
}

interface ConditionItem {
  id: string | number;
  question: string;
  options: ConditionOption[];
}

export default function DeviceConditionScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Device';
  const brandSlug = route?.params?.brandSlug || brand.toLowerCase();
  const brandId = route?.params?.brandId;
  const model = route?.params?.model || 'Device Model';
  const modelSlug =
    route?.params?.modelSlug || model.toLowerCase().replace(/\s+/g, '-');
  const modelId = route?.params?.modelId;
  const categoryId = route?.params?.categoryId;
  const categorySlug = route?.params?.categorySlug;
  const storage = route?.params?.storage;
  const selectedVariants = route?.params?.selectedVariants || [];
  const initialConfig = route?.params?.config;

  const [deviceConfig, setDeviceConfig] = useState<any>(initialConfig || null);
  const [loading, setLoading] = useState<boolean>(!initialConfig);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [questionsList, setQuestionsList] = useState<ConditionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // AlertModal State for validation
  const [modal, setModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  const isPhone = Boolean(
    categorySlug?.toLowerCase()?.includes('phone') ||
    brandSlug?.toLowerCase()?.includes('apple') ||
    brand?.toLowerCase()?.includes('iphone') ||
    model?.toLowerCase()?.includes('iphone') ||
    modelSlug?.toLowerCase()?.includes('iphone')
  );

  const mapQuestions = (fetched: any[]) => {
    return fetched.map((q: any, idx: number) => ({
      id: q._id || idx + 1,
      question: q.question || q.title || 'Condition question',
      options: Array.isArray(q.options)
        ? q.options.map((opt: any, oIdx: number) => ({
            id: opt._id || oIdx + 1,
            label: typeof opt === 'string' ? opt : (opt.label || opt.text || String(opt)),
            description: typeof opt === 'string' ? '' : (opt.description || ''),
          }))
        : [],
    }));
  };

  useEffect(() => {
    if (initialConfig?.categoryQuestions?.length > 0) {
      setQuestionsList(mapQuestions(initialConfig.categoryQuestions));
      setLoading(false);
    } else if (brandSlug && modelSlug) {
      setLoading(true);
      getSellDeviceConfig(brandSlug, modelSlug)
        .then(config => {
          if (config) {
            setDeviceConfig(config);
            if (Array.isArray(config?.categoryQuestions) && config.categoryQuestions.length > 0) {
              setQuestionsList(mapQuestions(config.categoryQuestions));
            } else if (isPhone) {
              // Fallback to default phone questions ONLY if confirmed phone category
              setQuestionsList(CONDITION_QUESTIONS as any);
            } else {
              // Non-phone device (e.g. Haier AC, Camera, Speaker) with no custom questions configured
              setQuestionsList([]);
            }
          } else if (isPhone) {
            setQuestionsList(CONDITION_QUESTIONS as any);
          } else {
            setQuestionsList([]);
          }
        })
        .catch(() => {
          if (isPhone) {
            setQuestionsList(CONDITION_QUESTIONS as any);
          } else {
            setQuestionsList([]);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (isPhone) {
        setQuestionsList(CONDITION_QUESTIONS as any);
      } else {
        setQuestionsList([]);
      }
      setLoading(false);
    }
  }, [brandSlug, modelSlug, initialConfig, isPhone]);

  const hasQuestions = questionsList.length > 0;
  const currentQ = hasQuestions ? questionsList[currentStepIndex] : null;
  const isLastQuestion = currentStepIndex >= questionsList.length - 1;

  const handleSelectOption = (label: string) => {
    setAnswers(prev => ({ ...prev, [currentStepIndex]: label }));
  };

  const handleNext = () => {
    if (!answers[currentStepIndex]) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select an option before proceeding to the next step.',
      });
      return;
    }

    if (isLastQuestion) {
      const answersMap: Record<string, string> = {};
      questionsList.forEach((q, idx) => {
        const qText = q.question || `Question ${idx + 1}`;
        if (answers[idx]) {
          answersMap[qText] = answers[idx];
        }
      });

      navigation.navigate('UploadDeviceMedia', {
        brand,
        brandSlug,
        brandId: brandId || deviceConfig?.brand?._id,
        model,
        modelSlug,
        modelId: modelId || deviceConfig?.model?._id,
        categoryId: categoryId || deviceConfig?.categoryId,
        categorySlug,
        storage,
        selectedVariants,
        conditionAnswers: answersMap,
      });
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleContinueNoQuestions = () => {
    navigation.navigate('UploadDeviceMedia', {
      brand,
      brandSlug,
      brandId: brandId || deviceConfig?.brand?._id,
      model,
      modelSlug,
      modelId: modelId || deviceConfig?.model?._id,
      categoryId: categoryId || deviceConfig?.categoryId,
      categorySlug,
      storage,
      selectedVariants,
      conditionAnswers: {},
    });
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <CtiLoader size="md" text="Loading condition criteria..." />
          </View>
        ) : !hasQuestions ? (
          /* Next.js matching state: When model does not require condition assessment */
          <FadeUp
            delay={100}
            style={[
              styles.emptyContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '66',
              },
            ]}>
            <View
              style={[
                styles.checkIconWrap,
                {
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '33',
                  borderWidth: 1,
                },
              ]}>
              <Icon source={checkCircleBold} size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyHeading, { color: colors.text }]}>
              No Condition Assessment Required
            </Text>
            <Text style={[styles.emptySubheading, { color: colors.textMuted }]}>
              This <Text style={{ fontFamily: fonts.bold, color: colors.primary }}>{model}</Text> does not require any specific condition assessment. You can proceed directly to upload device media.
            </Text>
            <Button
              title="Continue to Upload Media"
              onPress={handleContinueNoQuestions}
              style={{ marginTop: 24, width: '100%' }}
            />
          </FadeUp>
        ) : (
          /* Main Question Card */
          <View
            style={[
              styles.questionCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <Text style={[styles.stepCaption, { color: colors.primary }]}>
              QUESTION {currentStepIndex + 1} OF {questionsList.length}
            </Text>

            <Text style={[styles.questionTitle, { color: colors.text }]}>
              {currentQ?.question || ''}
            </Text>

            {/* Options List */}
            <View style={styles.optionsList}>
              {(currentQ?.options || []).map(opt => {
                const isSelected = answers?.[currentStepIndex] === opt?.label;
                return (
                  <TouchableOpacity
                    key={opt?.id}
                    onPress={() => handleSelectOption(opt?.label || '')}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected ? colors.primary + '14' : colors.surfaceAlt,
                        borderColor: isSelected ? colors.primary : colors.border + '33',
                      },
                    ]}>
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          borderColor: isSelected ? colors.primary : colors.textMuted + '66',
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}>
                      <Icon
                        source={checkCircleBold}
                        size={18}
                        color={isSelected ? '#FFFFFF' : colors.textMuted}
                      />
                    </View>
                    <View style={styles.optionTextCol}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontFamily: isSelected ? fonts.bold : fonts.medium,
                          },
                        ]}>
                        {opt.label}
                      </Text>
                      {opt.description ? (
                        <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                          {opt.description}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                onPress={handlePrevious}
                style={[
                  styles.navBtnOutline,
                  { borderColor: colors.border + '66', backgroundColor: colors.surfaceAlt },
                ]}>
                <Icon source={chevronLeftBold} size={14} color={colors.text} />
                <Text style={[styles.navBtnOutlineText, { color: colors.text }]}>Previous</Text>
              </TouchableOpacity>

              <Squeeze
                onPress={handleNext}
                disabled={!answers[currentStepIndex]}
                style={[
                  styles.navBtnFilled,
                  {
                    backgroundColor: answers[currentStepIndex] ? colors.primary : colors.textMuted + '55',
                  },
                ]}>
                <View style={styles.btnRow}>
                  <Text style={styles.navBtnFilledText}>
                    {isLastQuestion ? 'Proceed' : 'Next Question'}
                  </Text>
                  <Icon source={chevronRightBold} size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              </Squeeze>
            </View>
          </View>
        )}

        {/* Security / Trust Banner */}
        <View style={styles.trustBanner}>
          <Icon source={shieldBold} size={18} color={colors.primary} />
          <Text style={[styles.trustText, { color: colors.textMuted }]}>
            Accurate answers guarantee the highest quote and instant pickup approval.
          </Text>
        </View>
      </ScrollView>

      {/* Alert Modal for strict validation */}
      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  stepCaption: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  questionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    lineHeight: 28,
    marginBottom: 22,
  },
  optionsList: {
    gap: 12,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
  },
  optionSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  navBtnOutlineText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  navBtnFilled: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtnFilledText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  emptyContainer: {
    marginHorizontal: 8,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
  },
  checkIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyHeading: {
    fontSize: 20,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubheading: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
