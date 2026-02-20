import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartLine } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatDateTime, parseDateTime, formatPercent } from '@/lib/data-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface CostDynamicsChartProps {
  snapshots: Snapshot[];
}

interface MarkupSeriesMeta {
  typeId: number;
  typeName: string;
  key: string;
  color: string;
}

const BASE_SERIES = {
  direct: { key: 'directPurchasePrice', label: 'Прямые затраты', color: 'oklch(0.65 0.20 145)' },
  cost: { key: 'purchasePrice', label: 'Себестоимость', color: 'oklch(0.70 0.18 35)' },
  overhead: { key: 'overhead', label: 'Накладные расходы', color: 'oklch(0.75 0.16 70)' },
} as const;

const MARKUP_COLORS = [
  'oklch(0.67 0.21 264)',
  'oklch(0.62 0.22 320)',
  'oklch(0.68 0.17 210)',
  'oklch(0.72 0.16 15)',
  'oklch(0.69 0.20 125)',
  'oklch(0.60 0.22 35)',
];

export function CostDynamicsChart({ snapshots }: CostDynamicsChartProps) {
  const [showDirect, setShowDirect] = useState(false);
  const [showCost, setShowCost] = useState(true);
  const [showOverhead, setShowOverhead] = useState(false);

  const markupSeries = useMemo<MarkupSeriesMeta[]>(() => {
    const seen = new Map<number, string>();

    for (const snapshot of snapshots) {
      const prices = snapshot.json.priceRangesWithMarkup[0]?.prices ?? [];
      for (const price of prices) {
        if (!seen.has(price.typeId)) {
          seen.set(price.typeId, price.typeName);
        }
      }
    }

    return [...seen.entries()].map(([typeId, typeName], index) => ({
      typeId,
      typeName,
      key: `markupType_${typeId}`,
      color: MARKUP_COLORS[index % MARKUP_COLORS.length],
    }));
  }, [snapshots]);

  const [visibleMarkupTypeIds, setVisibleMarkupTypeIds] = useState<number[]>([]);

  const visibleMarkupSet = useMemo(() => {
    if (visibleMarkupTypeIds.length > 0) {
      return new Set(visibleMarkupTypeIds);
    }

    return new Set(markupSeries.map((series) => series.typeId));
  }, [visibleMarkupTypeIds, markupSeries]);

  const chartData = useMemo(() => {
    return snapshots
      .map((snapshot) => {
        const markupMap = new Map((snapshot.json.priceRangesWithMarkup[0]?.prices ?? []).map((p) => [p.typeId, p.basePrice]));

        const point: Record<string, number | string | Date> = {
          timestamp: parseDateTime(snapshot.dateTime),
          dateTime: formatDateTime(parseDateTime(snapshot.dateTime)),
          directPurchasePrice: snapshot.json.directPurchasePrice,
          purchasePrice: snapshot.json.purchasePrice,
          overhead: snapshot.json.purchasePrice - snapshot.json.directPurchasePrice,
        };

        for (const series of markupSeries) {
          point[series.key] = markupMap.get(series.typeId) ?? 0;
        }

        return point;
      })
      .sort((a, b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime());
  }, [snapshots, markupSeries]);

  const annotatedData = useMemo(() => {
    return chartData.map((point, index) => {
      if (index === 0) return point;
      const prev = chartData[index - 1];
      return {
        ...point,
        directDelta: Number(point.directPurchasePrice) - Number(prev.directPurchasePrice),
        baseDelta: Number(point.purchasePrice) - Number(prev.purchasePrice),
      };
    });
  }, [chartData]);

  const toggleMarkupType = (typeId: number) => {
    setVisibleMarkupTypeIds((prev) => {
      const fallbackAll = markupSeries.map((series) => series.typeId);
      const source = prev.length > 0 ? prev : fallbackAll;
      const exists = source.includes(typeId);
      return exists ? source.filter((id) => id !== typeId) : [...source, typeId];
    });
  };

  const header = (
    <div className="flex items-center gap-2">
      <ChartLine size={20} className="text-primary" />
      <h2 className="text-lg font-semibold">Динамика цены во времени</h2>
    </div>
  );

  if (snapshots.length === 0) {
    return (
      <Card className="p-4">
        <Accordion type="single" collapsible defaultValue="cost-dynamics" className="w-full">
          <AccordionItem value="cost-dynamics" className="border-none">
            <AccordionTrigger className="py-2">{header}</AccordionTrigger>
            <AccordionContent>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Нет данных для отображения. Выберите фильтры для загрузки данных.
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    );
  }

  const currency = snapshots[0]?.json.currency || 'RUB';

  return (
    <Card className="p-4">
      <Accordion type="single" collapsible defaultValue="cost-dynamics" className="w-full">
        <AccordionItem value="cost-dynamics" className="border-none">
          <AccordionTrigger className="py-2">{header}</AccordionTrigger>
          <AccordionContent>
            <div className="mb-3 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <SeriesToggleButton
                label={BASE_SERIES.direct.label}
                color={BASE_SERIES.direct.color}
                active={showDirect}
                onClick={() => setShowDirect((v) => !v)}
              />
              <SeriesToggleButton
                label={BASE_SERIES.cost.label}
                color={BASE_SERIES.cost.color}
                active={showCost}
                onClick={() => setShowCost((v) => !v)}
              />
              <SeriesToggleButton
                label={BASE_SERIES.overhead.label}
                color={BASE_SERIES.overhead.color}
                active={showOverhead}
                onClick={() => setShowOverhead((v) => !v)}
              />
              {markupSeries.map((series) => (
                <SeriesToggleButton
                  key={series.typeId}
                  label={series.typeName}
                  color={series.color}
                  active={visibleMarkupSet.has(series.typeId)}
                  onClick={() => toggleMarkupType(series.typeId)}
                />
              ))}
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={annotatedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateTime" className="text-xs" angle={-45} textAnchor="end" height={60} />
                <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(Number(value), currency)} />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;

                    const data = payload[0].payload as {
                      dateTime: string;
                      directPurchasePrice: number;
                      purchasePrice: number;
                      overhead: number;
                      directDelta?: number;
                      baseDelta?: number;
                    } & Record<string, number | string>;

                    const overheadPercent =
                      data.directPurchasePrice > 0 ? (data.overhead / data.directPurchasePrice) * 100 : 0;

                    return (
                      <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
                        <p className="mb-2 font-semibold">{data.dateTime}</p>
                        <div className="space-y-2">
                          {showDirect && (
                            <div>
                              <div className="text-sm font-medium">{BASE_SERIES.direct.label}:</div>
                              <div className="font-mono font-semibold">{formatCurrency(data.directPurchasePrice, currency)}</div>
                            </div>
                          )}

                          {showCost && (
                            <div>
                              <div className="text-sm font-medium">{BASE_SERIES.cost.label}:</div>
                              <div className="font-mono font-semibold">{formatCurrency(data.purchasePrice, currency)}</div>
                            </div>
                          )}

                          {showOverhead && (
                            <div>
                              <div className="text-sm text-muted-foreground">{BASE_SERIES.overhead.label}:</div>
                              <div className="font-mono font-semibold" style={{ color: BASE_SERIES.overhead.color }}>
                                {formatCurrency(data.overhead, currency)}
                              </div>
                              <div className="text-xs text-muted-foreground">{formatPercent(overheadPercent)} от прямых затрат</div>
                            </div>
                          )}

                          {markupSeries
                            .filter((series) => visibleMarkupSet.has(series.typeId))
                            .map((series) => (
                              <div key={series.typeId}>
                                <div className="text-sm font-medium" style={{ color: series.color }}>
                                  {series.typeName}:
                                </div>
                                <div className="font-mono font-semibold">
                                  {formatCurrency(Number(data[series.key] ?? 0), currency)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  }}
                />

                <Legend />

                {showCost && (
                  <Area
                    type="monotone"
                    dataKey={BASE_SERIES.cost.key}
                    name={BASE_SERIES.cost.label}
                    stroke={BASE_SERIES.cost.color}
                    fill={BASE_SERIES.cost.color}
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                )}

                {showDirect && (
                  <Area
                    type="monotone"
                    dataKey={BASE_SERIES.direct.key}
                    name={BASE_SERIES.direct.label}
                    stroke={BASE_SERIES.direct.color}
                    fill={BASE_SERIES.direct.color}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}

                {showOverhead && (
                  <Area
                    type="monotone"
                    dataKey={BASE_SERIES.overhead.key}
                    name={BASE_SERIES.overhead.label}
                    stroke={BASE_SERIES.overhead.color}
                    fill={BASE_SERIES.overhead.color}
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                )}

                {markupSeries
                  .filter((series) => visibleMarkupSet.has(series.typeId))
                  .map((series) => (
                    <Area
                      key={series.typeId}
                      type="monotone"
                      dataKey={series.key}
                      name={series.typeName}
                      stroke={series.color}
                      fill={series.color}
                      fillOpacity={0.06}
                      strokeWidth={2}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function SeriesToggleButton({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      className="h-7 border px-2 text-xs"
      style={{
        borderColor: color,
        color: active ? 'white' : color,
        backgroundColor: active ? color : 'transparent',
      }}
    >
      {label}
    </Button>
  );
}
