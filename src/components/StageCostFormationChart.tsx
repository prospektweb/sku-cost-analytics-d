import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartBar } from '@phosphor-icons/react';
import type { Snapshot, Detail } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/data-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StageCostFormationChartProps {
  snapshot: Snapshot | null;
  mode?: 'direct' | 'cost';
}

export function StageCostFormationChart({ snapshot, mode = 'direct' }: StageCostFormationChartProps) {
  const [selectedDetailId, setSelectedDetailId] = useState<string>('');

  useEffect(() => {
    if (snapshot && snapshot.json.details.length > 0 && !selectedDetailId) {
      setSelectedDetailId(snapshot.json.details[0].detailId);
    }
  }, [snapshot, selectedDetailId]);

  if (!snapshot) {
    return <Card className="p-4"><div className="flex items-center justify-center h-64 text-muted-foreground">Выберите период с данными для отображения</div></Card>;
  }

  const selectedDetail = snapshot.json.details.find(d => d.detailId === selectedDetailId);
  const title = mode === 'direct' ? 'Формирование прямых затрат по этапам' : 'Формирование себестоимости по этапам';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><ChartBar size={20} className="text-primary" /><h2 className="text-lg font-semibold">{title}</h2></div>
        {snapshot.json.details.length > 1 && (
          <Select value={selectedDetailId} onValueChange={setSelectedDetailId}><SelectTrigger className="w-[280px]"><SelectValue placeholder="Выберите деталь" /></SelectTrigger><SelectContent>{snapshot.json.details.map((detail) => <SelectItem key={detail.detailId} value={detail.detailId}>{detail.detailName}</SelectItem>)}</SelectContent></Select>
        )}
      </div>

      {selectedDetail ? (
        <Tabs defaultValue="waterfall" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="waterfall">Водопад</TabsTrigger><TabsTrigger value="stacked">Разбивка</TabsTrigger></TabsList>
          <TabsContent value="waterfall"><WaterfallChart detail={selectedDetail} currency={snapshot.json.currency} mode={mode} /></TabsContent>
          <TabsContent value="stacked"><StackedBarChart detail={selectedDetail} currency={snapshot.json.currency} /></TabsContent>
        </Tabs>
      ) : <div className="flex items-center justify-center h-64 text-muted-foreground">Нет данных для отображения</div>}
    </Card>
  );
}

function WaterfallChart({ detail, currency, mode }: { detail: Detail; currency: string; mode: 'direct' | 'cost' }) {
  const chartData = useMemo(() => {
    let cumulative = 0;
    return detail.stages.map((stage) => {
      const materialCost = mode === 'direct' ? (stage.added?.material?.purchasingPrice || 0) : (stage.added?.material?.basePrice || 0);
      const operationCost = mode === 'direct' ? (stage.added?.operation?.purchasingPrice || 0) : (stage.added?.operation?.basePrice || 0);
      const totalAdded = materialCost + operationCost;
      const start = cumulative;
      cumulative += totalAdded;
      return { stageName: stage.stageName, start, materialCost, operationCost, totalAdded, cumulative };
    });
  }, [detail, mode]);

  return <ResponsiveContainer width="100%" height={400}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stageName" angle={-45} textAnchor="end" height={100} /><YAxis tickFormatter={(value) => formatNumber(value)} /><Tooltip content={({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm"><div className="font-semibold mb-1">{data.stageName}</div><div>Материалы: {formatCurrency(data.materialCost, currency)}</div><div>Операции: {formatCurrency(data.operationCost, currency)}</div><div className="font-semibold">Добавлено: {formatCurrency(data.totalAdded, currency)}</div><div>Нарастающее: {formatCurrency(data.cumulative, currency)}</div></div>;
  }} /><Legend /><Bar dataKey="start" stackId="a" fill="transparent" name="База" /><Bar dataKey="materialCost" stackId="a" fill="oklch(0.65 0.20 145)" name="Материалы" /><Bar dataKey="operationCost" stackId="a" fill="oklch(0.70 0.18 35)" name="Операции" /></BarChart></ResponsiveContainer>;
}

function StackedBarChart({ detail, currency }: { detail: Detail; currency: string }) {
  const chartData = useMemo(() => detail.stages.map((stage) => ({
    stageName: stage.stageName,
    materialDirect: stage.added?.material?.purchasingPrice || 0,
    operationDirect: stage.added?.operation?.purchasingPrice || 0,
    materialCost: stage.added?.material?.basePrice || 0,
    operationCost: stage.added?.operation?.basePrice || 0,
  })), [detail]);

  return <ResponsiveContainer width="100%" height={400}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stageName" angle={-45} textAnchor="end" height={100} /><YAxis tickFormatter={(value) => formatNumber(value)} /><Tooltip /><Legend /><Bar dataKey="materialDirect" fill="oklch(0.65 0.20 145)" name="Материалы (прямые затраты)" /><Bar dataKey="operationDirect" fill="oklch(0.70 0.18 35)" name="Операции (прямые затраты)" /><Bar dataKey="materialCost" fill="oklch(0.60 0.15 280)" name="Материалы (себестоимость)" /><Bar dataKey="operationCost" fill="oklch(0.72 0.19 90)" name="Операции (себестоимость)" /></BarChart></ResponsiveContainer>;
}
