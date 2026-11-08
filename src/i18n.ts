// The site's languages. English lives at the root and translations live under their language code.
import { en } from './strings';

export const LANGS = ['en', 'fa', 'zh', 'zh-Hant', 'ru', 'de'] as const;
export type Lang = (typeof LANGS)[number];
export const HTML_LANG: Record<Lang, string> = {
  en: 'en', fa: 'fa', zh: 'zh-Hans', 'zh-Hant': 'zh-Hant', ru: 'ru', de: 'de',
};
export const LANG_NAME: Record<Lang, string> = {
  en: 'English', fa: 'فارسی', zh: '简体中文', 'zh-Hant': '繁體中文', ru: 'Русский', de: 'Deutsch',
};

export const langOf = (path: string): Lang => LANGS.find((l) => l !== 'en' && path.startsWith(`/${l}/`)) ?? 'en';
const translatedPrefix = new RegExp(`^/(${LANGS.filter((lang) => lang !== 'en').join('|')})/`);
export const unlocalized = (path: string) => path.replace(translatedPrefix, '/');
export const localize = (lang: Lang, path: string) => (lang === 'en' ? path : `/${lang}${path}`);

// Loaded on demand, so a visitor's browser only downloads its own language.
export async function strings(lang: Lang): Promise<typeof en> {
  if (lang === 'fa') return (await import('./strings.fa')).fa;
  if (lang === 'zh') return (await import('./strings.zh')).zh;
  if (lang === 'zh-Hant') return (await import('./strings.zh-Hant')).zhHant;
  if (lang === 'ru') return (await import('./strings.ru')).ru;
  if (lang === 'de') return (await import('./strings.de')).de;
  return en;
}
