import type enModals from '@/i18n/locales/en/modals';

const modals: typeof enModals = {
  dispute: {
    reportProblem: 'Sorun Bildir',
    category: 'Anlaşmazlık Kategorisi *',
    selectCategory: 'Kategori Seçin',
    description: 'Açıklama (5–500 karakter) *',
    placeholder: 'Sorununuzu ayrıntılı olarak açıklayın...',
    importantNotice: 'Önemli Not',
    notice1: 'Anlaşmazlık çözülene kadar bu rezervasyonun ödemesi bekletilir',
    notice2: 'Ekibimiz durumunuzu 24–48 saat içinde inceleyecek',
    notice3: 'Her iki tarafa da anlaşmazlık durumu bildirilecek',
    notice4: 'Asılsız anlaşmazlıklar hesap yaptırımlarına yol açabilir',
    submit: 'Anlaşmazlık Gönder',
    submitting: 'Gönderiliyor...',
    categories: {
      payment_issue: 'Ödeme Sorunu',
      quality_of_work: 'İş Kalitesi',
      service_not_provided: 'Hizmet Verilmedi',
      damaged_property: 'Hasarlı Eşya',
      unprofessional_behavior: 'Profesyonelce Olmayan Davranış',
      cancellation_issue: 'İptal Sorunu',
      other: 'Diğer',
      unfair_rating: 'Haksız Puan',
      late_payment: 'Geç Ödeme',
      rude_behavior: 'Kaba Davranış',
      cancellation_after_arrival: 'Varış Sonrası İptal',
      fake_request: 'Sahte Talep',
    },
  },
  reviewModal: {
    title: 'Değerlendirme Yaz',
    overall: 'Genel Puan *',
    terrible: 'Çok Kötü',
    bad: 'Kötü',
    okay: 'Orta',
    good: 'İyi',
    excellent: 'Mükemmel',
    yourReview: 'Değerlendirmeniz (en fazla 500 karakter) *',
    placeholder: 'Bu teknisyen ve onarım hizmetiyle ilgili deneyiminizi paylaşın...',
    submit: 'Değerlendirmeyi Gönder',
    submitting: 'Gönderiliyor...',
  },
};

export default modals;
