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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      toast.info('Подготовка PDF, пожалуйста подождите...');
      
      // Find the dashboard content container using data attribute or class
      const dashboardElement = document.querySelector('[data-dashboard-root]') as HTMLElement || 
                               document.querySelector('.container') as HTMLElement;
      if (!dashboardElement) {
        throw new Error('Dashboard element not found');
      }

      // Capture the dashboard as canvas
      const canvas = await html2canvas(dashboardElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate dimensions for A4 landscape
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 210; // A4 landscape height in mm

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if content is too long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`sku-cost-analytics-${timestamp}.pdf`);
      
      toast.success('PDF экспортирован успешно');
    } catch (error) {
      toast.error('Ошибка при экспорте PDF');
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
        <DropdownMenuItem onClick={handleExportPDF}>
          Экспорт в PDF
        </DropdownMenuItem>
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
