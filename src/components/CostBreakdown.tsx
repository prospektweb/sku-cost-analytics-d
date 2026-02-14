import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartPie } from '@phosphor-icons/react';
import type { Snapshot, AggregationLevel } from '@/lib/types';
import { getCostBreakdownByDetail, getCostBreakdownByStage, formatCurrency, formatPercent } from '@/lib/data-utils';

interface CostBreakdownProps {
  snapshot: Snapshot | null;
}

export function CostBreakdown({ snapshot }: CostBreakdownProps) {
  const [aggregation, setAggregation] = useState<AggregationLevel>('detail');

  const breakdownData = useMemo(() => {
    if (!snapshot) return [];

    if (aggregation === 'detail') {
      return getCostBreakdownByDetail(snapshot);
    } else {
      return getCostBreakdownByStage(snapshot);
    }
  }, [snapshot, aggregation]);

  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartPie size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Распределение себестоимости</h2>
        </div>
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Выберите период с данными для отображения распределения
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartPie size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Распределение себестоимости</h2>
      </div>

      <Tabs value={aggregation} onValueChange={(v) => setAggregation(v as AggregationLevel)}>
        <TabsList className="mb-4">
          <TabsTrigger value="detail">По деталям</TabsTrigger>
          <TabsTrigger value="stage">По этапам</TabsTrigger>
        </TabsList>

        <TabsContent value={aggregation}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${formatPercent(percentage)}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;

                      const data = payload[0].payload;

                      return (
                        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                          <p className="font-semibold mb-2">{data.name}</p>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Стоимость: </span>
                              <span className="font-mono">{formatCurrency(data.value, snapshot.json.currency)}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Доля: </span>
                              <span className="font-mono">{formatPercent(data.percentage)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold mb-4">Детализация</h3>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                {breakdownData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-mono font-semibold">
                        {formatCurrency(item.value, snapshot.json.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercent(item.percentage)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
