import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { ChartBar, Coin, TrendUp, ShoppingCart } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/data-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface SummaryCardProps {
  snapshot: Snapshot | null;
}

export function SummaryCard({ snapshot }: SummaryCardProps) {
  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-14 text-muted-foreground">
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

  const firstPriceRange = snapshot.json.priceRangesWithMarkup[0];
  const salesData = firstPriceRange
    ? firstPriceRange.prices.map((price) => {
      const margin = price.basePrice - purchasePrice;
      const marginPercent = purchasePrice > 0 ? (margin / purchasePrice) * 100 : 0;
      return {
        typeId: price.typeId,
        typeName: price.typeName,
        value: price.basePrice,
        currency: price.currency,
        margin,
        marginPercent,
      };
    })
    : [];

  return (
    <Card className="p-4">
      <Accordion type="single" collapsible defaultValue="summary" className="w-full">
        <AccordionItem value="summary" className="border-none">
          <AccordionTrigger className="py-2">
            <div className="flex items-center gap-2">
              <ChartBar size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Ключевые показатели</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
              <div className="space-y-3">
                <MetricCard icon={<ShoppingCart size={18} className="text-blue-500" />} title="Прямые затраты" value={formatCurrency(directPurchasePrice, snapshot.json.currency)} hint="Прямые затраты на производство" />
                <MetricCard icon={<Coin size={18} className="text-green-500" />} title="Себестоимость" value={formatCurrency(purchasePrice, snapshot.json.currency)} hint="С учетом накладных расходов" />
                <MetricCard icon={<TrendUp size={18} className="text-orange-500" />} title="Накладные расходы" value={formatPercent(overheadPercent)} hint={formatCurrency(overheadAmount, snapshot.json.currency)} />
              </div>

              <div className="bg-muted/30 rounded-lg p-4 min-h-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  <Coin size={18} className="text-purple-500" />
                  <h3 className="text-sm font-medium text-muted-foreground">Цены продажи</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                    <XAxis dataKey="typeName" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => Number(v).toLocaleString('ru-RU')} width={90} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const row = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
                            <div className="font-semibold">{row.typeName}</div>
                            <div className="font-mono">{formatCurrency(row.value, row.currency)}</div>
                            <div className="text-green-600">Маржа: {formatCurrency(row.margin, row.currency)} ({formatPercent(row.marginPercent)})</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" fill="oklch(0.60 0.15 280)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function MetricCard({ icon, title, value, hint }: { icon: ReactNode; title: string; value: string; hint: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
