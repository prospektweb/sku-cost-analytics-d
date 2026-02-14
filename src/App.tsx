import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { DashboardFilters } from '@/components/DashboardFilters';
import { PriceDynamicsChart } from '@/components/PriceDynamicsChart';
import { CostBreakdown } from '@/components/CostBreakdown';
import { CostTree } from '@/components/CostTree';
import { SnapshotComparison } from '@/components/SnapshotComparison';
import { StageOutputs } from '@/components/StageOutputs';
import { ExportButton } from '@/components/ExportButton';
import { api } from '@/lib/api';
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
  const [filters, setFilters] = useState<FilterState>({
    offerId: null,
    dateFrom: null,
    dateTo: null,
    presetId: null,
    priceTypeId: null,
    showAllPriceTypes: true,
  });

  const { data: snapshots = [], isLoading, error } = useQuery({
    queryKey: ['snapshots', filters],
    queryFn: () => api.getSnapshots(filters),
    enabled: !!filters.offerId,
  });

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              SKU Cost Analytics Dashboard
            </h1>
            <ExportButton snapshots={snapshots} />
          </div>
          <p className="text-muted-foreground">
            Анализ истории расчетов себестоимости и формирования цен торговых предложений
          </p>
        </div>

        <div className="space-y-6">
          <DashboardFilters filters={filters} onFiltersChange={setFilters} />

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
              <p className="text-sm text-muted-foreground mt-2">
                Попробуйте изменить фильтры или обновить страницу
              </p>
            </div>
          )}

          {!isLoading && !error && snapshots.length > 0 && (
            <>
              <PriceDynamicsChart
                snapshots={snapshots}
                priceTypeId={filters.priceTypeId}
                showAllPriceTypes={filters.showAllPriceTypes}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CostBreakdown snapshot={latestSnapshot} />
                <CostTree snapshot={latestSnapshot} />
              </div>

              <SnapshotComparison snapshots={snapshots} />

              <StageOutputs snapshot={latestSnapshot} />
            </>
          )}

          {!isLoading && !error && !filters.offerId && (
            <div className="flex items-center justify-center h-64 bg-card rounded-lg border border-border">
              <div className="text-center space-y-3">
                <p className="text-lg font-medium">Начните с выбора торгового предложения</p>
                <p className="text-sm text-muted-foreground">
                  Используйте фильтры выше для загрузки данных
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && filters.offerId && snapshots.length === 0 && (
            <div className="flex items-center justify-center h-64 bg-card rounded-lg border border-border">
              <div className="text-center space-y-3">
                <p className="text-lg font-medium">Данные не найдены</p>
                <p className="text-sm text-muted-foreground">
                  Попробуйте изменить параметры фильтрации
                </p>
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