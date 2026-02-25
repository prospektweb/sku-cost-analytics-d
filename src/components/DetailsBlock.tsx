import { Card } from '@/components/ui/card';
import { Info } from '@phosphor-icons/react';
import type { Snapshot, Detail, Stage } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatCurrency, formatNumber } from '@/lib/data-utils';
import { Separator } from '@/components/ui/separator';

interface DetailsBlockProps {
  snapshot: Snapshot | null;
}

interface SectionLine {
  key: string;
  title: string;
  direct: number;
  total: number;
}

export function DetailsBlock({ snapshot }: DetailsBlockProps) {
  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="h-14 flex items-center text-muted-foreground">Выберите период с данными для отображения деталей</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Accordion type="single" collapsible defaultValue="details" className="w-full">
        <AccordionItem value="details">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Info size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Детали</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <section className="space-y-2">
              {snapshot.json.details.map((detail) => (
                <DetailNode key={detail.detailId} detail={detail} parentPath={[]} level={0} />
              ))}
            </section>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function DetailNode({ detail, parentPath, level }: { detail: Detail; parentPath: string[]; level: number }) {
  const currentPath = [...parentPath, detail.detailName];

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={`detail-${detail.detailId}-${level}`} className="border rounded-md px-3">
        <AccordionTrigger>{currentPath.join(' > ')}</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {detail.stages.map((stage) => {
              const overhead = (stage.outputs.basePrice || 0) - (stage.outputs.purchasingPrice || 0);
              return (
                <Accordion key={`${detail.detailId}-${stage.stageId}`} type="single" collapsible>
                  <AccordionItem value={`stage-${detail.detailId}-${stage.stageId}`} className="border rounded-md px-3 mt-2 bg-white">
                    <AccordionTrigger>{stage.stageName}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Добавлено на этапе</div>
                          <StageAddedSections stage={stage} />
                        </div>
                        <div className="space-y-2 border rounded p-2 bg-white">
                          <div className="text-sm font-medium">Показатели детали</div>
                          <div className="text-sm">Ширина (мм): {formatNumber(stage.outputs.width || 0)}</div>
                          <div className="text-sm">Длина (мм): {formatNumber(stage.outputs.length || 0)}</div>
                          <div className="text-sm">Высота (мм): {formatNumber(stage.outputs.height || 0)}</div>
                          <div className="text-sm">Вес (кг): {formatNumber((stage.outputs.weight || 0) / 1000)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t">
                        <div><div className="text-xs text-muted-foreground">Прямые затраты (нарастающее)</div><div className="font-semibold font-mono">{formatCurrency(stage.outputs.purchasingPrice || 0, stage.currency)}</div></div>
                        <div><div className="text-xs text-muted-foreground">Накладные расходы (распределенные на этап)</div><div className="font-semibold font-mono">{formatCurrency(overhead, stage.currency)}</div></div>
                        <div><div className="text-xs text-muted-foreground">Себестоимость (нарастающее)</div><div className="font-semibold font-mono">{formatCurrency(stage.outputs.basePrice || 0, stage.currency)}</div></div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}

            {detail.children && detail.children.length > 0 && (
              <div className="pt-2 space-y-2">
                {detail.children.map((child) => (
                  <DetailNode key={child.detailId} detail={child} parentPath={currentPath} level={level + 1} />
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function StageAddedSections({ stage }: { stage: Stage }) {
  const lines: SectionLine[] = [];

  if (stage.added.material?.name) {
    lines.push({
      key: 'material',
      title: `Материал: ${stage.added.material.name}`,
      direct: stage.added.material.purchasingPrice || 0,
      total: stage.added.material.basePrice || 0,
    });
  }

  if (stage.added.operation?.name) {
    lines.push({
      key: 'operation',
      title: `Операция: ${stage.added.operation.name}`,
      direct: stage.added.operation.purchasingPrice || 0,
      total: stage.added.operation.basePrice || 0,
    });
  }

  const equipmentName = Array.isArray(stage.added.equipment) ? undefined : stage.added.equipment?.name;
  if (equipmentName) {
    const equipment = Array.isArray(stage.added.equipment) ? undefined : stage.added.equipment;
    lines.push({
      key: 'equipment',
      title: `Оборудование: ${equipmentName}`,
      direct: equipment?.purchasingPrice || 0,
      total: equipment?.basePrice || 0,
    });
  }

  return (
    <>
      {lines.map((line) => {
        const overhead = line.total - line.direct;
        const directPercent = line.total > 0 ? (line.direct / line.total) * 100 : 0;
        const overheadPercent = line.total > 0 ? (overhead / line.total) * 100 : 0;
        const plusPercent = line.direct > 0 ? ((line.total - line.direct) / line.direct) * 100 : 0;

        return (
          <div key={line.key} className="border rounded p-2 bg-white space-y-1">
            <div className="text-xs text-muted-foreground">{line.title}</div>
            <div className="text-sm">Прямые затраты: {formatCurrency(line.direct, stage.currency)} | {formatNumber(directPercent)}%</div>
            <div className="text-sm">Накладные расходы: {formatCurrency(overhead, stage.currency)} | {formatNumber(overheadPercent)}%</div>
            <Separator className="my-1" />
            <div className="text-sm">Себестоимость: {formatCurrency(line.total, stage.currency)} (ПЗ +{formatNumber(plusPercent)}%)</div>
          </div>
        );
      })}

      {stage.reference && stage.reference.length > 0 && (
        <div className="border rounded p-2 bg-white space-y-1">
          <div className="text-xs text-muted-foreground">Справочные данные</div>
          {stage.reference.map((item, idx) => (
            <div className="text-sm" key={`${item.name}-${idx}`}>
              {item.name}: <span className="font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
