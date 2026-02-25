import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartPie } from '@phosphor-icons/react';
import type { Snapshot, CostBreakdownItem } from '@/lib/types';
import {
  formatCurrency,
  formatPercent,
  getCostBreakdownByDetail,
  getCostBreakdownByStageForDetail,
  getOverallStageEstimate,
} from '@/lib/data-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CostBreakdownProps {
  snapshot: Snapshot | null;
}

export function CostBreakdown({ snapshot }: CostBreakdownProps) {
  const detailData = useMemo(() => (snapshot ? getCostBreakdownByDetail(snapshot) : []), [snapshot]);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const activeDetailId = useMemo(() => {
    if (!detailData.length) return null;
    if (selectedDetailId && detailData.some((item) => item.id === selectedDetailId)) return selectedDetailId;
    return detailData[0].id;
  }, [detailData, selectedDetailId]);

  const selectedDetail = useMemo(() => detailData.find((item) => item.id === activeDetailId) || null, [detailData, activeDetailId]);

  const stageDataForSelectedDetail = useMemo(() => {
    if (!snapshot || !activeDetailId) return [];
    return getCostBreakdownByStageForDetail(snapshot, activeDetailId);
  }, [snapshot, activeDetailId]);

  const overallStageData = useMemo(() => (snapshot ? getOverallStageEstimate(snapshot) : []), [snapshot]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Accordion type="single" collapsible defaultValue="cost-breakdown" className="w-full">
          <AccordionItem value="cost-breakdown" className="border-none">
            <AccordionTrigger className="py-2">
              <div className="flex items-center gap-2">
                <ChartPie size={20} className="text-primary" />
                <h2 className="text-lg font-semibold">Распределение себестоимости по деталям и этапам</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {!snapshot ? (
                <div className="flex items-center justify-center h-96 text-muted-foreground">Выберите период с данными для отображения распределения</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <CostBreakdownPanel
                    title="По деталям"
                    data={detailData}
                    currency={snapshot.json.currency}
                    activeId={activeDetailId}
                    onSliceClick={setSelectedDetailId}
                  />
                  <CostBreakdownPanel
                    title={selectedDetail ? `Этапы детали: ${selectedDetail.name}` : 'По этапам выбранной детали'}
                    data={stageDataForSelectedDetail}
                    currency={snapshot.json.currency}
                    emptyText="Выберите деталь слева для отображения этапов"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Общая смета распределения себестоимости по всем этапам</h2>
        {!snapshot ? (
          <div className="flex items-center justify-center h-72 text-muted-foreground">Выберите период с данными для отображения сметы</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            <div className="bg-muted/20 rounded-lg p-3">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={overallStageData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    labelLine={false}
                    label={({ percentage }) => formatPercent(percentage)}
                  >
                    {overallStageData.map((entry) => (
                      <Cell key={`overall-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <CostChartTooltip currency={snapshot.json.currency} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-muted/20 rounded-lg p-3">
              <h3 className="font-semibold mb-2">Легенда</h3>
              <CostBreakdownLegend data={overallStageData} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function CostBreakdownPanel({
  title,
  data,
  currency,
  activeId,
  onSliceClick,
  emptyText,
}: {
  title: string;
  data: CostBreakdownItem[];
  currency: string;
  activeId?: string | null;
  onSliceClick?: (id: string) => void;
  emptyText?: string;
}) {
  return (
    <div className="bg-muted/20 rounded-lg p-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-80 text-sm text-muted-foreground">{emptyText || 'Нет данных для отображения'}</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
                label={({ percentage }) => formatPercent(percentage)}
                dataKey="value"
                onClick={(entry) => {
                  if (onSliceClick && entry?.id) onSliceClick(String(entry.id));
                }}
              >
                {data.map((entry) => {
                  const isActive = activeId ? entry.id === activeId : false;
                  return <Cell key={`cell-${entry.id}`} fill={entry.color} stroke={isActive ? 'hsl(var(--foreground))' : 'transparent'} strokeWidth={isActive ? 2 : 0} />;
                })}
              </Pie>
              <CostChartTooltip currency={currency} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2">
            <CostBreakdownLegend data={data} activeId={activeId} onItemClick={onSliceClick} />
          </div>
        </>
      )}
    </div>
  );
}

function CostChartTooltip({ currency }: { currency: string }) {
  return (
    <Tooltip
      content={({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;
        const row = payload[0].payload as CostBreakdownItem;

        return (
          <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
            <div className="font-semibold">{row.name}</div>
            <div className="font-mono">{formatCurrency(row.value, currency)}</div>
            <div className="text-muted-foreground">{formatPercent(row.percentage)}</div>
          </div>
        );
      }}
    />
  );
}

function CostBreakdownLegend({
  data,
  activeId,
  onItemClick,
}: {
  data: CostBreakdownItem[];
  activeId?: string | null;
  onItemClick?: (id: string) => void;
}) {
  return (
    <div className="space-y-1 text-sm">
      {data.map((item) => {
        const isActive = activeId ? item.id === activeId : false;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item.id)}
            className={`w-full flex items-center justify-between text-left rounded px-1 py-0.5 ${isActive ? 'bg-primary/10' : ''}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="text-muted-foreground shrink-0 ml-2">{formatPercent(item.percentage)}</span>
          </button>
        );
      })}
    </div>
  );
}
