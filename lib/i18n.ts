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
  'projects.hint': 'Open a folder to set it up as a Ban workspace',
  'nav.board': 'Board',
  'nav.journey': 'Journey',
  'nav.agents': 'Agents',
  'nav.plans': 'Plans',
  'nav.files': 'Files',
  'nav.skills': 'Skills',

  // Agents (rules projection)
  'agents.title': 'Agents',
  'agents.subtitle': 'Pick the AI agents you use. Ban writes one set of rules and projects it into each agent’s native config file, so every agent reads the same source of truth.',
  'agents.yourAgents': 'Your agents',
  'agents.viaImport': 'via import',
  'agents.viaInline': 'inline',
  'agents.rulesTitle': 'Project rules',
  'agents.rulesHint': 'These rules are the single source. Each selected agent’s config file points back here (imported or inlined). Your own edits outside Ban’s managed block are never touched.',
  'agents.rulesPlaceholder': 'Write the rules every agent should follow…',
  'agents.saveRules': 'Save & project',
  'agents.saving': 'Saving…',
  'agents.loading': 'Loading agents…',
  'agents.noneSelected': 'No agents selected yet — pick at least one above to project these rules.',

  // Plans
  'plans.title': 'Plans',
  'plans.new': 'New plan',
  'plans.empty': 'No plans yet.',
  'plans.untitled': 'Untitled plan',
  'plans.delete': 'Delete plan',
  'plans.placeholder': 'Outline the plan…',

  // Files (universal explorer)
  'files.title': 'Files',
  'files.pick': 'Select a file to view or edit.',
  'files.emptyDir': 'empty',
  'files.binary': 'Binary file — not editable here.',
  'files.tooLarge': 'File is too large to open inline.',
  'files.placeholder': 'Empty file…',
  'files.saved': 'Saved',

  // Skills
  'skills.title': 'Skills',
  'skills.new': 'New skill',
  'skills.empty': 'No skills yet.',
  'skills.untitled': 'New skill',
  'skills.delete': 'Delete skill',
  'skills.intro': 'Install reusable skills as files. Ban lists them in every agent’s config so any agent can discover and use them.',
  'skills.namePlaceholder': 'Skill name',
  'skills.descPlaceholder': 'One-line description — when should an agent use this?',
  'skills.bodyPlaceholder': 'Describe the skill…',

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

  // Journey
  'journey.title': 'Journey',
  'journey.subtitle': 'Replay the life of this project inside Ban.',
  'journey.range': 'Range',
  'journey.today': 'Today',
  'journey.week': 'Week',
  'journey.month': 'Month',
  'journey.custom': 'Custom',
  'journey.all': 'All',
  'journey.from': 'From',
  'journey.to': 'To',
  'journey.mode': 'Start',
  'journey.modeRange': 'From range state',
  'journey.modeEmpty': 'Empty',
  'journey.play': 'Play',
  'journey.pause': 'Pause',
  'journey.autoFollowOn': 'Auto-follow is on',
  'journey.autoFollowOff': 'Auto-follow is off',
  'journey.speed': 'Speed',
  'journey.events': 'events',
  'journey.loading': 'Loading…',
  'journey.noEvents': 'No recorded card journey in this range yet.',
  'journey.recordingStarts': 'Journey starts when Ban records activity for this project.',
  'journey.selectedEvent': 'Selected event',
  'journey.byBan': 'via Ban',
  'journey.byAgent': 'by an agent',

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
  'context.open': 'Open',
  'context.select': 'Select',
  'context.deselect': 'Deselect',
  'context.moveTo': 'Move to',

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
  'settings.shortcutsHint': 'Shortcuts use physical keys, so they keep working across keyboard languages.',
  'settings.pressShortcut': 'Press keys',
  'settings.resetShortcuts': 'Reset',

  // Shortcuts
  'shortcut.capture': 'Quick Capture',
  'shortcut.palette': 'Command Palette',
  'shortcut.newCard': 'New Card',
  'shortcut.save': 'Save card',

  // Capture
  'capture.placeholder': 'Capture idea… @status #tag',
  'capture.save': 'Save',
  'capture.dismiss': 'Dismiss',
  'capture.noProject': 'No project',
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
  'projects.hint': 'افتح مجلدًا لتجهيزه كمساحة عمل Ban.',
  'nav.board': 'اللوحة',
  'nav.journey': 'الرحلة',
  'nav.agents': 'الوكلاء',
  'nav.plans': 'الخطط',
  'nav.files': 'الملفات',
  'nav.skills': 'المهارات',

  // Agents (rules projection)
  'agents.title': 'الوكلاء',
  'agents.subtitle': 'اختر وكلاء الذكاء الاصطناعي اللي بتستخدمهم. Ban بيكتب مجموعة قواعد واحدة ويسقطها في ملف إعدادات كل وكيل بصيغته الأصلية، فكل الوكلاء بيقروا نفس مصدر الحقيقة.',
  'agents.yourAgents': 'وكلاؤك',
  'agents.viaImport': 'عبر الاستيراد',
  'agents.viaInline': 'مضمّن',
  'agents.rulesTitle': 'قواعد المشروع',
  'agents.rulesHint': 'القواعد دي هي المصدر الوحيد. ملف كل وكيل مختار بيوجّه هنا (استيراد أو تضمين). تعديلاتك خارج البلوك المُدار بتاع Ban مبتتلمسش أبدًا.',
  'agents.rulesPlaceholder': 'اكتب القواعد اللي كل وكيل لازم يتبعها…',
  'agents.saveRules': 'حفظ وإسقاط',
  'agents.saving': 'جارٍ الحفظ…',
  'agents.loading': 'جارٍ تحميل الوكلاء…',
  'agents.noneSelected': 'مفيش وكلاء مختارين لسه — اختر واحد على الأقل فوق عشان تسقط القواعد دي.',

  // Plans
  'plans.title': 'الخطط',
  'plans.new': 'خطة جديدة',
  'plans.empty': 'مفيش خطط لسه.',
  'plans.untitled': 'خطة بدون عنوان',
  'plans.delete': 'حذف الخطة',
  'plans.placeholder': 'اكتب الخطة…',

  // Files (universal explorer)
  'files.title': 'الملفات',
  'files.pick': 'اختر ملفًا للعرض أو التعديل.',
  'files.emptyDir': 'فارغ',
  'files.binary': 'ملف ثنائي — غير قابل للتعديل هنا.',
  'files.tooLarge': 'الملف أكبر من أن يُفتح هنا.',
  'files.placeholder': 'ملف فارغ…',
  'files.saved': 'تم الحفظ',

  // Skills
  'skills.title': 'المهارات',
  'skills.new': 'مهارة جديدة',
  'skills.empty': 'مفيش مهارات لسه.',
  'skills.untitled': 'مهارة جديدة',
  'skills.delete': 'حذف المهارة',
  'skills.intro': 'ثبّت مهارات قابلة لإعادة الاستخدام كملفات. Ban بيدرجها في إعدادات كل وكيل عشان أي وكيل يكتشفها ويستخدمها.',
  'skills.namePlaceholder': 'اسم المهارة',
  'skills.descPlaceholder': 'وصف بسطر — إمتى الوكيل لازم يستخدمها؟',
  'skills.bodyPlaceholder': 'اكتب المهارة…',

  'column.inbox': 'الوارد',
  'column.shape': 'تشكيل',
  'column.ready': 'جاهز',
  'column.doing': 'جارٍ التنفيذ',
  'column.review': 'مراجعة',
  'column.done': 'مكتمل',
  'column.killed': 'ملغى',
  'board.empty': 'فارغ',
  'board.newCard': 'بطاقة جديدة',

  'journey.title': 'الرحلة',
  'journey.subtitle': 'استرجع حياة هذا المشروع داخل Ban.',
  'journey.range': 'المدة',
  'journey.today': 'اليوم',
  'journey.week': 'الأسبوع',
  'journey.month': 'الشهر',
  'journey.custom': 'مخصص',
  'journey.all': 'الكل',
  'journey.from': 'من',
  'journey.to': 'إلى',
  'journey.mode': 'البداية',
  'journey.modeRange': 'من حالة المدة',
  'journey.modeEmpty': 'فارغ',
  'journey.play': 'تشغيل',
  'journey.pause': 'إيقاف',
  'journey.autoFollowOn': 'التتبع التلقائي مفعل',
  'journey.autoFollowOff': 'التتبع التلقائي غير مفعل',
  'journey.speed': 'السرعة',
  'journey.events': 'أحداث',
  'journey.loading': 'جارٍ التحميل…',
  'journey.noEvents': 'لا توجد رحلة كروت مسجلة في هذه المدة بعد.',
  'journey.recordingStarts': 'تبدأ الرحلة عندما يسجل Ban نشاط هذا المشروع.',
  'journey.selectedEvent': 'الحدث المحدد',
  'journey.byBan': 'عبر Ban',
  'journey.byAgent': 'بواسطة وكيل',

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
  'context.open': 'فتح',
  'context.select': 'تحديد',
  'context.deselect': 'إلغاء التحديد',
  'context.moveTo': 'نقل إلى',

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
  'settings.shortcutsHint': 'الاختصارات تستخدم المفاتيح الفعلية، لذلك تعمل مع تغيير لغة الكيبورد.',
  'settings.pressShortcut': 'اضغط المفاتيح',
  'settings.resetShortcuts': 'استعادة',

  'shortcut.capture': 'الالتقاط السريع',
  'shortcut.palette': 'لوحة الأوامر',
  'shortcut.newCard': 'بطاقة جديدة',
  'shortcut.save': 'حفظ البطاقة',

  'capture.placeholder': 'التقط فكرة… status@ tag#',
  'capture.save': 'حفظ',
  'capture.dismiss': 'إغلاق',
  'capture.noProject': 'لا يوجد مشروع',
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
