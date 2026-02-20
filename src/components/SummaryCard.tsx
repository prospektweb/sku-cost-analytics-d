import { useMemo, useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { ChartBar, Coin, TrendUp, ShoppingCart, ArrowsLeftRight, Percent } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatDateTime, formatNumber, formatPercent, parseDateTime } from '@/lib/data-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ReferenceLine } from 'recharts';

interface SummaryCardProps {
  snapshots: Snapshot[];
}

export function SummaryCard({ snapshots }: SummaryCardProps) {
  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => parseDateTime(a.dateTime).getTime() - parseDateTime(b.dateTime).getTime()),
    [snapshots]
  );

  const latestSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[sortedSnapshots.length - 1] : null;
  const [leftSnapshotId, setLeftSnapshotId] = useState<number | null>(latestSnapshot?.id ?? null);
  const [rightSnapshotId, setRightSnapshotId] = useState<number | null>(null);

  const leftSnapshot = sortedSnapshots.find((s) => s.id === leftSnapshotId) ?? latestSnapshot;
  const rightSnapshot = sortedSnapshots.find((s) => s.id === rightSnapshotId) ?? null;

  if (!leftSnapshot) {
    return <Card className="p-4"><div className="flex items-center justify-center h-14 text-muted-foreground">Выберите период с данными для отображения показателей</div></Card>;
  }

  const leftMetrics = buildSnapshotMetrics(leftSnapshot);
  const rightMetrics = rightSnapshot ? buildSnapshotMetrics(rightSnapshot) : null;

  const leftSnapshotLabel = formatDateTime(parseDateTime(leftSnapshot.dateTime));
  const rightSnapshotLabel = rightSnapshot
    ? formatDateTime(parseDateTime(rightSnapshot.dateTime))
    : 'Не выбрано';

  const compareChartData = [
    { label: 'Прямые', newer: leftMetrics.directPurchasePrice, previous: rightMetrics?.directPurchasePrice ?? 0 },
    { label: 'Себестоимость', newer: leftMetrics.purchasePrice, previous: rightMetrics?.purchasePrice ?? 0 },
    { label: 'Накладные', newer: leftMetrics.overheadAmount, previous: rightMetrics?.overheadAmount ?? 0 },
    { label: 'Сред. наценка', newer: leftMetrics.avgMarkupAmount, previous: rightMetrics?.avgMarkupAmount ?? 0 },
  ];

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
            <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-4 items-start">
              <div className="space-y-3">
                <SnapshotSelector
                  label="Снимок"
                  value={leftSnapshot?.id.toString() ?? ''}
                  placeholder="Выберите снимок"
                  snapshots={sortedSnapshots}
                  onChange={(v) => setLeftSnapshotId(v ? parseInt(v, 10) : null)}
                />
                <SnapshotMetrics metrics={leftMetrics} />
              </div>

              <div className="bg-muted/20 rounded-lg p-3 min-h-[360px]">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowsLeftRight size={18} className="text-primary" />
                  <h3 className="text-sm font-medium text-muted-foreground">Рублевое сравнение</h3>
                </div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={compareChartData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="label" width={110} />
                    <ReferenceLine x={0} stroke="oklch(0.6 0 0)" />
                    <Tooltip formatter={(v: number) => formatCurrency(v, leftSnapshot.json.currency)} />
                    <Bar dataKey="newer" name={leftSnapshotLabel} fill="oklch(0.65 0.20 145)" />
                    <Bar dataKey="previous" name={rightSnapshotLabel} fill="oklch(0.72 0.02 260)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <SnapshotSelector
                  label="Снимок для сравнения"
                  value={rightSnapshotId?.toString() ?? 'none'}
                  placeholder="Не выбрано"
                  snapshots={sortedSnapshots}
                  allowEmpty
                  onChange={(v) => setRightSnapshotId(v && v !== 'none' ? parseInt(v, 10) : null)}
                />
                {rightMetrics ? <SnapshotMetrics metrics={rightMetrics} alignRight /> : <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">Снимок для сравнения не выбран</div>}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function SnapshotSelector({ label, value, placeholder, snapshots, onChange, allowEmpty }: { label: string; value: string; placeholder: string; snapshots: Snapshot[]; onChange: (value: string) => void; allowEmpty?: boolean; }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && <SelectItem value="none">Не выбрано</SelectItem>}
          {snapshots.map((snapshot) => (
            <SelectItem key={snapshot.id} value={snapshot.id.toString()}>
              {formatDateTime(parseDateTime(snapshot.dateTime))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SnapshotMetrics({ metrics, alignRight = false }: { metrics: ReturnType<typeof buildSnapshotMetrics>; alignRight?: boolean }) {
  const alignClass = alignRight ? 'text-right' : '';
  return (
    <div className="space-y-3">
      <MetricCard icon={<ShoppingCart size={18} className="text-blue-500" />} title="Прямые затраты" value={formatCurrency(metrics.directPurchasePrice, metrics.currency)} hint="Прямые затраты на производство" alignRight={alignRight} />
      <MetricCard icon={<Coin size={18} className="text-green-500" />} title="Себестоимость" value={formatCurrency(metrics.purchasePrice, metrics.currency)} hint="С учетом накладных расходов" alignRight={alignRight} />
      <MetricCard icon={<TrendUp size={18} className="text-orange-500" />} title="Накладные расходы" value={formatPercent(metrics.overheadPercent)} hint={formatCurrency(metrics.overheadAmount, metrics.currency)} alignRight={alignRight} />

      <div className={`bg-muted/30 rounded-lg p-4 ${alignClass}`}>
        <div className={`flex items-center gap-2 text-sm font-medium text-muted-foreground ${alignRight ? 'justify-end' : ''}`}>
          <Percent size={18} className="text-purple-500" />
          <span>Средняя наценка</span>
        </div>
        <div className="text-2xl font-bold font-mono">{formatPercent(metrics.avgMarkupPercent)}</div>
        <div className="text-xs text-muted-foreground">{formatCurrency(metrics.avgMarkupAmount, metrics.currency)}</div>
        <div className="mt-3 space-y-2">
          {metrics.salePrices.map((price) => (
            <div key={price.typeId} className={`flex items-center justify-between text-sm ${alignRight ? 'flex-row-reverse' : ''}`} title={price.typeName}>
              <span className="text-muted-foreground">{price.typeName}</span>
              <div className="font-mono">
                <span className="text-green-600">+{formatNumber(price.markupPercent)}%</span>
                <span className="ml-3">{formatCurrency(price.basePrice, metrics.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildSnapshotMetrics(snapshot: Snapshot) {
  const directPurchasePrice = snapshot.json.directPurchasePrice;
  const purchasePrice = snapshot.json.purchasePrice;
  const overheadAmount = purchasePrice - directPurchasePrice;
  const overheadPercent = directPurchasePrice > 0 ? (overheadAmount / directPurchasePrice) * 100 : 0;

  const prices = snapshot.json.priceRangesWithMarkup[0]?.prices ?? [];
  const salePrices = prices.map((price) => {
    const markupAmount = price.basePrice - price.purchasePrice;
    return {
      typeId: price.typeId,
      typeName: price.typeName,
      basePrice: price.basePrice,
      markupAmount,
      markupPercent: price.purchasePrice > 0 ? (markupAmount / price.purchasePrice) * 100 : 0,
    };
  });

  const avgMarkupAmount = salePrices.length > 0 ? salePrices.reduce((sum, item) => sum + item.markupAmount, 0) / salePrices.length : 0;
  const avgMarkupPercent = salePrices.length > 0 ? salePrices.reduce((sum, item) => sum + item.markupPercent, 0) / salePrices.length : 0;

  return { currency: snapshot.json.currency, directPurchasePrice, purchasePrice, overheadAmount, overheadPercent, avgMarkupAmount, avgMarkupPercent, salePrices };
}

function MetricCard({ icon, title, value, hint, alignRight = false }: { icon: ReactNode; title: string; value: string; hint: string; alignRight?: boolean }) {
  return (
    <div className={`bg-muted/30 rounded-lg p-4 ${alignRight ? 'text-right' : ''}`}>
      <div className={`flex items-center gap-2 mb-2 ${alignRight ? 'justify-end' : ''}`}>
        {icon}
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
