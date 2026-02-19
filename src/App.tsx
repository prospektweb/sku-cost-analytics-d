import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { DashboardFilters } from '@/components/DashboardFilters';
import { SummaryCard } from '@/components/SummaryCard';
import { CostDynamicsChart } from '@/components/CostDynamicsChart';
import { StageCostFormationChart } from '@/components/StageCostFormationChart';
import { CostBreakdown } from '@/components/CostBreakdown';
import { StageOutputs } from '@/components/StageOutputs';
import { DetailsBlock } from '@/components/DetailsBlock';
import { api } from '@/lib/api';
import { useDashboardStore } from '@/lib/store';
import type { FilterState } from '@/lib/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DashboardContent() {
  const { isInitialized } = useDashboardStore();

  const [filters, setFilters] = useState<FilterState>({
    offerName: null,
    dateFrom: null,
    dateTo: null,
    presetId: null,
    selectedPriceTypeIds: [],
  });

  const { data: snapshots = [], isLoading, error } = useQuery({
    queryKey: ['snapshots', filters],
    queryFn: () => api.getSnapshots(filters),
    enabled: isInitialized,
  });

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-xl font-medium">Ожидание данных...</p>
          <p className="text-sm text-muted-foreground">Приложение ожидает получения данных через postMessage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full px-4 py-4" data-dashboard-root>
        <div className="space-y-4">
          <DashboardFilters filters={filters} onFiltersChange={setFilters} />
          <StageOutputs snapshot={latestSnapshot} />

          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground">Загрузка данных...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <p className="text-destructive font-semibold">Ошибка загрузки данных</p>
              <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить фильтры или обновить страницу</p>
            </div>
          )}

          {!isLoading && !error && snapshots.length > 0 && (
            <>
              <DetailsBlock snapshot={latestSnapshot} />
              <SummaryCard snapshots={snapshots} />
              <CostDynamicsChart snapshots={snapshots} />
              <CostBreakdown snapshot={latestSnapshot} />
              <StageCostFormationChart snapshot={latestSnapshot} />
            </>
          )}

          {!isLoading && !error && snapshots.length === 0 && (
            <div className="flex items-center justify-center h-64 bg-card rounded-lg border border-border">
              <div className="text-center space-y-3">
                <p className="text-lg font-medium">Данные не найдены</p>
                <p className="text-sm text-muted-foreground">Попробуйте изменить параметры фильтрации</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

export default App;
