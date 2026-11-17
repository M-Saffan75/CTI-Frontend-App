import type enAppMsg from '@/i18n/locales/en/appMsg';

const appMsg: typeof enAppMsg = {
  appMsg: {
    totalAmountColon: 'Toplam Tutar:',
    loadFailed: 'Veri yüklenemedi',
    generalCategory: 'Genel',
    youPrefix: 'Siz: ',
    startChatFailed: 'Sohbet başlatılamadı',
    startChatTryAgain: 'Sohbet başlatılamıyor. Lütfen tekrar deneyin.',
    auth: {
      verifyFirst: 'Lütfen önce e-postanızı doğrulayın.',
      loginOk: 'Giriş başarılı',
      registerOk: 'Kayıt başarılı. Lütfen kodu doğrulayın.',
      codeSent: 'Doğrulama kodu e-postanıza gönderildi.',
      otpOk: 'Kod başarıyla doğrulandı',
      otpResent: 'Kod yeniden gönderildi.',
      resetOk: 'Şifre başarıyla sıfırlandı.',
      changeOk: 'Şifre başarıyla değiştirildi.',
    },
    notifPermission: {
      title: 'Bildirim İzni',
      message: 'CTI, rezervasyonlarınız, siparişleriniz ve hizmetlerinizle ilgili güncellemeleri göndermek için izne ihtiyaç duyar.',
      allow: 'İzin ver',
      deny: 'Reddet',
    },
  },
};

export default appMsg;
