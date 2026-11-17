function fromOne(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const url = value.trim();
    return /^https?:\/\//i.test(url) ? url : null;
  }
  if (Array.isArray(value)) {
    const preferred = value.find(v => v && typeof v === 'object' && v.isDefault);
    for (const entry of preferred ? [preferred, ...value] : value) {
      const url = fromOne(entry);
      if (url) return url;
    }
    return null;
  }
  if (typeof value === 'object') {
    return fromOne(value.url) || fromOne(value.uri) || fromOne(value.secure_url);
  }
  return null;
}

// Backend images come as [{ url, isDefault }], a plain url string or an object with url.
// Pass the sources in order of preference; the first real http(s) url wins.
export function pickImageUrl(...sources: any[]): string | null {
  for (const source of sources) {
    const url = fromOne(source);
    if (url) return url;
  }
  return null;
}
