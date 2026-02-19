import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TreeStructure, Info } from '@phosphor-icons/react';
import type { Snapshot, Stage, Detail } from '@/lib/types';
import { formatCurrency, formatNumber, getDetailDirectCost, getDetailCost } from '@/lib/data-utils';

export type CostTreeMode = 'direct' | 'cost';

interface CostTreeProps {
  snapshot: Snapshot | null;
  previousSnapshot?: Snapshot | null;
  mode: CostTreeMode;
}

interface ValueMetrics {
  stageValue: number;
  addedCost: number;
  relativeChange: number;
  absoluteChange: number;
}

const modeMeta = {
  direct: { title: 'Дерево формирования прямых затрат', metric: 'Прямые затраты по этапу' },
  cost: { title: 'Дерево формирования себестоимости', metric: 'Себестоимость по этапу' },
} as const;

export function CostTree({ snapshot, previousSnapshot, mode }: CostTreeProps) {
  if (!snapshot) return <Card className="p-4"><div className="h-64 flex items-center justify-center text-muted-foreground">Выберите период с данными</div></Card>;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3"><TreeStructure size={20} className="text-primary" /><h2 className="text-lg font-semibold">{modeMeta[mode].title}</h2><Info size={16} className="text-muted-foreground" /></div>
      <Accordion type="multiple" className="space-y-2">
        {snapshot.json.details.map((detail) => {
          const previousDetail = previousSnapshot?.json.details.find((d) => d.detailId === detail.detailId || d.detailName === detail.detailName);
          return <DetailNode key={detail.detailId} detail={detail} previousDetail={previousDetail} mode={mode} currency={snapshot.json.currency} />;
        })}
      </Accordion>
    </Card>
  );
}

function DetailNode({ detail, previousDetail, mode, currency }: { detail: Detail; previousDetail?: Detail; mode: CostTreeMode; currency: string }) {
  const value = mode === 'direct' ? getDetailDirectCost(detail) : getDetailCost(detail);
  const prev = previousDetail ? (mode === 'direct' ? getDetailDirectCost(previousDetail) : getDetailCost(previousDetail)) : null;
  const metrics = buildMetrics(value, value, prev);

  return <AccordionItem value={`d-${detail.detailId}`} className="border rounded-md px-3"><AccordionTrigger><NodeHeader name={detail.detailName} subtitle="Деталь" metrics={metrics} currency={currency} metricTitle={modeMeta[mode].metric} /></AccordionTrigger><AccordionContent><Accordion type="multiple" className="space-y-2">{detail.stages.map((stage) => {
    const previousStage = previousDetail?.stages.find((s) => s.stageId === stage.stageId || s.stageName === stage.stageName);
    const stageValue = mode === 'direct' ? (stage.outputs.purchasingPrice || 0) : (stage.outputs.basePrice || 0);
    const stageAdded = mode === 'direct'
      ? (stage.added.material?.purchasingPrice || 0) + (stage.added.operation?.purchasingPrice || 0)
      : (stage.added.material?.basePrice || 0) + (stage.added.operation?.basePrice || 0);
    const prevStageValue = previousStage ? (mode === 'direct' ? (previousStage.outputs.purchasingPrice || 0) : (previousStage.outputs.basePrice || 0)) : null;
    return <AccordionItem key={stage.stageId} value={`s-${detail.detailId}-${stage.stageId}`} className="border rounded-md px-3"><AccordionTrigger><NodeHeader name={stage.stageName} subtitle="Этап" metrics={buildMetrics(stageAdded, stageValue, prevStageValue)} currency={stage.currency} metricTitle={modeMeta[mode].metric} /></AccordionTrigger><AccordionContent><NodeLine title={`Материал: ${stage.added.material?.name || '—'}`} metrics={buildMetrics(stageAdded, stageAdded, null)} currency={stage.currency} metricTitle={modeMeta[mode].metric} /><NodeLine title={`Операция: ${stage.added.operation?.name || '—'}`} metrics={buildMetrics(stageAdded, stageAdded, null)} currency={stage.currency} metricTitle={modeMeta[mode].metric} /></AccordionContent></AccordionItem>;
  })}</Accordion></AccordionContent></AccordionItem>;
}

function NodeHeader({ name, subtitle, metrics, currency, metricTitle }: { name: string; subtitle: string; metrics: ValueMetrics; currency: string; metricTitle: string }) {
  return <div className="w-full pr-3"><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground mb-1">{subtitle}</div><MetricRow metrics={metrics} currency={currency} metricTitle={metricTitle} /></div>;
}

function NodeLine({ title, metrics, currency, metricTitle }: { title: string; metrics: ValueMetrics; currency: string; metricTitle: string }) {
  return <div className="border rounded-md p-2 mb-2"><div className="text-sm font-medium mb-1">{title}</div><MetricRow metrics={metrics} currency={currency} metricTitle={metricTitle} /></div>;
}

function MetricRow({ metrics, currency, metricTitle }: { metrics: ValueMetrics; currency: string; metricTitle: string }) {
  const relClass = metrics.relativeChange > 0 ? 'text-green-600' : metrics.relativeChange < 0 ? 'text-red-600' : 'text-muted-foreground';
  const absClass = metrics.absoluteChange > 0 ? 'text-green-600' : metrics.absoluteChange < 0 ? 'text-red-600' : 'text-muted-foreground';
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-xs"><span className="font-mono text-foreground" title={metricTitle}>{formatCurrency(metrics.stageValue, currency)}</span><span className="font-mono text-muted-foreground" title="Добавленная стоимость">{formatCurrency(metrics.addedCost, currency)}</span><span className={`font-mono ${relClass}`}>{formatNumber(metrics.relativeChange)}%</span><span className={`font-mono ${absClass}`}>{formatCurrency(metrics.absoluteChange, currency)}</span></div>;
}

function buildMetrics(addedCost: number, stageValue: number, previousComparable: number | null): ValueMetrics {
  const absoluteChange = previousComparable === null ? 0 : stageValue - previousComparable;
  const relativeChange = previousComparable && previousComparable !== 0 ? (absoluteChange / previousComparable) * 100 : 0;
  return { addedCost, stageValue, relativeChange, absoluteChange };
}
