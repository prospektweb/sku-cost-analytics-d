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
  mode: CostTreeMode;
}

interface ValueMetrics {
  addedCost: number;
  price: number;
  percentChange: number;
  deltaAmount: number;
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

export function CostTree({ snapshot, mode }: CostTreeProps) {
  const [selectedPriceTypeId, setSelectedPriceTypeId] = useState<string>('');

  const firstRange = snapshot?.json.priceRangesWithMarkup[0];

  const selectedPrice = useMemo(() => {
    if (!firstRange?.prices.length) return null;
    const fromSelector = firstRange.prices.find((item) => String(item.typeId) === selectedPriceTypeId);
    return fromSelector || firstRange.prices[0];
  }, [firstRange, selectedPriceTypeId]);

  const markupMultiplier = useMemo(() => {
    if (!snapshot || !selectedPrice || snapshot.json.purchasePrice <= 0) return 1;
    return selectedPrice.basePrice / snapshot.json.purchasePrice;
  }, [snapshot, selectedPrice]);

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
        {snapshot.json.details.map((detail) => (
          <DetailNode
            key={detail.detailId}
            detail={detail}
            snapshot={snapshot}
            mode={mode}
            markupMultiplier={markupMultiplier}
          />
        ))}
      </Accordion>
    </Card>
  );
}

function DetailNode({
  detail,
  snapshot,
  mode,
  markupMultiplier,
}: {
  detail: Detail;
  snapshot: Snapshot;
  mode: CostTreeMode;
  markupMultiplier: number;
}) {
  const detailPrice = getDetailPrice(detail, mode, markupMultiplier);
  const metrics = buildMetrics(detailPrice, 0, detailPrice);

  return (
    <AccordionItem value={`detail-${detail.detailId}`} className="border rounded-md px-3">
      <AccordionTrigger>
        <NodeHeader
          name={detail.detailName}
          label="Деталь"
          metrics={metrics}
          currency={snapshot.json.currency}
        />
      </AccordionTrigger>
      <AccordionContent>
        <Accordion type="multiple" className="space-y-2">
          {detail.stages.map((stage, index) => {
            const previousPrice = index === 0 ? 0 : getStageCumulativePrice(detail.stages[index - 1], mode, markupMultiplier);
            const stagePrice = getStageCumulativePrice(stage, mode, markupMultiplier);
            const stageAdded = getStageAddedPrice(stage, mode, markupMultiplier);
            const stageMetrics = buildMetrics(stageAdded, previousPrice, stagePrice);

            return (
              <AccordionItem key={stage.stageId} value={`stage-${detail.detailId}-${stage.stageId}`} className="border rounded-md px-3">
                <AccordionTrigger>
                  <NodeHeader
                    name={stage.stageName}
                    label="Этап"
                    metrics={stageMetrics}
                    currency={stage.currency}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <StageSections
                    stage={stage}
                    metrics={stageMetrics}
                    currency={stage.currency}
                    mode={mode}
                    markupMultiplier={markupMultiplier}
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
  currency,
  mode,
  markupMultiplier,
}: {
  stage: Stage;
  metrics: ValueMetrics;
  currency: string;
  mode: CostTreeMode;
  markupMultiplier: number;
}) {
  const materialCost = getAddedValue(stage.added.material, mode, markupMultiplier);
  const operationCost = getAddedValue(stage.added.operation, mode, markupMultiplier);
  const equipmentCost = getAddedValue(stage.added.equipment, mode, markupMultiplier);

  return (
    <div className="space-y-3">
      <NodeLine
        title={`Материал: ${stage.added.material?.name || '—'}`}
        metrics={buildMetrics(materialCost, 0, materialCost)}
        currency={currency}
      />
      <NodeLine
        title={`Операция: ${stage.added.operation?.name || '—'}`}
        metrics={buildMetrics(operationCost, 0, operationCost)}
        currency={currency}
      />
      {stage.added.equipment?.name ? (
        <NodeLine
          title={`Техника: ${stage.added.equipment.name}`}
          metrics={buildMetrics(equipmentCost, 0, equipmentCost)}
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
                <div key={`${ref.name}-${idx}`} className="text-sm flex items-center justify-between border rounded px-2 py-1">
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
  label,
  metrics,
  currency,
}: {
  name: string;
  label: string;
  metrics: ValueMetrics;
  currency: string;
}) {
  return (
    <div className="w-full pr-3">
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
      <div>+добавленная стоимость: <span className="font-mono">{formatCurrency(metrics.addedCost, currency)}</span></div>
      <div>+цена: <span className="font-mono">{formatCurrency(metrics.price, currency)}</span></div>
      <div>+процент изменения цены: <span className="font-mono">{formatNumber(metrics.percentChange)}%</span></div>
      <div>+сумма изменения цены: <span className="font-mono">{formatCurrency(metrics.deltaAmount, currency)}</span></div>
    </div>
  );
}

function buildMetrics(addedCost: number, previousPrice: number, currentPrice: number): ValueMetrics {
  const deltaAmount = currentPrice - previousPrice;
  const percentChange = previousPrice > 0 ? (deltaAmount / previousPrice) * 100 : 0;
  return {
    addedCost,
    price: currentPrice,
    percentChange,
    deltaAmount,
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
