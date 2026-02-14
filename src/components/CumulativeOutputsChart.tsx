import { useMemo, useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartLine } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { formatNumber, formatKey, getChartColor } from '@/lib/data-utils';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CumulativeOutputsChartProps {
  snapshot: Snapshot | null;
}

export function CumulativeOutputsChart({ snapshot }: CumulativeOutputsChartProps) {
  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartLine size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">График кумулятивных параметров</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Выберите период с данными для отображения графиков
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChartLine size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">График кумулятивных параметров</h2>
      </div>

      <Accordion type="multiple" className="w-full">
        {snapshot.json.details.map((detail, detailIndex) => (
          <AccordionItem key={detail.detailId} value={`detail-${detailIndex}`}>
            <AccordionTrigger>{detail.detailName} - Графики параметров</AccordionTrigger>
            <AccordionContent>
              <DetailCharts 
                detail={detail} 
                detailIndex={detailIndex}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

interface DetailChartsProps {
  detail: any;
  detailIndex: number;
}

function DetailCharts({ detail, detailIndex }: DetailChartsProps) {
  // Extract all numeric parameters across all stages for this detail
  const numericParameters = useMemo(() => {
    const paramsSet = new Set<string>();
    
    detail.stages.forEach((stage: any) => {
      Object.entries(stage.outputs).forEach(([key, value]) => {
        if (typeof value === 'number') {
          paramsSet.add(key);
        }
      });
    });
    
    return Array.from(paramsSet).sort();
  }, [detail]);

  const [hiddenParameters, setHiddenParameters] = useState<Set<string>>(new Set());

  const visibleParameters = useMemo(() => {
    return numericParameters.filter((param) => !hiddenParameters.has(param));
  }, [numericParameters, hiddenParameters]);

  const toggleParameter = (param: string) => {
    setHiddenParameters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(param)) {
        newSet.delete(param);
      } else {
        newSet.add(param);
      }
      return newSet;
    });
  };

  // Prepare chart data for each visible parameter
  const chartsData = useMemo(() => {
    return visibleParameters.map((param) => {
      const data = detail.stages.map((stage: any, stageIndex: number) => {
        const cumulativeValue = stage.outputs[param] || 0;
        const previousValue = stageIndex > 0 
          ? (detail.stages[stageIndex - 1].outputs[param] || 0)
          : 0;
        const delta = cumulativeValue - previousValue;

        return {
          stageName: stage.stageName,
          cumulative: cumulativeValue,
          delta: delta,
        };
      });

      return {
        parameter: param,
        data: data,
      };
    });
  }, [detail, visibleParameters]);

  if (numericParameters.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Нет числовых параметров для отображения
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parameter selection badges */}
      <div>
        <h4 className="text-sm font-medium mb-2">Выберите параметры для отображения:</h4>
        <div className="flex flex-wrap gap-2">
          {numericParameters.map((param, index) => {
            const isHidden = hiddenParameters.has(param);
            
            return (
              <Badge
                key={param}
                variant={isHidden ? 'outline' : 'default'}
                className="cursor-pointer transition-colors"
                style={{
                  backgroundColor: isHidden ? 'transparent' : getChartColor(index),
                  borderColor: getChartColor(index),
                  color: isHidden ? getChartColor(index) : 'white',
                }}
                onClick={() => toggleParameter(param)}
              >
                {formatKey(param)}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {chartsData.map((chartData, index) => (
          <div key={chartData.parameter} className="border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-3">{formatKey(chartData.parameter)}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
                <XAxis
                  dataKey="stageName"
                  tick={{ fill: 'oklch(0.5 0 0)', fontSize: 11 }}
                  stroke="oklch(0.8 0 0)"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  yAxisId="left"
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
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getChartColor(index) }}
                            />
                            <span className="text-sm">Кумулятивное значение:</span>
                            <span className="text-sm font-mono font-semibold">
                              {formatNumber(data.cumulative)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-5">
                            <span className="text-sm text-muted-foreground">Дельта:</span>
                            <span className={`text-sm font-mono ${data.delta > 0 ? 'text-green-600' : data.delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {data.delta > 0 ? '+' : ''}{formatNumber(data.delta)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulative"
                  name="Кумулятивное значение"
                  stroke={getChartColor(index)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="delta"
                  name="Дельта"
                  fill={getChartColor(index)}
                  fillOpacity={0.3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
