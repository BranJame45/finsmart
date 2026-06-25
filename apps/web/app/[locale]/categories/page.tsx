import { useTranslations } from 'next-intl';
import CategoryManager from '@/components/modules/CategoryManager';

export default function CategoriesPage() {
  const t = useTranslations('categories');

  return (
    <div>
      <CategoryManager />
    </div>
  );
}
