import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartBar } from '@phosphor-icons/react';
import type { Snapshot, Detail, Stage } from '@/lib/types';
import { formatCurrency, formatNumber, getChartColor } from '@/lib/data-utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StageCostFormationChartProps {
  snapshot: Snapshot | null;
}

export function StageCostFormationChart({ snapshot }: StageCostFormationChartProps) {
  const [selectedDetailId, setSelectedDetailId] = useState<string>('');

  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartBar size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Формирование стоимости по этапам</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Выберите период с данными для отображения
        </div>
      </Card>
    );
  }

  // Set initial selected detail
  if (!selectedDetailId && snapshot.json.details.length > 0) {
    setSelectedDetailId(snapshot.json.details[0].detailId);
  }

  const selectedDetail = snapshot.json.details.find(d => d.detailId === selectedDetailId);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChartBar size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Формирование стоимости по этапам</h2>
        </div>
        
        {snapshot.json.details.length > 1 && (
          <Select value={selectedDetailId} onValueChange={setSelectedDetailId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Выберите деталь" />
            </SelectTrigger>
            <SelectContent>
              {snapshot.json.details.map((detail) => (
                <SelectItem key={detail.detailId} value={detail.detailId}>
                  {detail.detailName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedDetail ? (
        <Tabs defaultValue="waterfall" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="waterfall">Водопад</TabsTrigger>
            <TabsTrigger value="stacked">Разбивка</TabsTrigger>
          </TabsList>
          
          <TabsContent value="waterfall">
            <WaterfallChart detail={selectedDetail} currency={snapshot.json.currency} />
          </TabsContent>
          
          <TabsContent value="stacked">
            <StackedBarChart detail={selectedDetail} currency={snapshot.json.currency} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Нет данных для отображения
        </div>
      )}
    </Card>
  );
}

interface ChartProps {
  detail: Detail;
  currency: string;
}

function WaterfallChart({ detail, currency }: ChartProps) {
  const chartData = useMemo(() => {
    let cumulative = 0;
    
    return detail.stages.map((stage, index) => {
      const materialCost = stage.added?.material?.purchasingPrice || 0;
      const operationCost = stage.added?.operation?.purchasingPrice || 0;
      const totalAdded = materialCost + operationCost;
      
      const start = cumulative;
      cumulative += totalAdded;
      
      return {
        stageName: stage.stageName,
        start,
        materialCost,
        operationCost,
        totalAdded,
        cumulative,
      };
    });
  }, [detail]);

  return (
    <div>
      <div className="mb-3 text-sm text-muted-foreground">
        График показывает накопление стоимости от этапа к этапу (закупочная себестоимость)
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
          <XAxis
            dataKey="stageName"
            tick={{ fill: 'oklch(0.5 0 0)', fontSize: 11 }}
            stroke="oklch(0.8 0 0)"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            tick={{ fill: 'oklch(0.5 0 0)', fontSize: 12 }}
            stroke="oklch(0.8 0 0)"
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const data = payload[0].payload;

              return (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <p className="font-semibold mb-2">{data.stageName}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Материалы:</span>
                      <span className="text-sm font-mono">{formatCurrency(data.materialCost, currency)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Операции:</span>
                      <span className="text-sm font-mono">{formatCurrency(data.operationCost, currency)}</span>
                    </div>
                    <div className="flex justify-between gap-4 pt-2 border-t border-border">
                      <span className="text-sm font-medium">Добавлено:</span>
                      <span className="text-sm font-mono font-semibold">{formatCurrency(data.totalAdded, currency)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm font-medium">Итого накопленная:</span>
                      <span className="text-sm font-mono font-semibold">{formatCurrency(data.cumulative, currency)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          <Bar dataKey="start" stackId="a" fill="transparent" name="База" />
          <Bar dataKey="materialCost" stackId="a" fill="oklch(0.65 0.20 145)" name="Материалы" />
          <Bar dataKey="operationCost" stackId="a" fill="oklch(0.70 0.18 35)" name="Операции" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StackedBarChart({ detail, currency }: ChartProps) {
  const chartData = useMemo(() => {
    return detail.stages.map((stage) => ({
      stageName: stage.stageName,
      // Purchasing prices (direct costs)
      materialPurchasing: stage.added?.material?.purchasingPrice || 0,
      operationPurchasing: stage.added?.operation?.purchasingPrice || 0,
      // Base prices (with overhead)
      materialBase: stage.added?.material?.basePrice || 0,
      operationBase: stage.added?.operation?.basePrice || 0,
    }));
  }, [detail]);

  return (
    <div>
      <div className="mb-3 text-sm text-muted-foreground">
        Сравнение закупочных и базовых цен по материалам и операциям на каждом этапе
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
          <XAxis
            dataKey="stageName"
            tick={{ fill: 'oklch(0.5 0 0)', fontSize: 11 }}
            stroke="oklch(0.8 0 0)"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            tick={{ fill: 'oklch(0.5 0 0)', fontSize: 12 }}
            stroke="oklch(0.8 0 0)"
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const data = payload[0].payload;

              const totalPurchasing = data.materialPurchasing + data.operationPurchasing;
              const totalBase = data.materialBase + data.operationBase;
              const overhead = totalBase - totalPurchasing;
              const overheadPercent = totalPurchasing > 0 ? (overhead / totalPurchasing) * 100 : 0;

              return (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <p className="font-semibold mb-2">{data.stageName}</p>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Закупочная:</div>
                      <div className="ml-2 space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-sm">Материалы:</span>
                          <span className="text-sm font-mono">{formatCurrency(data.materialPurchasing, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-sm">Операции:</span>
                          <span className="text-sm font-mono">{formatCurrency(data.operationPurchasing, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4 font-semibold">
                          <span className="text-sm">Итого:</span>
                          <span className="text-sm font-mono">{formatCurrency(totalPurchasing, currency)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Базовая:</div>
                      <div className="ml-2 space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-sm">Материалы:</span>
                          <span className="text-sm font-mono">{formatCurrency(data.materialBase, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-sm">Операции:</span>
                          <span className="text-sm font-mono">{formatCurrency(data.operationBase, currency)}</span>
                        </div>
                        <div className="flex justify-between gap-4 font-semibold">
                          <span className="text-sm">Итого:</span>
                          <span className="text-sm font-mono">{formatCurrency(totalBase, currency)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between gap-4">
                        <span className="text-sm text-orange-500">Накладные:</span>
                        <span className="text-sm font-mono text-orange-500">
                          {formatCurrency(overhead, currency)} ({formatNumber(overheadPercent)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          <Bar dataKey="materialPurchasing" fill="oklch(0.65 0.20 145)" name="Материалы (закуп)" />
          <Bar dataKey="operationPurchasing" fill="oklch(0.70 0.18 35)" name="Операции (закуп)" />
          <Bar dataKey="materialBase" fill="oklch(0.60 0.15 280)" name="Материалы (база)" />
          <Bar dataKey="operationBase" fill="oklch(0.72 0.19 90)" name="Операции (база)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
