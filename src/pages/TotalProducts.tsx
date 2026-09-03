import { useLiveQuery } from 'dexie-react-hooks';
import { db, isStockManaged } from '@/lib/db';
import { useTranslation } from 'react-i18next';

const CURRENCY_SYMBOL: Record<string, string> = { id: 'Rp', en: 'Rp', ms: 'Rp' };
const NUMBER_LOCALES: Record<string, string> = { id: 'id-ID', en: 'en-US', ms: 'ms-MY' };

const COUNTED_UNITS = new Set(['pcs', 'gram', 'bungkus']);

export default function TotalProducts() {
  const { i18n } = useTranslation();
  const numberLocale = NUMBER_LOCALES[i18n.language] ?? 'id-ID';
  const currencySymbol = CURRENCY_SYMBOL[i18n.language] ?? 'Rp';

  const products = useLiveQuery(() => db.products.where('isDeleted').equals(0).toArray());

  const totalValue = (products ?? []).reduce((sum, p) => {
    if (!isStockManaged(p)) return sum;
    const unit = p.unit.toLowerCase();
    if (!COUNTED_UNITS.has(unit)) return sum;
    const qty = unit === 'gram' ? p.stock / 1000 : p.stock;
    return sum + qty * p.hpp;
  }, 0);

  const rp = (n: number) => `${currencySymbol} ${Math.round(n).toLocaleString(numberLocale)}`;

  return (
    <div className="rounded-lg border bg-card px-4 py-3 mb-2">
      <p className="text-xs text-muted-foreground">Total Nilai Stok (pcs · gram · bungkus)</p>
      <p className="text-lg font-semibold">{rp(totalValue)}</p>
    </div>
  );
}
