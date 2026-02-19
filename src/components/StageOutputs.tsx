import { Card } from '@/components/ui/card';
import { Info } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StageOutputsProps { snapshot: Snapshot | null; }

export function StageOutputs({ snapshot }: StageOutputsProps) {
  if (!snapshot) return <Card className="p-4"><div className="h-14 flex items-center text-muted-foreground">Выберите период с данными для отображения информации</div></Card>;

  return (
    <Card className="p-4">
      <Accordion type="single" collapsible defaultValue="order-params" className="w-full">
        <AccordionItem value="order-params">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Info size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Параметры заказа</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableBody>
                {snapshot.json.parametrValues.map((param, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{param.name}</TableCell>
                    <TableCell className="font-mono">{param.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
