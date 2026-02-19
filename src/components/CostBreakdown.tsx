import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartPie } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { getCostBreakdownByDetail, getCostBreakdownByStage, formatCurrency, formatPercent } from '@/lib/data-utils';

interface CostBreakdownProps {
  snapshot: Snapshot | null;
}

export function CostBreakdown({ snapshot }: CostBreakdownProps) {
  const detailData = useMemo(() => (snapshot ? getCostBreakdownByDetail(snapshot) : []), [snapshot]);
  const stageData = useMemo(() => (snapshot ? getCostBreakdownByStage(snapshot) : []), [snapshot]);

  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartPie size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Распределение себестоимости по деталям и этапам</h2>
        </div>
        <div className="flex items-center justify-center h-96 text-muted-foreground">Выберите период с данными для отображения распределения</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartPie size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Распределение себестоимости по деталям и этапам</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BreakdownChart title="По деталям" data={detailData} currency={snapshot.json.currency} />
        <BreakdownChart title="По этапам" data={stageData} currency={snapshot.json.currency} />
      </div>
    </Card>
  );
}

function BreakdownChart({ title, data, currency }: { title: string; data: ReturnType<typeof getCostBreakdownByDetail>; currency: string }) {
  return (
    <div className="bg-muted/20 rounded-lg p-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            label={({ percentage }) => formatPercent(percentage)}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
                  <div className="font-semibold">{row.name}</div>
                  <div className="font-mono">{formatCurrency(row.value, currency)}</div>
                  <div className="text-muted-foreground">{formatPercent(row.percentage)}</div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
