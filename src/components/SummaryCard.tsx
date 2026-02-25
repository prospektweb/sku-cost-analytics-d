import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChartBar } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatDateTime, formatNumber, parseDateTime } from '@/lib/data-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend, ReferenceLine } from 'recharts';

interface SummaryCardProps {
  snapshots: Snapshot[];
}

interface SnapshotLineData {
  id: number;
  label: string;
  direct: number;
  overhead: number;
  markup: number;
  totalCost: number;
  totalWithMarkup: number;
}

export function SummaryCard({ snapshots }: SummaryCardProps) {
  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => parseDateTime(a.dateTime).getTime() - parseDateTime(b.dateTime).getTime()),
    [snapshots]
  );

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (sortedSnapshots.length === 0) return;
    if (selectedIds.length === 0) {
      const initial = sortedSnapshots.slice(-Math.min(4, sortedSnapshots.length)).map((s) => s.id);
      setSelectedIds(initial);
      return;
    }

    setSelectedIds((prev) => prev.filter((id) => sortedSnapshots.some((s) => s.id === id)).slice(0, 4));
  }, [sortedSnapshots, selectedIds.length]);

  const selectedSnapshots = useMemo(
    () => sortedSnapshots.filter((s) => selectedIds.includes(s.id)),
    [sortedSnapshots, selectedIds]
  );

  if (sortedSnapshots.length === 0) {
    return <Card className="p-4"><div className="flex items-center justify-center h-14 text-muted-foreground">Выберите период с данными для отображения показателей</div></Card>;
  }

  const chartData: SnapshotLineData[] = selectedSnapshots.map((snapshot) => {
    const direct = snapshot.json.directPurchasePrice;
    const totalCost = snapshot.json.purchasePrice;
    const overhead = totalCost - direct;
    const prices = snapshot.json.priceRangesWithMarkup[0]?.prices ?? [];
    const avgMarkup = prices.length > 0
      ? prices.reduce((sum, price) => sum + (price.basePrice - price.purchasePrice), 0) / prices.length
      : 0;

    return {
      id: snapshot.id,
      label: formatDateTime(parseDateTime(snapshot.dateTime)),
      direct,
      overhead,
      markup: avgMarkup,
      totalCost,
      totalWithMarkup: totalCost + avgMarkup,
    };
  });

  const currency = selectedSnapshots[0]?.json.currency || 'RUB';

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
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {sortedSnapshots.map((snapshot) => {
                  const active = selectedIds.includes(snapshot.id);
                  const disabled = !active && selectedIds.length >= 4;
                  return (
                    <button
                      key={snapshot.id}
                      type="button"
                      onClick={() => {
                        setSelectedIds((prev) => {
                          if (prev.includes(snapshot.id)) return prev.filter((id) => id !== snapshot.id);
                          if (prev.length >= 4) return prev;
                          return [...prev, snapshot.id];
                        });
                      }}
                      disabled={disabled}
                      className={`px-3 py-1.5 rounded-md border text-sm ${active ? 'bg-primary/10 border-primary/40' : 'bg-background'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {formatDateTime(parseDateTime(snapshot.dateTime))}
                    </button>
                  );
                })}
              </div>

              <div className="w-full bg-muted/20 rounded-lg p-3" style={{ minHeight: Math.max(260, chartData.length * 70) }}>
                <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 62)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                    <YAxis type="category" dataKey="label" width={180} />
                    <ReferenceLine x={0} stroke="oklch(0.6 0 0)" />
                    <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                    <Legend />
                    <Bar dataKey="direct" stackId="cost" name="Прямые затраты" fill="oklch(0.68 0.12 235)" />
                    <Bar dataKey="overhead" stackId="cost" name="Накладные расходы" fill="oklch(0.78 0.09 235)" />
                    <Bar dataKey="markup" stackId="cost" name="Средняя наценка" fill="oklch(0.70 0.16 145)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div
                className="grid gap-3 grid-cols-1"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, selectedSnapshots.length)}, minmax(0, 1fr))` }}
              >
                {selectedSnapshots.map((snapshot) => {
                  const direct = snapshot.json.directPurchasePrice;
                  const totalCost = snapshot.json.purchasePrice;
                  const overhead = totalCost - direct;
                  const overheadPct = direct > 0 ? (overhead / direct) * 100 : 0;
                  const prices = snapshot.json.priceRangesWithMarkup[0]?.prices ?? [];
                  const avgMarkup = prices.length > 0
                    ? prices.reduce((sum, price) => sum + (price.basePrice - price.purchasePrice), 0) / prices.length
                    : 0;
                  return (
                    <div key={snapshot.id} className="rounded-lg border bg-background p-3 space-y-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{formatDateTime(parseDateTime(snapshot.dateTime))}</div>
                      <div className="text-sm">Прямые затраты: <span className="font-mono">{formatCurrency(direct, snapshot.json.currency)}</span></div>
                      <div className="text-sm">Накладные расходы: <span className="font-mono">{formatCurrency(overhead, snapshot.json.currency)} ({formatNumber(overheadPct)}%)</span></div>
                      <div className="text-sm">Себестоимость: <span className="font-mono">{formatCurrency(totalCost, snapshot.json.currency)}</span></div>
                      <div className="text-sm">Средняя наценка: <span className="font-mono">{formatCurrency(avgMarkup, snapshot.json.currency)}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
