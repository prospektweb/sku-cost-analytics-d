import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartLine } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatDateTime, formatPercent, parseDateTime } from '@/lib/data-utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PriceDynamicsChartProps {
  snapshots: Snapshot[];
  selectedPriceTypeIds: number[];
}

const BASE_COLORS = ['oklch(0.60 0.15 280)', 'oklch(0.72 0.19 90)', 'oklch(0.65 0.22 25)', 'oklch(0.55 0.18 200)'];

export function PriceDynamicsChart({ snapshots, selectedPriceTypeIds }: PriceDynamicsChartProps) {
  const [hiddenPriceTypes, setHiddenPriceTypes] = useState<Set<number>>(new Set());
  const [selectedRangeIndex, setSelectedRangeIndex] = useState<number>(0);

  const availableRanges = useMemo(() => {
    if (snapshots.length === 0) return [];
    const latestSnapshot = snapshots[snapshots.length - 1];
    return latestSnapshot.json.priceRangesWithMarkup.map((range, index) => ({
      index,
      label: range.quantityTo !== null ? `${range.quantityFrom}-${range.quantityTo}` : `${range.quantityFrom}+`,
    }));
  }, [snapshots]);

  const priceTypeMeta = useMemo(() => {
    const ids = new Map<number, { id: number; name: string }>();
    snapshots.forEach((snapshot) => {
      const range = snapshot.json.priceRangesWithMarkup[selectedRangeIndex] || snapshot.json.priceRangesWithMarkup[0];
      range?.prices.forEach((price) => {
        if (selectedPriceTypeIds.length === 0 || selectedPriceTypeIds.includes(price.typeId)) {
          ids.set(price.typeId, { id: price.typeId, name: price.typeName });
        }
      });
    });
    return Array.from(ids.values()).sort((a, b) => a.id - b.id);
  }, [snapshots, selectedPriceTypeIds, selectedRangeIndex]);

  const colorByTypeId = useMemo(() => {
    const m = new Map<number, string>();
    priceTypeMeta.forEach((item, index) => m.set(item.id, BASE_COLORS[index % BASE_COLORS.length]));
    return m;
  }, [priceTypeMeta]);

  const chartData = useMemo(() => {
    return snapshots
      .map((snapshot) => {
        const row: Record<string, string | number> = {
          timestamp: parseDateTime(snapshot.dateTime).getTime(),
          dateTime: formatDateTime(parseDateTime(snapshot.dateTime)),
          direct: snapshot.json.directPurchasePrice,
          cost: snapshot.json.purchasePrice,
          overhead: snapshot.json.purchasePrice - snapshot.json.directPurchasePrice,
        };

        const range = snapshot.json.priceRangesWithMarkup[selectedRangeIndex] || snapshot.json.priceRangesWithMarkup[0];
        range?.prices.forEach((price) => {
          if (selectedPriceTypeIds.length === 0 || selectedPriceTypeIds.includes(price.typeId)) {
            row[`p_${price.typeId}`] = price.basePrice;
          }
        });

        return row;
      })
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  }, [snapshots, selectedPriceTypeIds, selectedRangeIndex]);

  const visibleMeta = priceTypeMeta.filter((item) => !hiddenPriceTypes.has(item.id));

  if (snapshots.length === 0) {
    return <Card className="p-4"><div className="flex items-center justify-center h-64 text-muted-foreground">Нет данных для отображения.</div></Card>;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChartLine size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Динамика цены во времени</h2>
        </div>
        {availableRanges.length > 1 && (
          <Select value={selectedRangeIndex.toString()} onValueChange={(value) => setSelectedRangeIndex(parseInt(value))}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Выберите диапазон" /></SelectTrigger>
            <SelectContent>{availableRanges.map((range) => <SelectItem key={range.index} value={range.index.toString()}>Количество: {range.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {priceTypeMeta.map((item) => {
          const isHidden = hiddenPriceTypes.has(item.id);
          const color = colorByTypeId.get(item.id) || BASE_COLORS[0];
          return (
            <Badge key={item.id} variant={isHidden ? 'outline' : 'default'} className="cursor-pointer" style={{ backgroundColor: isHidden ? 'transparent' : color, borderColor: color, color: isHidden ? color : 'white' }} onClick={() => setHiddenPriceTypes((prev) => {
              const n = new Set(prev);
              if (n.has(item.id)) n.delete(item.id); else n.add(item.id);
              return n;
            })}>
              {item.name}
            </Badge>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
          <XAxis dataKey="dateTime" />
          <YAxis tickFormatter={(value) => Number(value).toLocaleString('ru-RU')} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const data = payload[0].payload as any;
            return <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
              <div className="font-semibold mb-2">{data.dateTime}</div>
              <div>Прямые затраты: <span className="font-mono">{formatCurrency(data.direct, 'RUB')}</span></div>
              <div>Себестоимость: <span className="font-mono">{formatCurrency(data.cost, 'RUB')}</span></div>
              <div>Накладные расходы: <span className="font-mono">{formatCurrency(data.overhead, 'RUB')}</span></div>
              {visibleMeta.map((item) => {
                const value = data[`p_${item.id}`];
                if (value === undefined) return null;
                const margin = Number(value) - Number(data.cost);
                const marginPercent = Number(data.cost) > 0 ? (margin / Number(data.cost)) * 100 : 0;
                return <div key={item.id} className="mt-1">{item.name}: <span className="font-mono">{formatCurrency(Number(value), 'RUB')}</span> <span className="text-green-600">Маржа: {formatCurrency(margin, 'RUB')} ({formatPercent(marginPercent)})</span></div>;
              })}
            </div>;
          }} />
          <Legend />
          <Line type="monotone" dataKey="direct" name="Прямые затраты" stroke="oklch(0.65 0.20 145)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="cost" name="Себестоимость" stroke="oklch(0.70 0.18 35)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="overhead" name="Накладные расходы" stroke="oklch(0.80 0.17 70)" strokeWidth={2} dot={false} />
          {visibleMeta.map((item) => (
            <Line key={item.id} type="monotone" dataKey={`p_${item.id}`} name={item.name} stroke={colorByTypeId.get(item.id)} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
