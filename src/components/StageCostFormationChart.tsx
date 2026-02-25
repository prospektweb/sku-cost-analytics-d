import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartBar } from '@phosphor-icons/react';
import type { Snapshot, Detail } from '@/lib/types';
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

interface DetailNode {
  id: string;
  name: string;
  children: DetailNode[];
}

const BUTTON_COLORS = [
  'bg-sky-100 border-sky-300 text-sky-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-rose-100 border-rose-300 text-rose-800',
];

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
  const detailTree = useMemo(() => snapshot.json.details.map(buildDetailNode), [snapshot]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const stageRows = useMemo<StageRow[]>(() => {
    const allRows = flattenStagesWithContext(snapshot.json.details).map(({ stage, detailPath }) => ({
      id: `${detailPath.join('>')}:${stage.stageId}`,
      stageName: `${detailPath.join(' > ')} > ${stage.stageName}`,
      materials: stage.added?.material?.purchasingPrice || 0,
      operations: stage.added?.operation?.purchasingPrice || 0,
      detailPath,
    }));

    if (selectedPath.length === 0) {
      return allRows;
    }

    return allRows
      .filter((row) => selectedPath.every((segment, idx) => row.detailPath[idx] === segment))
      .map(({ detailPath: _detailPath, ...row }) => row);
  }, [snapshot, selectedPath]);

  return stageRows.length > 0 ? (
    <div className="space-y-4">
      <RecursiveSelector tree={detailTree} selectedPath={selectedPath} onSelectPath={setSelectedPath} />
      <Tabs defaultValue="waterfall" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="waterfall">Водопад</TabsTrigger><TabsTrigger value="stacked">Разбивка</TabsTrigger></TabsList>
        <TabsContent value="waterfall"><WaterfallChart rows={stageRows} currency={snapshot.json.currency} /></TabsContent>
        <TabsContent value="stacked"><StackedBarChart rows={stageRows} currency={snapshot.json.currency} /></TabsContent>
      </Tabs>
    </div>
  ) : <div className="flex items-center justify-center h-64 text-muted-foreground">Нет данных для отображения</div>;
}

function RecursiveSelector({ tree, selectedPath, onSelectPath }: { tree: DetailNode[]; selectedPath: string[]; onSelectPath: (path: string[]) => void }) {
  const levels: DetailNode[][] = [];
  levels.push(tree);

  let current = tree;
  for (let i = 0; i < selectedPath.length; i++) {
    const selected = current.find((node) => node.id === selectedPath[i]);
    if (!selected || selected.children.length === 0) break;
    levels.push(selected.children);
    current = selected.children;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Фильтр по детали/скреплению</div>
      <button
        type="button"
        onClick={() => onSelectPath([])}
        className={`px-3 py-1 rounded-md border text-sm ${selectedPath.length === 0 ? 'bg-primary/10 border-primary/40' : ''}`}
      >
        Все
      </button>
      {levels.map((nodes, levelIdx) => (
        <div key={levelIdx} className="flex flex-wrap gap-2">
          {nodes.map((node, idx) => {
            const active = selectedPath[levelIdx] === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectPath([...selectedPath.slice(0, levelIdx), node.id])}
                className={`px-3 py-1 rounded-md border text-sm ${BUTTON_COLORS[idx % BUTTON_COLORS.length]} ${active ? 'ring-2 ring-primary/40' : ''}`}
              >
                {node.name}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
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

  return <ResponsiveContainer width="100%" height={400}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stageName" angle={-35} textAnchor="end" height={140} interval={0} /><YAxis tickFormatter={(value) => formatNumber(value)} /><Tooltip content={({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm"><div className="font-semibold mb-1">{data.stageName}</div><div>Материалы: {formatCurrency(data.materials, currency)}</div><div>Операции: {formatCurrency(data.operations, currency)}</div><div className="font-semibold">Добавлено: {formatCurrency(data.totalAdded, currency)}</div><div>Нарастающее: {formatCurrency(data.cumulative, currency)}</div></div>;
  }} /><Legend /><Bar dataKey="start" stackId="a" fill="transparent" name="База" /><Bar dataKey="materials" stackId="a" fill="oklch(0.65 0.20 145)" name="Материалы" /><Bar dataKey="operations" stackId="a" fill="oklch(0.70 0.18 35)" name="Операции" /></BarChart></ResponsiveContainer>;
}

function StackedBarChart({ rows, currency }: { rows: StageRow[]; currency: string }) {
  return <ResponsiveContainer width="100%" height={400}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stageName" angle={-35} textAnchor="end" height={140} interval={0} /><YAxis tickFormatter={(value) => formatNumber(value)} /><Tooltip formatter={(value: number) => formatCurrency(value, currency)} /><Legend /><Bar dataKey="operations" fill="oklch(0.70 0.18 35)" name="Операции" /><Bar dataKey="materials" fill="oklch(0.65 0.20 145)" name="Материалы" /></BarChart></ResponsiveContainer>;
}

function buildDetailNode(detail: Detail): DetailNode {
  return {
    id: detail.detailId,
    name: detail.detailName,
    children: (detail.children || []).map(buildDetailNode),
  };
}
