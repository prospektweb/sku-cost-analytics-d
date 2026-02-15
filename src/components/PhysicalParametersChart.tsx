import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Ruler } from '@phosphor-icons/react';
import type { Snapshot, Detail } from '@/lib/types';
import { formatNumber } from '@/lib/data-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PhysicalParametersChartProps {
  snapshot: Snapshot | null;
}

export function PhysicalParametersChart({ snapshot }: PhysicalParametersChartProps) {
  if (!snapshot) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ruler size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">Физические параметры по этапам</h2>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Выберите период с данными для отображения параметров
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ruler size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Физические параметры по этапам</h2>
      </div>

      <Accordion type="multiple" className="w-full">
        {snapshot.json.details.map((detail, detailIndex) => (
          <AccordionItem key={detail.detailId} value={`detail-${detailIndex}`}>
            <AccordionTrigger>{detail.detailName}</AccordionTrigger>
            <AccordionContent>
              <DetailPhysicalParameters detail={detail} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

interface DetailPhysicalParametersProps {
  detail: Detail;
}

function DetailPhysicalParameters({ detail }: DetailPhysicalParametersProps) {
  const parameters = useMemo(() => {
    const params = ['width', 'length', 'height', 'weight'];
    const labels = {
      width: 'Ширина (мм)',
      length: 'Длина (мм)',
      height: 'Высота (мм)',
      weight: 'Вес (г)',
    };

    return params
      .map((param) => {
        const data = detail.stages.map((stage) => ({
          stageName: stage.stageName,
          value: stage.outputs[param] as number || 0,
        }));

        const hasData = data.some((d) => d.value > 0);
        if (!hasData) return null;

        const finalValue = data[data.length - 1]?.value || 0;

        return {
          param,
          label: labels[param as keyof typeof labels],
          data,
          finalValue,
        };
      })
      .filter(Boolean);
  }, [detail]);

  if (parameters.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Нет физических параметров для отображения
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {parameters.map((paramData) => (
        <div key={paramData!.param} className="bg-muted/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">{paramData!.label}</h4>
            <div className="text-xl font-bold font-mono">
              {formatNumber(paramData!.finalValue)}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={paramData!.data}>
              <XAxis dataKey="stageName" hide />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                      <p className="text-xs font-medium">{data.stageName}</p>
                      <p className="text-sm font-mono font-semibold">
                        {formatNumber(data.value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.65 0.20 145)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{detail.stages[0]?.stageName}</span>
            <span>{detail.stages[detail.stages.length - 1]?.stageName}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
