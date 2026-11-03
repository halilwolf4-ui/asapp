import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'career', name: 'Kariyer & İş', color: '#8A4FFF', icon: 'Briefcase' },
  { id: 'health', name: 'Sağlık & Spor', color: '#2EE6B6', icon: 'Heart' },
  { id: 'personal', name: 'Kişisel Gelişim', color: '#FF3D7F', icon: 'Sparkles' },
  { id: 'finance', name: 'Finans & Yatırım', color: '#FFB800', icon: 'TrendingUp' },
  { id: 'learning', name: 'Öğrenme & Kitap', color: '#38BDF8', icon: 'BookOpen' },
  { id: 'life', name: 'Yaşam & Rutin', color: '#A78BFA', icon: 'Sun' },
];

export const HORIZON_LABELS: Record<string, { label: string; short: string; desc: string }> = {
  day: { label: 'Günlük Görev', short: 'Gün', desc: 'Bugün yapılacak adımlar' },
  week: { label: 'Haftalık Hedef', short: 'Hafta', desc: 'Bu haftanın odakları' },
  month: { label: 'Aylık Hedef', short: 'Ay', desc: 'Bu ayın kilometre taşları' },
  year: { label: 'Yıllık Hedef', short: 'Yıl', desc: 'Yıl sonu vizyonu' },
  fiveYear: { label: '5 Yıllık Vizyon', short: '5 Yıl', desc: 'Büyük yaşam vizyonu' },
};

