import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TreeStructure, Info } from '@phosphor-icons/react';
import type { Snapshot, Stage, Detail } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/data-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type CostTreeMode = 'direct' | 'cost' | 'sales';

interface CostTreeProps {
  snapshot: Snapshot | null;
  previousSnapshot?: Snapshot | null;
  mode: CostTreeMode;
}

interface ValueMetrics {
  addedCost: number;
  stageCost: number;
  relativeChange: number;
  absoluteChange: number;
}

const modeMeta: Record<CostTreeMode, { title: string; hint?: string }> = {
  direct: {
    title: 'Дерево формирования прямых затрат',
    hint: 'Только прямые затраты без учёта накладных расходов',
  },
  cost: {
    title: 'Дерево формирования себестоимости',
    hint: 'Полная себестоимость изготовления, учитывающая накладные расходы',
  },
  sales: {
    title: 'Дерево формирования отпускной стоимости',
  },
};

export function CostTree({ snapshot, previousSnapshot, mode }: CostTreeProps) {
  const [selectedPriceTypeId, setSelectedPriceTypeId] = useState<string>('');

  const firstRange = snapshot?.json.priceRangesWithMarkup[0];
  const previousFirstRange = previousSnapshot?.json.priceRangesWithMarkup[0];

  const selectedPrice = useMemo(() => {
    if (!firstRange?.prices.length) return null;
    const fromSelector = firstRange.prices.find((item) => String(item.typeId) === selectedPriceTypeId);
    return fromSelector || firstRange.prices[0];
  }, [firstRange, selectedPriceTypeId]);

  const selectedPreviousPrice = useMemo(() => {
    if (!previousFirstRange?.prices.length || !selectedPrice) return null;
    return previousFirstRange.prices.find((item) => item.typeId === selectedPrice.typeId) || null;
  }, [previousFirstRange, selectedPrice]);

  const markupMultiplier = useMemo(() => {
    if (!snapshot || !selectedPrice || snapshot.json.purchasePrice <= 0) return 1;
    return selectedPrice.basePrice / snapshot.json.purchasePrice;
  }, [snapshot, selectedPrice]);

  const previousMarkupMultiplier = useMemo(() => {
    if (!previousSnapshot || !selectedPreviousPrice || previousSnapshot.json.purchasePrice <= 0) return 1;
    return selectedPreviousPrice.basePrice / previousSnapshot.json.purchasePrice;
  }, [previousSnapshot, selectedPreviousPrice]);

  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TreeStructure size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{modeMeta[mode].title}</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Выберите период с данными для отображения дерева
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <TreeStructure size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">{modeMeta[mode].title}</h2>
          {modeMeta[mode].hint && (
            <span title={modeMeta[mode].hint}>
              <Info size={16} className="text-muted-foreground" />
            </span>
          )}
        </div>

        {mode === 'sales' && firstRange?.prices.length ? (
          <div className="w-[280px]">
            <Select
              value={String(selectedPrice?.typeId || firstRange.prices[0].typeId)}
              onValueChange={setSelectedPriceTypeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип цены" />
              </SelectTrigger>
              <SelectContent>
                {firstRange.prices.map((price) => (
                  <SelectItem key={price.typeId} value={String(price.typeId)}>
                    {price.typeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <Accordion type="multiple" className="w-full space-y-2">
        {snapshot.json.details.map((detail) => {
          const previousDetail = previousSnapshot
            ? previousSnapshot.json.details.find((d) => d.detailId === detail.detailId || d.detailName === detail.detailName)
            : undefined;

          return (
            <DetailNode
              key={detail.detailId}
              detail={detail}
              previousDetail={previousDetail}
              snapshot={snapshot}
              mode={mode}
              markupMultiplier={markupMultiplier}
              previousMarkupMultiplier={previousMarkupMultiplier}
            />
          );
        })}
      </Accordion>
    </Card>
  );
}

function DetailNode({
  detail,
  previousDetail,
  snapshot,
  mode,
  markupMultiplier,
  previousMarkupMultiplier,
}: {
  detail: Detail;
  previousDetail?: Detail;
  snapshot: Snapshot;
  mode: CostTreeMode;
  markupMultiplier: number;
  previousMarkupMultiplier: number;
}) {
  const detailPrice = getDetailPrice(detail, mode, markupMultiplier);
  const previousDetailPrice = previousDetail
    ? getDetailPrice(previousDetail, mode, previousMarkupMultiplier)
    : null;
  const metrics = buildMetrics(detailPrice, detailPrice, previousDetailPrice);

  return (
    <AccordionItem value={`detail-${detail.detailId}`} className="border rounded-md px-3">
      <AccordionTrigger>
        <NodeHeader name={detail.detailName} subtitle="Деталь" metrics={metrics} currency={snapshot.json.currency} />
      </AccordionTrigger>
      <AccordionContent>
        <Accordion type="multiple" className="space-y-2">
          {detail.stages.map((stage) => {
            const previousStage = previousDetail?.stages.find(
              (s) => s.stageId === stage.stageId || s.stageName === stage.stageName,
            );

            const stagePrice = getStageCumulativePrice(stage, mode, markupMultiplier);
            const stageAdded = getStageAddedPrice(stage, mode, markupMultiplier);
            const previousStagePrice = previousStage
              ? getStageCumulativePrice(previousStage, mode, previousMarkupMultiplier)
              : null;

            const stageMetrics = buildMetrics(stageAdded, stagePrice, previousStagePrice);

            return (
              <AccordionItem
                key={stage.stageId}
                value={`stage-${detail.detailId}-${stage.stageId}`}
                className="border rounded-md px-3"
              >
                <AccordionTrigger>
                  <NodeHeader name={stage.stageName} subtitle="Этап" metrics={stageMetrics} currency={stage.currency} />
                </AccordionTrigger>
                <AccordionContent>
                  <StageSections
                    stage={stage}
                    previousStage={previousStage}
                    currency={stage.currency}
                    mode={mode}
                    markupMultiplier={markupMultiplier}
                    previousMarkupMultiplier={previousMarkupMultiplier}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}

function StageSections({
  stage,
  previousStage,
  currency,
  mode,
  markupMultiplier,
  previousMarkupMultiplier,
}: {
  stage: Stage;
  previousStage?: Stage;
  currency: string;
  mode: CostTreeMode;
  markupMultiplier: number;
  previousMarkupMultiplier: number;
}) {
  const materialCost = getAddedValue(stage.added.material, mode, markupMultiplier);
  const previousMaterialCost = getAddedValue(previousStage?.added?.material, mode, previousMarkupMultiplier);

  const operationCost = getAddedValue(stage.added.operation, mode, markupMultiplier);
  const previousOperationCost = getAddedValue(previousStage?.added?.operation, mode, previousMarkupMultiplier);

  const equipmentCost = getAddedValue(stage.added.equipment, mode, markupMultiplier);
  const previousEquipmentCost = getAddedValue(previousStage?.added?.equipment, mode, previousMarkupMultiplier);

  return (
    <div className="space-y-2">
      <NodeLine
        title={`Материал: ${stage.added.material?.name || '—'}`}
        metrics={buildMetrics(materialCost, materialCost, previousMaterialCost || null)}
        currency={currency}
      />
      <NodeLine
        title={`Операция: ${stage.added.operation?.name || '—'}`}
        metrics={buildMetrics(operationCost, operationCost, previousOperationCost || null)}
        currency={currency}
      />
      {stage.added.equipment?.name ? (
        <NodeLine
          title={`Техника: ${stage.added.equipment.name}`}
          metrics={buildMetrics(equipmentCost, equipmentCost, previousEquipmentCost || null)}
          currency={currency}
        />
      ) : null}

      <Accordion type="single" collapsible>
        <AccordionItem value="outputs">
          <AccordionTrigger>Основные результаты</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(stage.outputs || {}).map(([key, value]) => (
                <div key={key} className="text-sm flex items-center justify-between border rounded px-2 py-1">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-mono">{typeof value === 'number' ? formatNumber(value) : value}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reference">
          <AccordionTrigger>Дополнительные результаты</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {(stage.reference || []).map((ref, idx) => (
                <div
                  key={`${ref.name}-${idx}`}
                  className="text-sm flex items-center justify-between border rounded px-2 py-1"
                >
                  <span className="text-muted-foreground">{ref.name}</span>
                  <span className="font-mono">{ref.value}</span>
                </div>
              ))}
              {!stage.reference?.length && <div className="text-sm text-muted-foreground">Нет данных</div>}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function NodeHeader({
  name,
  subtitle,
  metrics,
  currency,
}: {
  name: string;
  subtitle: string;
  metrics: ValueMetrics;
  currency: string;
}) {
  return (
    <div className="w-full pr-3">
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-muted-foreground mb-1">{subtitle}</div>
      <MetricRow metrics={metrics} currency={currency} />
    </div>
  );
}

function NodeLine({ title, metrics, currency }: { title: string; metrics: ValueMetrics; currency: string }) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-sm font-medium mb-1">{title}</div>
      <MetricRow metrics={metrics} currency={currency} />
    </div>
  );
}

function MetricRow({ metrics, currency }: { metrics: ValueMetrics; currency: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span title="Добавленная стоимость" className="font-mono">{formatCurrency(metrics.addedCost, currency)}</span>
      <span title="Стоимость материалов/операций на текущем этапе" className="font-mono">{formatCurrency(metrics.stageCost, currency)}</span>
      <span title="Относительный показатель изменения стоимости" className="font-mono">{formatNumber(metrics.relativeChange)}%</span>
      <span title="Абсолютный показатель изменения стоимости" className="font-mono">{formatCurrency(metrics.absoluteChange, currency)}</span>
    </div>
  );
}

function buildMetrics(addedCost: number, stageCost: number, previousComparable: number | null): ValueMetrics {
  const absoluteChange = previousComparable === null ? 0 : stageCost - previousComparable;
  const relativeChange = previousComparable && previousComparable !== 0
    ? (absoluteChange / previousComparable) * 100
    : 0;

  return {
    addedCost,
    stageCost,
    relativeChange,
    absoluteChange,
  };
}

function getAddedValue(
  node: { purchasingPrice?: number; basePrice?: number } | undefined,
  mode: CostTreeMode,
  markupMultiplier: number,
): number {
  if (!node) return 0;
  if (mode === 'direct') return node.purchasingPrice || 0;
  if (mode === 'cost') return node.basePrice || 0;
  return (node.basePrice || 0) * markupMultiplier;
}

function getStageAddedPrice(stage: Stage, mode: CostTreeMode, markupMultiplier: number): number {
  return (
    getAddedValue(stage.added.material, mode, markupMultiplier) +
    getAddedValue(stage.added.operation, mode, markupMultiplier) +
    getAddedValue(stage.added.equipment, mode, markupMultiplier)
  );
}

function getStageCumulativePrice(stage: Stage, mode: CostTreeMode, markupMultiplier: number): number {
  if (mode === 'direct') return stage.outputs?.purchasingPrice || 0;
  if (mode === 'cost') return stage.outputs?.basePrice || 0;
  return (stage.outputs?.basePrice || 0) * markupMultiplier;
}

function getDetailPrice(detail: Detail, mode: CostTreeMode, markupMultiplier: number): number {
  if (mode === 'direct') return detail.purchasePrice;
  if (mode === 'cost') return detail.basePrice;
  return detail.basePrice * markupMultiplier;
}
