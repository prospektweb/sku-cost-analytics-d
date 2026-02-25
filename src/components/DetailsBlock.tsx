import { Card } from '@/components/ui/card';
import { Info } from '@phosphor-icons/react';
import type { Snapshot, Detail } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatCurrency } from '@/lib/data-utils';

interface DetailsBlockProps {
  snapshot: Snapshot | null;
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
                  <AccordionItem value={`stage-${detail.detailId}-${stage.stageId}`} className="border rounded-md px-3 mt-2">
                    <AccordionTrigger>{stage.stageName}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Добавлено на этапе</div>
                          <div className="border rounded p-2">
                            <div className="text-xs text-muted-foreground">Материал: {stage.added.material?.name || '—'}</div>
                            <div className="text-sm">Прямые затраты: {formatCurrency(stage.added.material?.purchasingPrice || 0, stage.currency)}</div>
                            <div className="text-sm">Себестоимость: {formatCurrency(stage.added.material?.basePrice || 0, stage.currency)}</div>
                          </div>
                          <div className="border rounded p-2">
                            <div className="text-xs text-muted-foreground">Операция: {stage.added.operation?.name || '—'}</div>
                            <div className="text-sm">Прямые затраты: {formatCurrency(stage.added.operation?.purchasingPrice || 0, stage.currency)}</div>
                            <div className="text-sm">Себестоимость: {formatCurrency(stage.added.operation?.basePrice || 0, stage.currency)}</div>
                          </div>
                        </div>
                        <div className="space-y-2 border rounded p-2">
                          <div className="text-sm font-medium">Габариты и вес</div>
                          <div className="text-sm">Ширина (мм): {Math.round(stage.outputs.width || 0)}</div>
                          <div className="text-sm">Длина (мм): {Math.round(stage.outputs.length || 0)}</div>
                          <div className="text-sm">Высота (мм): {Math.round(stage.outputs.height || 0)}</div>
                          <div className="text-sm">Вес (г): {Math.round(stage.outputs.weight || 0)}</div>
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
