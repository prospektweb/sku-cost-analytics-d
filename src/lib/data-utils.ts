import type {
  Snapshot,
  PriceDataPoint,
  CostBreakdownItem,
  TreeNode,
  ComparisonDelta,
  SnapshotComparison,
  AggregationLevel,
} from './types';

const CHART_COLORS = [
  'oklch(0.65 0.20 145)',
  'oklch(0.70 0.18 35)',
  'oklch(0.60 0.15 280)',
  'oklch(0.72 0.19 90)',
  'oklch(0.65 0.22 25)',
  'oklch(0.55 0.18 200)',
];

export function parseDateTime(dateTimeStr: string): Date {
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [day, month, year] = datePart.split('.');
  const [hours, minutes, seconds] = timePart.split(':');

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
}

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' ' + currency;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function extractPriceTimeSeries(
  snapshots: Snapshot[],
  priceTypeId: number | null
): PriceDataPoint[] {
  const dataPoints: PriceDataPoint[] = [];

  snapshots.forEach((snapshot) => {
    const timestamp = parseDateTime(snapshot.dateTime);

    snapshot.json.priceRangesWithMarkup.forEach((range) => {
      range.prices.forEach((price) => {
        if (!priceTypeId || price.typeId === priceTypeId) {
          dataPoints.push({
            timestamp,
            dateTime: snapshot.dateTime,
            snapshotId: snapshot.id,
            priceType: price.typeName,
            priceTypeId: price.typeId,
            value: price.basePrice,
            currency: price.currency,
          });
        }
      });
    });
  });

  dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const priceTypeGroups = new Map<number, PriceDataPoint[]>();
  dataPoints.forEach((point) => {
    if (!priceTypeGroups.has(point.priceTypeId)) {
      priceTypeGroups.set(point.priceTypeId, []);
    }
    priceTypeGroups.get(point.priceTypeId)!.push(point);
  });

  priceTypeGroups.forEach((points) => {
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      current.delta = current.value - previous.value;
      current.deltaPercent = ((current.delta / previous.value) * 100);
    }
  });

  return dataPoints;
}

export function getCostBreakdownByDetail(snapshot: Snapshot): CostBreakdownItem[] {
  const items: CostBreakdownItem[] = [];
  const total = snapshot.json.purchasePrice;

  snapshot.json.details.forEach((detail, index) => {
    items.push({
      id: detail.detailId,
      name: detail.detailName,
      value: detail.purchasePrice,
      percentage: (detail.purchasePrice / total) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
    });
  });

  return items;
}

export function getCostBreakdownByStage(snapshot: Snapshot): CostBreakdownItem[] {
  const stageMap = new Map<string, { name: string; value: number }>();

  snapshot.json.details.forEach((detail) => {
    detail.stages.forEach((stage) => {
      const existing = stageMap.get(stage.stageId);
      if (existing) {
        existing.value += stage.totalCost;
      } else {
        stageMap.set(stage.stageId, {
          name: stage.stageName,
          value: stage.totalCost,
        });
      }
    });
  });

  const total = Array.from(stageMap.values()).reduce((sum, item) => sum + item.value, 0);

  return Array.from(stageMap.entries()).map(([id, data], index) => ({
    id,
    name: data.name,
    value: data.value,
    percentage: (data.value / total) * 100,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

export function buildCostTree(snapshot: Snapshot): TreeNode[] {
  const total = snapshot.json.purchasePrice;

  return snapshot.json.details.map((detail) => ({
    id: detail.detailId,
    name: detail.detailName,
    type: 'detail' as const,
    cost: detail.purchasePrice,
    percentage: (detail.purchasePrice / total) * 100,
    width: detail.width,
    length: detail.length,
    height: detail.height,
    weight: detail.weight,
    currency: detail.currency,
    outputs: detail.outputs,
    children: detail.stages.map((stage) => ({
      id: stage.stageId,
      name: stage.stageName,
      type: 'stage' as const,
      cost: stage.totalCost,
      percentage: (stage.totalCost / total) * 100,
      currency: stage.currency,
      outputs: stage.outputs,
    })),
  }));
}

export function compareSnapshots(
  snapshotA: Snapshot,
  snapshotB: Snapshot
): SnapshotComparison {
  const oldTotal = snapshotA.json.purchasePrice;
  const newTotal = snapshotB.json.purchasePrice;

  const totalDelta: ComparisonDelta = {
    field: 'total',
    label: 'Общая себестоимость',
    oldValue: oldTotal,
    newValue: newTotal,
    delta: newTotal - oldTotal,
    deltaPercent: ((newTotal - oldTotal) / oldTotal) * 100,
    currency: snapshotB.json.currency,
  };

  const stageDeltas: ComparisonDelta[] = [];
  const stageMapA = new Map<string, number>();
  const stageMapB = new Map<string, number>();

  snapshotA.json.details.forEach((detail) => {
    detail.stages.forEach((stage) => {
      const current = stageMapA.get(stage.stageName) || 0;
      stageMapA.set(stage.stageName, current + stage.totalCost);
    });
  });

  snapshotB.json.details.forEach((detail) => {
    detail.stages.forEach((stage) => {
      const current = stageMapB.get(stage.stageName) || 0;
      stageMapB.set(stage.stageName, current + stage.totalCost);
    });
  });

  const allStageNames = new Set([...stageMapA.keys(), ...stageMapB.keys()]);

  allStageNames.forEach((stageName) => {
    const oldValue = stageMapA.get(stageName) || 0;
    const newValue = stageMapB.get(stageName) || 0;

    if (oldValue !== newValue) {
      stageDeltas.push({
        field: stageName,
        label: stageName,
        oldValue,
        newValue,
        delta: newValue - oldValue,
        deltaPercent: oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0,
        currency: snapshotB.json.currency,
      });
    }
  });

  const detailDeltas: ComparisonDelta[] = [];
  const detailMapA = new Map<string, number>();
  const detailMapB = new Map<string, number>();

  snapshotA.json.details.forEach((detail) => {
    detailMapA.set(detail.detailName, detail.purchasePrice);
  });

  snapshotB.json.details.forEach((detail) => {
    detailMapB.set(detail.detailName, detail.purchasePrice);
  });

  const allDetailNames = new Set([...detailMapA.keys(), ...detailMapB.keys()]);

  allDetailNames.forEach((detailName) => {
    const oldValue = detailMapA.get(detailName) || 0;
    const newValue = detailMapB.get(detailName) || 0;

    if (oldValue !== newValue) {
      detailDeltas.push({
        field: detailName,
        label: detailName,
        oldValue,
        newValue,
        delta: newValue - oldValue,
        deltaPercent: oldValue > 0 ? ((newValue - oldValue) / oldValue) * 100 : 0,
        currency: snapshotB.json.currency,
      });
    }
  });

  return {
    snapshotA,
    snapshotB,
    totalDelta,
    stageDeltas,
    detailDeltas,
  };
}

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
