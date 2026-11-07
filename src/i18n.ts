// The site's languages. English lives at the root, the others under /fa/, /zh/ and /ru/.
import { en } from './strings';

export const LANGS = ['en', 'fa', 'zh', 'ru'] as const;
export type Lang = (typeof LANGS)[number];
export const HTML_LANG: Record<Lang, string> = { en: 'en', fa: 'fa', zh: 'zh-Hans', ru: 'ru' };
export const LANG_NAME: Record<Lang, string> = { en: 'English', fa: 'فارسی', zh: '简体中文', ru: 'Русский' };

export const langOf = (path: string): Lang => LANGS.find((l) => l !== 'en' && path.startsWith(`/${l}/`)) ?? 'en';
export const unlocalized = (path: string) => path.replace(/^\/(fa|zh|ru)\//, '/');
export const localize = (lang: Lang, path: string) => (lang === 'en' ? path : `/${lang}${path}`);

// Loaded on demand, so a visitor's browser only downloads its own language.
export async function strings(lang: Lang): Promise<typeof en> {
  if (lang === 'fa') return (await import('./strings.fa')).fa;
  if (lang === 'zh') return (await import('./strings.zh')).zh;
  if (lang === 'ru') return (await import('./strings.ru')).ru;
  return en;
}
