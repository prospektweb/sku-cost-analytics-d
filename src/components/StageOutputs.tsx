import { Card } from '@/components/ui/card';
import { Info } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatNumber, formatKey, formatCurrency } from '@/lib/data-utils';

interface StageOutputsProps {
  snapshot: Snapshot | null;
}

const EXCLUDED_OUTPUT_KEYS = ['purchasingPrice', 'basePrice'];

export function StageOutputs({ snapshot }: StageOutputsProps) {
  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Параметры расчёта</h2>
        </div>
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Выберите период с данными для отображения информации
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Accordion type="single" collapsible defaultValue="" className="w-full">
        <AccordionItem value="calc-params">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Info size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Параметры расчёта</h2>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Параметры заказа</h3>
                <Table>
                  <TableHeader className="bg-muted/60">
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
              </div>

              {snapshot.json.details.map((detail, detailIndex) => (
                <Accordion key={detail.detailId} type="single" collapsible>
                  <AccordionItem value={`detail-${detailIndex}`}>
                    <AccordionTrigger>{detail.detailName} - Выходы этапов</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {detail.stages.map((stage) => (
                          <Accordion key={stage.stageId} type="single" collapsible>
                            <AccordionItem value={`stage-${stage.stageId}`} className="border rounded-md px-3">
                              <AccordionTrigger>{stage.stageName}</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3">
                                  {stage.added && (
                                    <div className="bg-muted/20 rounded-lg p-3">
                                      <h5 className="text-sm font-medium text-muted-foreground mb-2">Добавлено на этапе:</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <div className="text-xs text-muted-foreground mb-1">Материалы</div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                              <span>Закупочная:</span>
                                              <span className="font-mono">{formatCurrency(stage.added.material?.purchasingPrice || 0, stage.currency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                              <span>Базовая:</span>
                                              <span className="font-mono">{formatCurrency(stage.added.material?.basePrice || 0, stage.currency)}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-muted-foreground mb-1">Операции</div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                              <span>Закупочная:</span>
                                              <span className="font-mono">{formatCurrency(stage.added.operation?.purchasingPrice || 0, stage.currency)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                              <span>Базовая:</span>
                                              <span className="font-mono">{formatCurrency(stage.added.operation?.basePrice || 0, stage.currency)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <h5 className="text-sm font-medium text-muted-foreground mb-2">Кумулятивные значения:</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {Object.entries(stage.outputs)
                                        .filter(([key]) => !EXCLUDED_OUTPUT_KEYS.includes(key))
                                        .map(([key, value]) => (
                                          <div key={key} className="space-y-1">
                                            <div className="text-xs text-muted-foreground">{formatKey(key)}</div>
                                            <div className="text-sm font-mono">
                                              {typeof value === 'number' ? formatNumber(value) : value}
                                            </div>
                                          </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs text-muted-foreground">Нарастающая закупочная</div>
                                        <div className="text-lg font-mono font-semibold">
                                          {formatCurrency(stage.outputs.purchasingPrice || 0, stage.currency)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground">Нарастающая базовая</div>
                                        <div className="text-lg font-mono font-semibold">
                                          {formatCurrency(stage.outputs.basePrice || 0, stage.currency)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}

              <Accordion type="single" collapsible>
                <AccordionItem value="price-ranges">
                  <AccordionTrigger>Наценки для групп покупателей</AccordionTrigger>
                  <AccordionContent>
                    {snapshot.json.priceRangesWithMarkup.map((range, index) => (
                      <div key={index} className="mb-4">
                        <h4 className="font-semibold mb-3">
                          Количество: {range.quantityFrom}
                          {range.quantityTo !== null ? ` - ${range.quantityTo}` : '+'}
                        </h4>
                        <Table>
                          <TableHeader className="bg-muted/60">
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
