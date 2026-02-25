import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartBar } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatCurrency, formatNumber, flattenStagesWithContext } from '@/lib/data-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StageCostFormationChartProps {
  snapshot: Snapshot | null;
}

interface StageRow {
  id: string;
  stageName: string;
  materials: number;
  operations: number;
}

export function StageCostFormationChart({ snapshot }: StageCostFormationChartProps) {
  return (
    <Card className="p-4">
      <Accordion type="single" collapsible defaultValue="direct-formation" className="w-full">
        <AccordionItem value="direct-formation" className="border-none">
          <AccordionTrigger className="py-2">
            <div className="flex items-center gap-2"><ChartBar size={20} className="text-primary" /><h2 className="text-lg font-semibold">Формирование прямых затрат</h2></div>
          </AccordionTrigger>
          <AccordionContent>
            {!snapshot ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">Выберите период с данными для отображения</div>
            ) : (
              <DirectFormationBody snapshot={snapshot} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function DirectFormationBody({ snapshot }: { snapshot: Snapshot }) {
  const stageRows = useMemo<StageRow[]>(() => {
    return flattenStagesWithContext(snapshot.json.details).map(({ stage, detailPath }) => ({
      id: `${detailPath.join('>')}:${stage.stageId}`,
      stageName: `${detailPath.join(' > ')} > ${stage.stageName}`,
      materials: stage.added?.material?.purchasingPrice || 0,
      operations: stage.added?.operation?.purchasingPrice || 0,
    }));
  }, [snapshot]);

  return stageRows.length > 0 ? (
    <Tabs defaultValue="waterfall" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="waterfall">Водопад</TabsTrigger><TabsTrigger value="stacked">Разбивка</TabsTrigger></TabsList>
      <TabsContent value="waterfall"><WaterfallChart rows={stageRows} currency={snapshot.json.currency} /></TabsContent>
      <TabsContent value="stacked"><StackedBarChart rows={stageRows} currency={snapshot.json.currency} /></TabsContent>
    </Tabs>
  ) : <div className="flex items-center justify-center h-64 text-muted-foreground">Нет данных для отображения</div>;
}

function WaterfallChart({ rows, currency }: { rows: StageRow[]; currency: string }) {
  const chartData = useMemo(() => {
    let cumulative = 0;
    return rows.map((row) => {
      const totalAdded = row.materials + row.operations;
      const start = cumulative;
      cumulative += totalAdded;
      return { ...row, start, totalAdded, cumulative };
    });
  }, [rows]);

  return <ResponsiveContainer width="100%" height={400}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stageName" angle={-45} textAnchor="end" height={140} interval={0} /><YAxis tickFormatter={(value) => formatNumber(value)} /><Tooltip content={({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm"><div className="font-semibold mb-1">{data.stageName}</div><div>Материалы: {formatCurrency(data.materials, currency)}</div><div>Операции: {formatCurrency(data.operations, currency)}</div><div className="font-semibold">Добавлено: {formatCurrency(data.totalAdded, currency)}</div><div>Нарастающее: {formatCurrency(data.cumulative, currency)}</div></div>;
  }} /><Legend /><Bar dataKey="start" stackId="a" fill="transparent" name="База" /><Bar dataKey="materials" stackId="a" fill="oklch(0.65 0.20 145)" name="Материалы" /><Bar dataKey="operations" stackId="a" fill="oklch(0.70 0.18 35)" name="Операции" /></BarChart></ResponsiveContainer>;
}

function StackedBarChart({ rows, currency }: { rows: StageRow[]; currency: string }) {
  return <ResponsiveContainer width="100%" height={400}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stageName" angle={-45} textAnchor="end" height={140} interval={0} /><YAxis tickFormatter={(value) => formatNumber(value)} /><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /><Legend /><Bar dataKey="operations" fill="oklch(0.70 0.18 35)" name="Операции" /><Bar dataKey="materials" fill="oklch(0.65 0.20 145)" name="Материалы" /></BarChart></ResponsiveContainer>;
}
