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
import { api } from '@/lib/api';
import type { FilterState } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => api.getOffers(),
  });

  const { data: offerNames = [] } = useQuery({
    queryKey: ['offerNames'],
    queryFn: () => api.getOfferNames(),
  });

  const { data: presets = [] } = useQuery({
    queryKey: ['presets', filters.offerId],
    queryFn: () => api.getPresets(filters.offerId || undefined),
    enabled: !!filters.offerId,
  });

  const { data: priceTypes = [] } = useQuery({
    queryKey: ['priceTypes'],
    queryFn: () => api.getPriceTypes(),
  });

  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center gap-2 mb-6">
        <FunnelSimple size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Фильтры</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="offer-name">Название предложения</Label>
          <Select
            value={filters.offerName || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, offerName: value === 'all' ? null : value })
            }
          >
            <SelectTrigger id="offer-name">
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

        <div className="space-y-2">
          <Label htmlFor="offer">ID предложения</Label>
          <Select
            value={filters.offerId?.toString() || ''}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, offerId: value ? parseInt(value) : null })
            }
          >
            <SelectTrigger id="offer">
              <SelectValue placeholder="Выберите ТП" />
            </SelectTrigger>
            <SelectContent>
              {offers.map((offer) => (
                <SelectItem key={offer.id} value={offer.id.toString()}>
                  {offer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-from">Дата от</Label>
          <div className="relative">
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom ? formatDateForInput(filters.dateFrom) : ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value ? new Date(e.target.value) : null,
                })
              }
            />
            <CalendarBlank
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to">Дата до</Label>
          <div className="relative">
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo ? formatDateForInput(filters.dateTo) : ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateTo: e.target.value ? new Date(e.target.value) : null,
                })
              }
            />
            <CalendarBlank
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preset">Пресет (опционально)</Label>
          <Select
            value={filters.presetId?.toString() || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, presetId: value === 'all' ? null : parseInt(value) })
            }
            disabled={!filters.offerId}
          >
            <SelectTrigger id="preset">
              <SelectValue placeholder="Выберите пресет" />
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

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Label htmlFor="price-type">Тип цены</Label>
            <Select
              value={filters.priceTypeId?.toString() || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  priceTypeId: value ? parseInt(value) : null,
                  showAllPriceTypes: !value,
                })
              }
              disabled={filters.showAllPriceTypes}
            >
              <SelectTrigger id="price-type" className="max-w-xs">
                <SelectValue placeholder="Выберите тип цены" />
              </SelectTrigger>
              <SelectContent>
                {priceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-6">
            <Switch
              id="show-all-prices"
              checked={filters.showAllPriceTypes}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  showAllPriceTypes: checked,
                  priceTypeId: checked ? null : filters.priceTypeId,
                })
              }
            />
            <Label htmlFor="show-all-prices" className="cursor-pointer">
              Показать все типы цен
            </Label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={() =>
            onFiltersChange({
              offerId: null,
              offerName: null,
              dateFrom: null,
              dateTo: null,
              presetId: null,
              priceTypeId: null,
              showAllPriceTypes: true,
            })
          }
        >
          Сбросить фильтры
        </Button>
      </div>
    </Card>
  );
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
