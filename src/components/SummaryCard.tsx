import { Card } from '@/components/ui/card';
import { ChartBar, Coin, TrendUp, ShoppingCart } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/data-utils';

interface SummaryCardProps {
  snapshot: Snapshot | null;
}

export function SummaryCard({ snapshot }: SummaryCardProps) {
  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartBar size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Ключевые показатели</h2>
        </div>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Выберите период с данными для отображения показателей
        </div>
      </Card>
    );
  }

  const directPurchasePrice = snapshot.json.directPurchasePrice;
  const purchasePrice = snapshot.json.purchasePrice;
  const overheadAmount = purchasePrice - directPurchasePrice;
  const overheadPercent = directPurchasePrice > 0 
    ? (overheadAmount / directPurchasePrice) * 100 
    : 0;

  // Get first price range
  const firstPriceRange = snapshot.json.priceRangesWithMarkup[0];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <ChartBar size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Ключевые показатели</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Direct Purchase Price */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={18} className="text-blue-500" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Себестоимость (закупочная)
            </h3>
          </div>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(directPurchasePrice, snapshot.json.currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Прямые затраты на производство
          </div>
        </div>

        {/* Base Purchase Price */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coin size={18} className="text-green-500" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Себестоимость (базовая)
            </h3>
          </div>
          <div className="text-2xl font-bold font-mono">
            {formatCurrency(purchasePrice, snapshot.json.currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            С учетом накладных расходов
          </div>
        </div>

        {/* Overhead */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendUp size={18} className="text-orange-500" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Накладные расходы
            </h3>
          </div>
          <div className="text-2xl font-bold font-mono">
            {formatPercent(overheadPercent)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatCurrency(overheadAmount, snapshot.json.currency)}
          </div>
        </div>

        {/* Sales Prices */}
        {firstPriceRange && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coin size={18} className="text-purple-500" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Цены продажи
              </h3>
            </div>
            <div className="space-y-2">
              {firstPriceRange.prices.map((price) => {
                const margin = price.basePrice - purchasePrice;
                const marginPercent = purchasePrice > 0 
                  ? (margin / purchasePrice) * 100 
                  : 0;

                return (
                  <div key={price.typeId} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground truncate">{price.typeName}:</span>
                      <span className="font-mono font-semibold ml-2">
                        {formatCurrency(price.basePrice, price.currency)}
                      </span>
                    </div>
                    <div className="text-xs text-green-600">
                      Маржа: {formatCurrency(margin, price.currency)} ({formatPercent(marginPercent)})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
