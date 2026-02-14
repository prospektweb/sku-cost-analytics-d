import { useQuery } from '@tanstack/react-query';
import { CalendarBlank, FunnelSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import type { FilterState } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useEffect } from 'react';

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const { data: offerNames = [] } = useQuery({
    queryKey: ['offerNames'],
    queryFn: () => api.getOfferNames(),
  });

  const { data: presets = [] } = useQuery({
    queryKey: ['presets'],
    queryFn: () => api.getPresets(),
  });

  const { data: priceTypes = [] } = useQuery({
    queryKey: ['priceTypes'],
    queryFn: () => api.getPriceTypes(),
  });

  // Initialize selectedPriceTypeIds with all price types when data is loaded
  useEffect(() => {
    if (priceTypes.length > 0 && filters.selectedPriceTypeIds.length === 0) {
      onFiltersChange({
        ...filters,
        selectedPriceTypeIds: priceTypes.map(pt => pt.id),
      });
    }
  }, [priceTypes, filters, onFiltersChange]);

  const togglePriceType = (typeId: number) => {
    const newSelected = filters.selectedPriceTypeIds.includes(typeId)
      ? filters.selectedPriceTypeIds.filter(id => id !== typeId)
      : [...filters.selectedPriceTypeIds, typeId];
    
    onFiltersChange({
      ...filters,
      selectedPriceTypeIds: newSelected,
    });
  };

  return (
    <Card className="p-3 bg-card">
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80">
          <FunnelSimple size={18} className="text-primary" />
          <h2 className="text-base font-semibold">Фильтры</h2>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="space-y-1">
              <Label htmlFor="offer-name" className="text-sm">Название предложения</Label>
              <Select
                value={filters.offerName || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, offerName: value === 'all' ? null : value })
                }
              >
                <SelectTrigger id="offer-name" className="h-9">
                  <SelectValue placeholder="Все предложения" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все предложения</SelectItem>
                  {offerNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="date-from" className="text-sm">Дата от</Label>
              <div className="relative">
                <Input
                  id="date-from"
                  type="date"
                  className="h-9"
                  value={filters.dateFrom ? formatDateForInput(filters.dateFrom) : ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateFrom: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
                <CalendarBlank
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="date-to" className="text-sm">Дата до</Label>
              <div className="relative">
                <Input
                  id="date-to"
                  type="date"
                  className="h-9"
                  value={filters.dateTo ? formatDateForInput(filters.dateTo) : ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateTo: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
                <CalendarBlank
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="preset" className="text-sm">Пресет</Label>
              <Select
                value={filters.presetId?.toString() || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, presetId: value === 'all' ? null : parseInt(value) })
                }
              >
                <SelectTrigger id="preset" className="h-9">
                  <SelectValue placeholder="Все пресеты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пресеты</SelectItem>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id.toString()}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <Label className="text-sm mb-2 block">Типы цен</Label>
            <div className="flex flex-wrap gap-3">
              {priceTypes.map((priceType) => (
                <label
                  key={priceType.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.selectedPriceTypeIds.includes(priceType.id)}
                    onCheckedChange={() => togglePriceType(priceType.id)}
                  />
                  <span className="text-sm">{priceType.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  offerName: null,
                  dateFrom: null,
                  dateTo: null,
                  presetId: null,
                  selectedPriceTypeIds: priceTypes.map(pt => pt.id),
                })
              }
            >
              Сбросить фильтры
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
