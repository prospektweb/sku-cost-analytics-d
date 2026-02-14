import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadSimple } from '@phosphor-icons/react';
import type { Snapshot } from '@/lib/types';
import { exportToCSV, exportToJSON, formatDateTime, parseDateTime } from '@/lib/data-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportButtonProps {
  snapshots: Snapshot[];
}

export function ExportButton({ snapshots }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportToJSON(snapshots, `sku-cost-analysis-${timestamp}.json`);
      toast.success('Данные экспортированы в JSON');
    } catch (error) {
      toast.error('Ошибка при экспорте данных');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const flatData = snapshots.flatMap((snapshot) =>
        snapshot.json.details.flatMap((detail) =>
          detail.stages.map((stage) => ({
            Дата: formatDateTime(parseDateTime(snapshot.dateTime)),
            'ID предложения': snapshot.json.offerId,
            'Название предложения': snapshot.json.offerName,
            Пресет: snapshot.json.presetName,
            Деталь: detail.detailName,
            Этап: stage.stageName,
            'Стоимость операции': stage.operationCost,
            'Стоимость материала': stage.materialCost,
            'Общая стоимость': stage.totalCost,
            Валюта: stage.currency,
          }))
        )
      );

      const timestamp = new Date().toISOString().split('T')[0];
      exportToCSV(flatData, `sku-cost-analysis-${timestamp}.csv`);
      toast.success('Данные экспортированы в CSV');
    } catch (error) {
      toast.error('Ошибка при экспорте данных');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  if (snapshots.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          <DownloadSimple size={18} />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportJSON}>
          Экспорт в JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          Экспорт в CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
