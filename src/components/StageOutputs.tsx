import { Card } from '@/components/ui/card';
import { Info } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatNumber } from '@/lib/data-utils';

interface StageOutputsProps {
  snapshot: Snapshot | null;
}

export function StageOutputs({ snapshot }: StageOutputsProps) {
  if (!snapshot) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Info size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Дополнительная информация</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Выберите период с данными для отображения информации
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Info size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Дополнительная информация</h2>
      </div>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="parameters">
          <AccordionTrigger>Параметры расчета</AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Параметр</TableHead>
                  <TableHead>Значение</TableHead>
                </TableRow>
              </TableHeader>
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

        {snapshot.json.details.map((detail, detailIndex) => (
          <AccordionItem key={detail.detailId} value={`detail-${detailIndex}`}>
            <AccordionTrigger>{detail.detailName} - Выходы этапов</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {detail.stages.map((stage) => (
                  <div key={stage.stageId} className="border border-border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{stage.stageName}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(stage.outputs).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-xs text-muted-foreground">{formatKey(key)}</div>
                          <div className="text-sm font-mono">
                            {typeof value === 'number' ? formatNumber(value) : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}

        <AccordionItem value="price-ranges">
          <AccordionTrigger>Ценовые диапазоны</AccordionTrigger>
          <AccordionContent>
            {snapshot.json.priceRangesWithMarkup.map((range, index) => (
              <div key={index} className="mb-4">
                <h4 className="font-semibold mb-3">
                  Количество: {range.quantityFrom}
                  {range.quantityTo !== null ? ` - ${range.quantityTo}` : '+'}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип цены</TableHead>
                      <TableHead className="text-right">Себестоимость</TableHead>
                      <TableHead className="text-right">Отпускная цена</TableHead>
                      <TableHead className="text-right">Наценка</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {range.prices.map((price) => {
                      const markup =
                        price.purchasePrice > 0
                          ? ((price.basePrice - price.purchasePrice) / price.purchasePrice) * 100
                          : 0;

                      return (
                        <TableRow key={price.typeId}>
                          <TableCell className="font-medium">{price.typeName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(price.purchasePrice)} {price.currency}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(price.basePrice)} {price.currency}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            +{formatNumber(markup)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    width: 'Ширина (мм)',
    length: 'Длина (мм)',
    height: 'Высота (мм)',
    weight: 'Вес (г)',
    purchasingPrice: 'Себестоимость',
    basePrice: 'Отпускная цена',
    widthproduct: 'Ширина продукта',
    lengthproduct: 'Длина продукта',
    kolichestvo_listov_bumagi_s_priladkoy: 'Кол-во листов с приладкой',
    kolichestvo_listov_bumagi_bez_priladki: 'Кол-во листов без приладки',
    vmestimost: 'Вместимость',
    koeffitsient_svoy_chuzhoy_oborot: 'Коэффициент своя/чужая',
    kolichestvo_priladok: 'Кол-во приладок',
    stoimost_priladki_dlya_storony_1: 'Стоимость приладки сторона 1',
    stoimost_priladki_dlya_storony_2: 'Стоимость приладки сторона 2',
    summa_po_vsem_priladkam: 'Сумма по всем приладкам',
  };

  return keyMap[key] || key;
}
