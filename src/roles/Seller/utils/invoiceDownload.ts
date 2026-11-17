import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import i18n from '@/i18n';

export interface DownloadResult {
  ok: boolean;
  title: string;
  message: string;
}

function safeFileName(invoiceNumber: string): string {
  const clean = (invoiceNumber || 'invoice').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return `invoice-${clean || 'file'}.pdf`;
}

async function freeFileName(dir: string, name: string): Promise<string> {
  const base = name.replace(/\.pdf$/i, '');
  let candidate = name;
  let n = 1;
  while (await ReactNativeBlobUtil.fs.exists(`${dir}/${candidate}`)) {
    candidate = `${base}-${n}.pdf`;
    n += 1;
  }
  return candidate;
}

// Android 9 and below needs the storage permission to write into Downloads. Android 10+ does not.
async function canWriteDownloads(): Promise<boolean> {
  if (Platform.OS !== 'android' || Number(Platform.Version) >= 29) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function failure(error: unknown): DownloadResult {
  const text = String((error as any)?.message || error || '');
  if (/network|timed? ?out|unable to resolve|failed to connect|offline/i.test(text)) {
    return { ok: false, title: i18n.t('sellerAuto.noConnection'), message: i18n.t('sellerAuto.thePdfCouldNotBe') };
  }
  return {
    ok: false,
    title: i18n.t('sellerAuto.downloadFailed'),
    message: text ? i18n.t('sellerMsg.pdf.saveFailedWith', { text }) : i18n.t('sellerAuto.thePdfCouldNotBe2'),
  };
}

export async function downloadInvoicePdf(url: string, invoiceNumber: string): Promise<DownloadResult> {
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, title: i18n.t('sellerAuto.noFile'), message: i18n.t('sellerAuto.thisInvoiceHasNoPdf') };
  }
  const dirs = ReactNativeBlobUtil.fs.dirs;

  try {
    if (Platform.OS === 'android') {
      if (!(await canWriteDownloads())) {
        return {
          ok: false,
          title: i18n.t('sellerAuto.permissionNeeded'),
          message: i18n.t('sellerAuto.allowStorageAccessInThe'),
        };
      }
      const fileName = await freeFileName(dirs.DownloadDir, safeFileName(invoiceNumber));
      const path = `${dirs.DownloadDir}/${fileName}`;
      const res = await ReactNativeBlobUtil.config({
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          mediaScannable: true,
          title: fileName,
          description: i18n.t('sellerAuto.invoicePdf'),
          mime: 'application/pdf',
          path,
        },
      }).fetch('GET', url);
      const savedPath = res.path() || path;
      if (!(await ReactNativeBlobUtil.fs.exists(savedPath))) {
        return { ok: false, title: i18n.t('sellerAuto.downloadFailed'), message: i18n.t('sellerAuto.theFileWasNotFound') };
      }
      return { ok: true, title: i18n.t('sellerAuto.pdfSaved'), message: i18n.t('sellerMsg.pdf.savedLine', { name: fileName }) };
    }

    const fileName = await freeFileName(dirs.DocumentDir, safeFileName(invoiceNumber));
    const path = `${dirs.DocumentDir}/${fileName}`;
    const res = await ReactNativeBlobUtil.config({ path }).fetch('GET', url);
    const status = res.info().status;
    if (status < 200 || status >= 300) {
      await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
      return { ok: false, title: i18n.t('sellerAuto.downloadFailed'), message: i18n.t('sellerMsg.pdf.serverError', { status }) };
    }
    ReactNativeBlobUtil.ios.previewDocument(res.path());
    return { ok: true, title: i18n.t('sellerAuto.pdfDownloaded'), message: i18n.t('sellerMsg.pdf.previewLine', { name: fileName }) };
  } catch (error) {
    return failure(error);
  }
}
