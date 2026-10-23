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

export default function DeviceConditionScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Apple';
  const model = route?.params?.model || '12 pro max';
  const storage = route?.params?.storage || '128 GB';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [questionsList, setQuestionsList] = useState(CONDITION_QUESTIONS);
  const [answers, setAnswers] = useState<Record<number, string>>({
    0: 'Good / Minor Scratches',
    1: 'Yes',
    2: 'Yes',
    3: 'Clean & Pristine',
  });

  useEffect(() => {
    if (brand && model) {
      getSellDeviceConfig(brand, model)
        .then(config => {
          const fetched = config?.categoryQuestions;
          if (Array.isArray(fetched) && fetched.length > 0) {
            const mapped = fetched.map((q: any, idx: number) => ({
              id: q._id || idx + 1,
              question: q.question || q.title || 'Condition question',
              options: Array.isArray(q.options)
                ? q.options.map((opt: any, oIdx: number) => ({
                    id: opt._id || oIdx + 1,
                    label: opt.label || opt.text || String(opt),
                    description: opt.description || '',
                  }))
                : [],
            }));
            if (mapped.length > 0) {
              setQuestionsList(mapped);
            }
          }
        })
        .catch(() => {});
    }
  }, [brand, model]);

  const currentQ = questionsList[currentStepIndex] || questionsList[0] || CONDITION_QUESTIONS[0];
  const isLastQuestion = currentStepIndex >= questionsList.length - 1;

  const handleSelectOption = (label: string) => {
    setAnswers(prev => ({ ...prev, [currentStepIndex]: label }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      navigation.navigate('UploadDeviceMedia', {
        brand,
        model,
        storage,
        conditionAnswers: answers,
      });
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
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
      <RefurbishedHeader showBack={false} showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Main Question Card matching Figma */}
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
                    {opt.description && (
                      <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                        {opt.description}
                      </Text>
                    )}
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
              style={[styles.navBtnFilled, { backgroundColor: colors.primary }]}>
              <View style={styles.btnRow}>
                <Text style={styles.navBtnFilledText}>
                  {isLastQuestion ? 'Proceed' : 'Next Question'}
                </Text>
                <Icon source={chevronRightBold} size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            </Squeeze>
          </View>
        </View>

        {/* Device Details Card matching Figma */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <Text style={[styles.detailsHeading, { color: colors.text }]}>Device Details</Text>
          <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Brand</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{brand}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Model</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {model} ({storage})
              </Text>
            </View>
          </View>
        </View>

        {/* Security & Guarantee Trust Card matching Figma */}
        <View
          style={[
            styles.trustCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <View style={styles.trustHeader}>
            <Icon source={shieldBold} size={20} color={colors.primary} />
            <Text style={[styles.trustTitle, { color: colors.text }]}>Device Detail</Text>
          </View>
          <Text style={[styles.trustDesc, { color: colors.textMuted }]}>
            Get paid instantly at your doorstep. We guarantee 100% data security and professional
            device assessment through the CTI platform.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  stepCaption: {
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  questionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    gap: 12,
  },
  navBtnOutline: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnOutlineText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  navBtnFilled: {
    flex: 1.3,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnFilledText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  detailsHeading: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  trustCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  trustDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
});
