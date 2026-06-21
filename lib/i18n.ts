'use client'

import { useSettingsStore } from '@/lib/store/settings'

export type Lang = 'en' | 'ar'

export const LANGUAGES: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
]

type Dict = Record<string, string>

const en: Dict = {
  // App / chrome
  'app.tagline': 'Local-first Kanban',
  'search.placeholder': 'Search cards…',
  'search.label': 'Search',
  'search.hint': 'Type to search cards, titles, tags, and content',
  'search.noResults': 'No results for',
  'settings.title': 'Settings',

  // Sidebar / projects
  'projects.heading': 'Projects',
  'projects.open': 'Open project…',
  'projects.openFolder': 'Open project folder',
  'projects.openAnother': 'Open another folder…',
  'projects.recent': 'Recent projects',
  'projects.opening': 'Opening…',
  'projects.hint': 'Open a folder to create or load a .kanban board',

  // Board / columns
  'column.inbox': 'Inbox',
  'column.shape': 'Shape',
  'column.ready': 'Ready',
  'column.doing': 'Doing',
  'column.review': 'Review',
  'column.done': 'Done',
  'column.killed': 'Killed',
  'board.empty': 'Empty',
  'board.newCard': 'New card',

  // Card
  'card.title': 'Card title',
  'card.status': 'Status',
  'card.priority': 'Priority',
  'card.tags': 'Tags',
  'card.type': 'Type',
  'card.save': 'Save',
  'card.saving': 'Saving…',
  'card.delete': 'Delete card',
  'card.close': 'Close',
  'card.untitled': 'Untitled',
  'card.bodyPlaceholder': 'Start writing…',
  'card.deleteConfirm': 'Delete this card?',
  'card.updated': 'Updated',

  // New card
  'newCard.title': 'New Card',
  'newCard.create': 'Create card',
  'newCard.creating': 'Creating…',
  'newCard.cancel': 'Cancel',
  'newCard.tagsLabel': 'Tags (comma separated)',

  // Types
  'type.task': 'Task',
  'type.idea': 'Idea',
  'type.bug': 'Bug',
  'type.problem': 'Problem',
  'type.decision': 'Decision',
  'type.question': 'Question',
  'type.note': 'Note',

  // Priority
  'priority.urgent': 'Urgent',
  'priority.high': 'High',
  'priority.normal': 'Normal',
  'priority.low': 'Low',

  // Settings sections
  'settings.general': 'General',
  'settings.appearance': 'Appearance',
  'settings.language': 'Language',
  'settings.shortcuts': 'Shortcuts',
  'settings.about': 'About',
  'settings.theme': 'Theme',
  'settings.uiLanguage': 'Interface language',
  'settings.defaultType': 'Default card type',
  'settings.aboutText': 'Ban v0.1.0 — Local-first Kanban',
  'settings.themeDarkSoft': 'Soft Dark',
  'settings.themeDarkOled': 'OLED Black',
  'settings.themeLightWhite': 'Clean White',
  'settings.themeLightPaper': 'Warm Paper',

  // Shortcuts
  'shortcut.capture': 'Quick Capture',
  'shortcut.palette': 'Command Palette',
  'shortcut.newCard': 'New Card',
  'shortcut.save': 'Save card',

  // Capture
  'capture.placeholder': 'Capture idea… @status #tag',
}

const ar: Dict = {
  'app.tagline': 'كانبان يعمل محليًا',
  'search.placeholder': 'ابحث في البطاقات…',
  'search.label': 'بحث',
  'search.hint': 'اكتب للبحث في البطاقات والعناوين والوسوم والمحتوى',
  'search.noResults': 'لا توجد نتائج لـ',
  'settings.title': 'الإعدادات',

  'projects.heading': 'المشاريع',
  'projects.open': 'فتح مشروع…',
  'projects.openFolder': 'افتح مجلد مشروع',
  'projects.openAnother': 'افتح مجلدًا آخر…',
  'projects.recent': 'المشاريع الأخيرة',
  'projects.opening': 'جارٍ الفتح…',
  'projects.hint': 'افتح مجلدًا لإنشاء أو تحميل لوحة kanban.',

  'column.inbox': 'الوارد',
  'column.shape': 'تشكيل',
  'column.ready': 'جاهز',
  'column.doing': 'جارٍ التنفيذ',
  'column.review': 'مراجعة',
  'column.done': 'مكتمل',
  'column.killed': 'ملغى',
  'board.empty': 'فارغ',
  'board.newCard': 'بطاقة جديدة',

  'card.title': 'عنوان البطاقة',
  'card.status': 'الحالة',
  'card.priority': 'الأولوية',
  'card.tags': 'الوسوم',
  'card.type': 'النوع',
  'card.save': 'حفظ',
  'card.saving': 'جارٍ الحفظ…',
  'card.delete': 'حذف البطاقة',
  'card.close': 'إغلاق',
  'card.untitled': 'بدون عنوان',
  'card.bodyPlaceholder': 'ابدأ الكتابة…',
  'card.deleteConfirm': 'حذف هذه البطاقة؟',
  'card.updated': 'آخر تحديث',

  'newCard.title': 'بطاقة جديدة',
  'newCard.create': 'إنشاء بطاقة',
  'newCard.creating': 'جارٍ الإنشاء…',
  'newCard.cancel': 'إلغاء',
  'newCard.tagsLabel': 'الوسوم (مفصولة بفواصل)',

  'type.task': 'مهمة',
  'type.idea': 'فكرة',
  'type.bug': 'خلل',
  'type.problem': 'مشكلة',
  'type.decision': 'قرار',
  'type.question': 'سؤال',
  'type.note': 'ملاحظة',

  'priority.urgent': 'عاجل',
  'priority.high': 'مرتفع',
  'priority.normal': 'عادي',
  'priority.low': 'منخفض',

  'settings.general': 'عام',
  'settings.appearance': 'المظهر',
  'settings.language': 'اللغة',
  'settings.shortcuts': 'الاختصارات',
  'settings.about': 'حول',
  'settings.theme': 'السمة',
  'settings.uiLanguage': 'لغة الواجهة',
  'settings.defaultType': 'نوع البطاقة الافتراضي',
  'settings.aboutText': 'Ban الإصدار 0.1.0 — كانبان يعمل محليًا',
  'settings.themeDarkSoft': 'داكن هادئ',
  'settings.themeDarkOled': 'أسود أوليد',
  'settings.themeLightWhite': 'أبيض نقي',
  'settings.themeLightPaper': 'ورقي دافئ',

  'shortcut.capture': 'الالتقاط السريع',
  'shortcut.palette': 'لوحة الأوامر',
  'shortcut.newCard': 'بطاقة جديدة',
  'shortcut.save': 'حفظ البطاقة',

  'capture.placeholder': 'التقط فكرة… status@ tag#',
}

const DICTS: Record<Lang, Dict> = { en, ar }

export function translate(lang: Lang, key: string): string {
  return DICTS[lang][key] ?? DICTS.en[key] ?? key
}

/** Hook: returns a translator bound to the current UI language. */
export function useT(): (key: string) => string {
  const lang = useSettingsStore(s => s.lang)
  return (key: string) => translate(lang, key)
}

export function useLang(): Lang {
  return useSettingsStore(s => s.lang)
}
