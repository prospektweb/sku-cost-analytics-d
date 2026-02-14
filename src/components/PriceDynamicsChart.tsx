import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartLine } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { extractPriceTimeSeries, formatCurrency, formatDateTime, formatPercent, getChartColor } from '@/lib/data-utils';
import { Badge } from '@/components/ui/badge';

interface PriceDynamicsChartProps {
  snapshots: Snapshot[];
  selectedPriceTypeIds: number[];
}

export function PriceDynamicsChart({
  snapshots,
  selectedPriceTypeIds,
}: PriceDynamicsChartProps) {
  const [hiddenPriceTypes, setHiddenPriceTypes] = useState<Set<number>>(new Set());

  const chartData = useMemo(() => {
    const pricePoints = extractPriceTimeSeries(snapshots, selectedPriceTypeIds);

    const groupedByTimestamp = new Map<number, Record<string, number | string>>();

    pricePoints.forEach((point) => {
      const timestamp = point.timestamp.getTime();

      if (!groupedByTimestamp.has(timestamp)) {
        groupedByTimestamp.set(timestamp, {
          timestamp,
          dateTime: formatDateTime(point.timestamp),
        });
      }

      const dataPoint = groupedByTimestamp.get(timestamp)!;
      dataPoint[`${point.priceType}_${point.priceTypeId}`] = point.value;
    });

    return Array.from(groupedByTimestamp.values()).sort((a, b) => {
      const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
      const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
      return aTime - bTime;
    });
  }, [snapshots, selectedPriceTypeIds]);

  const priceTypeKeys = useMemo(() => {
    if (chartData.length === 0) return [];

    const keys = Object.keys(chartData[0]).filter(
      (key) => key !== 'timestamp' && key !== 'dateTime'
    );

    return keys;
  }, [chartData]);

  const visibleKeys = useMemo(() => {
    return priceTypeKeys.filter((key) => {
      const typeId = parseInt(key.split('_')[1]);
      return !hiddenPriceTypes.has(typeId);
    });
  }, [priceTypeKeys, hiddenPriceTypes]);

  const togglePriceType = (key: string) => {
    const typeId = parseInt(key.split('_')[1]);
    setHiddenPriceTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  if (snapshots.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLine size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Динамика цены во времени</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Нет данных для отображения. Выберите фильтры для загрузки данных.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartLine size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Динамика цены во времени</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {priceTypeKeys.map((key, index) => {
          const [label, typeIdStr] = key.split('_');
          const typeId = parseInt(typeIdStr);
          const isHidden = hiddenPriceTypes.has(typeId);

          return (
            <Badge
              key={key}
              variant={isHidden ? 'outline' : 'default'}
              className="cursor-pointer transition-colors"
              style={{
                backgroundColor: isHidden ? 'transparent' : getChartColor(index),
                borderColor: getChartColor(index),
                color: isHidden ? getChartColor(index) : 'white',
              }}
              onClick={() => togglePriceType(key)}
            >
              {label}
            </Badge>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
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

              return (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <p className="font-semibold mb-2">{data.dateTime}</p>
                  {payload
                    .filter((entry) => visibleKeys.includes(entry.dataKey as string))
                    .map((entry, index) => {
                      const [label] = (entry.dataKey as string).split('_');
                      const value = entry.value as number;

                      const pricePoints = extractPriceTimeSeries(
                        snapshots,
                        selectedPriceTypeIds
                      );
                      const currentPoint = pricePoints.find(
                        (p) =>
                          formatDateTime(p.timestamp) === data.dateTime &&
                          p.priceType === label
                      );

                      return (
                        <div key={index} className="mt-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium">{label}:</span>
                            <span className="text-sm font-mono">
                              {formatCurrency(value, 'RUB')}
                            </span>
                          </div>
                          {currentPoint?.delta !== undefined && currentPoint.deltaPercent !== undefined && (
                            <div className="ml-5 text-xs text-muted-foreground">
                              {currentPoint.delta > 0 ? '+' : ''}
                              {formatCurrency(currentPoint.delta, 'RUB')} (
                              {currentPoint.delta > 0 ? '+' : ''}
                              {formatPercent(currentPoint.deltaPercent)})
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            }}
          />
          <Legend />
          {visibleKeys.map((key, index) => {
            const [label] = key.split('_');
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={getChartColor(index)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
