import { Card } from '@/components/ui/card';
import type { Snapshot } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatCurrency } from '@/lib/data-utils';
import { ListBullets } from '@phosphor-icons/react';

interface DetailsBlockProps {
  snapshot: Snapshot | null;
}

export function DetailsBlock({ snapshot }: DetailsBlockProps) {
  if (!snapshot) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListBullets size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Детали</h2>
      </div>

      {snapshot.json.details.map((detail) => (
        <Accordion key={detail.detailId} type="single" collapsible>
          <AccordionItem value={`detail-${detail.detailId}`} className="border rounded-md px-3 mb-2">
            <AccordionTrigger>{detail.detailName}</AccordionTrigger>
            <AccordionContent>
              {detail.stages.map((stage) => {
                const overhead = (stage.outputs.basePrice || 0) - (stage.outputs.purchasingPrice || 0);
                return (
                  <div key={stage.stageId} className="border rounded-md p-3 mt-2">
                    <div className="font-medium mb-2">{stage.stageName}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Прямые затраты (нарастающее)</div>
                        <div className="font-semibold font-mono">{formatCurrency(stage.outputs.purchasingPrice || 0, stage.currency)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Накладные расходы</div>
                        <div className="font-semibold font-mono">{formatCurrency(overhead, stage.currency)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Себестоимость (нарастающее)</div>
                        <div className="font-semibold font-mono">{formatCurrency(stage.outputs.basePrice || 0, stage.currency)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </Card>
  );
}
