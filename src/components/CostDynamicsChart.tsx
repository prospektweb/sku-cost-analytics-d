import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartLine } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatDateTime, parseDateTime, formatPercent } from '@/lib/data-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CostDynamicsChartProps {
  snapshots: Snapshot[];
}

export function CostDynamicsChart({ snapshots }: CostDynamicsChartProps) {
  const [showDirect, setShowDirect] = useState(true);
  const [showCost, setShowCost] = useState(true);
  const [showOverhead, setShowOverhead] = useState(true);

  const chartData = useMemo(() => {
    return snapshots.map((snapshot) => ({
      timestamp: parseDateTime(snapshot.dateTime),
      dateTime: formatDateTime(parseDateTime(snapshot.dateTime)),
      directPurchasePrice: snapshot.json.directPurchasePrice,
      purchasePrice: snapshot.json.purchasePrice,
      overhead: snapshot.json.purchasePrice - snapshot.json.directPurchasePrice,
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [snapshots]);

  const annotatedData = useMemo(() => {
    return chartData.map((point, index) => {
      if (index === 0) return point;
      const prev = chartData[index - 1];
      return {
        ...point,
        directDelta: point.directPurchasePrice - prev.directPurchasePrice,
        baseDelta: point.purchasePrice - prev.purchasePrice,
      };
    });
  }, [chartData]);

  const header = (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ChartLine size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Динамика цены во времени</h2>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm" onClick={(e) => e.stopPropagation()}>
        <label className="flex items-center gap-2"><Checkbox checked={showDirect} onCheckedChange={(v) => setShowDirect(Boolean(v))} />Прямые затраты</label>
        <label className="flex items-center gap-2"><Checkbox checked={showCost} onCheckedChange={(v) => setShowCost(Boolean(v))} />Себестоимость</label>
        <label className="flex items-center gap-2"><Checkbox checked={showOverhead} onCheckedChange={(v) => setShowOverhead(Boolean(v))} />Накладные расходы</label>
      </div>
    </div>
  );

  if (snapshots.length === 0) {
    return (
      <Card className="p-4">
        <Accordion type="single" collapsible defaultValue="cost-dynamics" className="w-full">
          <AccordionItem value="cost-dynamics" className="border-none">
            <AccordionTrigger className="py-2">{header}</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
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
            <div className="mb-3 text-sm text-muted-foreground">
              Показывает изменение прямых затрат и себестоимости во времени.
              Область между линиями представляет накладные расходы.
            </div>

      <div className="mb-3 text-sm text-muted-foreground">
        Показывает изменение закупочной и базовой себестоимости во времени. 
        Область между линиями представляет накладные расходы.
      </div>

                  const data = payload[0].payload;
                  const overheadPercent = data.directPurchasePrice > 0 ? (data.overhead / data.directPurchasePrice) * 100 : 0;

                  return (
                    <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                      <p className="font-semibold mb-2">{data.dateTime}</p>
                      <div className="space-y-2">
                        {showDirect && (
                          <div>
                            <div className="text-sm font-medium">Прямые затраты:</div>
                            <div className="font-mono font-semibold">{formatCurrency(data.directPurchasePrice, currency)}</div>
                            {data.directDelta !== undefined && (
                              <div className={`text-xs ${data.directDelta > 0 ? 'text-green-600' : data.directDelta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {data.directDelta > 0 ? '+' : ''}{formatCurrency(data.directDelta, currency)}
                              </div>
                            )}
                          </div>
                        )}

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
