import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartLine } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatDateTime, parseDateTime, formatPercent } from '@/lib/data-utils';

interface CostDynamicsChartProps {
  snapshots: Snapshot[];
}

export function CostDynamicsChart({ snapshots }: CostDynamicsChartProps) {
  const chartData = useMemo(() => {
    return snapshots.map((snapshot) => ({
      timestamp: parseDateTime(snapshot.dateTime),
      dateTime: formatDateTime(parseDateTime(snapshot.dateTime)),
      directPurchasePrice: snapshot.json.directPurchasePrice,
      purchasePrice: snapshot.json.purchasePrice,
      overhead: snapshot.json.purchasePrice - snapshot.json.directPurchasePrice,
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [snapshots]);

  // Calculate deltas for tooltip annotations
  const annotatedData = useMemo(() => {
    return chartData.map((point, index) => {
      if (index === 0) return point;
      
      const prev = chartData[index - 1];
      const directDelta = point.directPurchasePrice - prev.directPurchasePrice;
      const baseDelta = point.purchasePrice - prev.purchasePrice;
      
      return {
        ...point,
        directDelta,
        baseDelta,
      };
    });
  }, [chartData]);

  if (snapshots.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLine size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Динамика себестоимости</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Нет данных для отображения. Выберите фильтры для загрузки данных.
        </div>
      </Card>
    );
  }

  const currency = snapshots[0]?.json.currency || 'RUB';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartLine size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Динамика себестоимости</h2>
      </div>

      <div className="mb-3 text-sm text-muted-foreground">
        Показывает изменение закупочной и базовой себестоимости во времени.
        Область между линиями представляет накладные расходы.
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={annotatedData}>
          <defs>
            <linearGradient id="overheadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.70 0.18 35)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="oklch(0.70 0.18 35)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
          <XAxis
            dataKey="dateTime"
            tick={{ fill: 'oklch(0.5 0 0)', fontSize: 12 }}
            stroke="oklch(0.8 0 0)"
          />
          <YAxis
            tick={{ fill: 'oklch(0.5 0 0)', fontSize: 12 }}
            stroke="oklch(0.8 0 0)"
            tickFormatter={(value) => value.toLocaleString('ru-RU')}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;

              const data = payload[0].payload;
              const overheadPercent = data.directPurchasePrice > 0
                ? (data.overhead / data.directPurchasePrice) * 100
                : 0;

              return (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <p className="font-semibold mb-2">{data.dateTime}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: 'oklch(0.65 0.20 145)' }}
                        />
                        <span className="text-sm font-medium">Закупочная себестоимость:</span>
                      </div>
                      <div className="ml-5 font-mono font-semibold">
                        {formatCurrency(data.directPurchasePrice, currency)}
                      </div>
                      {data.directDelta !== undefined && (
                        <div className={`ml-5 text-xs ${data.directDelta > 0 ? 'text-green-600' : data.directDelta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {data.directDelta > 0 ? '+' : ''}{formatCurrency(data.directDelta, currency)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: 'oklch(0.70 0.18 35)' }}
                        />
                        <span className="text-sm font-medium">Базовая себестоимость:</span>
                      </div>
                      <div className="ml-5 font-mono font-semibold">
                        {formatCurrency(data.purchasePrice, currency)}
                      </div>
                      {data.baseDelta !== undefined && (
                        <div className={`ml-5 text-xs ${data.baseDelta > 0 ? 'text-green-600' : data.baseDelta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {data.baseDelta > 0 ? '+' : ''}{formatCurrency(data.baseDelta, currency)}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="text-sm text-muted-foreground">Накладные расходы:</div>
                      <div className="ml-5 font-mono font-semibold text-orange-500">
                        {formatCurrency(data.overhead, currency)}
                      </div>
                      <div className="ml-5 text-xs text-muted-foreground">
                        {formatPercent(overheadPercent)} от закупочной
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="purchasePrice"
            name="Базовая себестоимость"
            stroke="oklch(0.70 0.18 35)"
            fill="url(#overheadGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="directPurchasePrice"
            name="Закупочная себестоимость"
            stroke="oklch(0.65 0.20 145)"
            fill="oklch(0.65 0.20 145)"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
