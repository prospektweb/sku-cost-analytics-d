import type {
  Snapshot,
  PriceDataPoint,
  CostBreakdownItem,
  TreeNode,
  ComparisonDelta,
  SnapshotComparison,
  AggregationLevel,
  Detail,
  Stage,
} from './types';

interface DetailWithPath {
  detail: Detail;
  path: string[];
}

interface StageWithDetailContext {
  stage: Stage;
  detailPath: string[];
}

const CHART_COLORS = [
  'oklch(0.65 0.20 145)',
  'oklch(0.70 0.18 35)',
  'oklch(0.60 0.15 280)',
  'oklch(0.72 0.19 90)',
  'oklch(0.65 0.22 25)',
  'oklch(0.55 0.18 200)',
];

function getDetailOwnDirectContribution(detail: Detail): number {
  return detail.stages.reduce(
    (sum, stage) => sum + (stage.added?.material?.purchasingPrice || 0) + (stage.added?.operation?.purchasingPrice || 0) + (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.purchasingPrice || 0)),
    0,
  );
}

function getDetailOwnCostContribution(detail: Detail): number {
  return detail.stages.reduce(
    (sum, stage) => sum + (stage.added?.material?.basePrice || 0) + (stage.added?.operation?.basePrice || 0) + (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0)),
    0,
  );
}

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
  selectedPriceTypeIds: number[]
): PriceDataPoint[] {
  const dataPoints: PriceDataPoint[] = [];

  snapshots.forEach((snapshot) => {
    const timestamp = parseDateTime(snapshot.dateTime);

    // Only use the primary (first) price range to avoid mixing deltas from different quantity ranges
    // If no price ranges exist for this snapshot, skip it (no data points will be added)
    const primaryRange = snapshot.json.priceRangesWithMarkup[0];
    if (primaryRange) {
      primaryRange.prices.forEach((price) => {
        // If empty array, show nothing. If has values, filter by them
        if (selectedPriceTypeIds.length === 0 || selectedPriceTypeIds.includes(price.typeId)) {
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
    }
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
  const allDetails = flattenDetailsWithPath(snapshot.json.details);

  allDetails.forEach(({ detail, path }, index) => {
    const detailCost = getDetailOwnCostContribution(detail);
    items.push({
      id: detail.detailId,
      name: path.join(' > '),
      value: detailCost,
      percentage: total > 0 ? (detailCost / total) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    });
  });

  return items;
}

export function getCostBreakdownByStage(snapshot: Snapshot): CostBreakdownItem[] {
  const stageMap = new Map<string, { name: string; value: number }>();

  flattenStagesWithContext(snapshot.json.details).forEach(({ stage, detailPath }) => {
      // Use added data to calculate stage cost contribution
      const stageCost =
        (stage.added?.material?.basePrice || 0) +
        (stage.added?.operation?.basePrice || 0) +
        (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0));

      const stageKey = `${detailPath.join(' > ')} > ${stage.stageName}`;
      const existing = stageMap.get(stageKey);
      if (existing) {
        existing.value += stageCost;
      } else {
        stageMap.set(stageKey, {
          name: stageKey,
          value: stageCost,
        });
      }
    });

  const total = Array.from(stageMap.values()).reduce((sum, item) => sum + item.value, 0);

  return Array.from(stageMap.entries()).map(([id, data], index) => ({
    id,
    name: data.name,
    value: data.value,
    percentage: total > 0 ? (data.value / total) * 100 : 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

export function getCostBreakdownByStageForDetail(snapshot: Snapshot, detailId: string): CostBreakdownItem[] {
  const detailWithPath = flattenDetailsWithPath(snapshot.json.details).find(({ detail }) => detail.detailId === detailId);
  if (!detailWithPath) {
    return [];
  }

  const total = detailWithPath.detail.stages.reduce(
    (sum, stage) => sum + (stage.added?.material?.basePrice || 0) + (stage.added?.operation?.basePrice || 0) + (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0)),
    0,
  );

  return detailWithPath.detail.stages.map((stage, index) => {
    const value = (stage.added?.material?.basePrice || 0) + (stage.added?.operation?.basePrice || 0) + (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0));
    const name = `${detailWithPath.path.join(' > ')} > ${stage.stageName}`;

    return {
      id: `${detailWithPath.detail.detailId}:${stage.stageId}`,
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });
}

export function getOverallStageEstimate(snapshot: Snapshot): CostBreakdownItem[] {
  const stageMap = new Map<string, { name: string; value: number }>();

  flattenStagesWithContext(snapshot.json.details).forEach(({ stage, detailPath }) => {
    const stageCost = (stage.added?.material?.basePrice || 0) + (stage.added?.operation?.basePrice || 0) + (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0));
    const key = `${detailPath.join(' > ')} > ${stage.stageName}`;
    stageMap.set(key, { name: key, value: stageCost });
  });

  const total = Array.from(stageMap.values()).reduce((sum, item) => sum + item.value, 0);

  return Array.from(stageMap.entries()).map(([id, item], index) => ({
    id,
    name: item.name,
    value: item.value,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

export function buildCostTree(snapshot: Snapshot): TreeNode[] {
  const total = snapshot.json.purchasePrice;

  return flattenDetailsWithPath(snapshot.json.details).map(({ detail, path }) => ({
    id: detail.detailId,
    name: path.join(' > '),
    type: 'detail' as const,
    cost: getDetailOwnDirectContribution(detail),
    percentage: total > 0 ? (getDetailOwnDirectContribution(detail) / total) * 100 : 0,
    width: getDetailDimension(detail, 'width'),
    length: getDetailDimension(detail, 'length'),
    height: getDetailDimension(detail, 'height'),
    weight: getDetailDimension(detail, 'weight'),
    currency: detail.currency,
    outputs: detail.outputs,
    children: detail.stages.map((stage) => {
      // Use added data to calculate stage cost
      const stageCost =
        (stage.added?.material?.basePrice || 0) +
        (stage.added?.operation?.basePrice || 0) +
        (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0));

      return {
        id: `${detail.detailId}:${stage.stageId}`,
        name: stage.stageName,
        type: 'stage' as const,
        cost: stageCost,
        percentage: total > 0 ? (stageCost / total) * 100 : 0,
        currency: stage.currency,
        outputs: stage.outputs,
      };
    }),
  }));
}

export function flattenDetailsWithPath(details: Detail[], parentPath: string[] = []): DetailWithPath[] {
  return details.flatMap((detail) => {
    const currentPath = [...parentPath, detail.detailName];
    const ownNode: DetailWithPath = { detail, path: currentPath };
    const childNodes = detail.children ? flattenDetailsWithPath(detail.children, currentPath) : [];
    return [ownNode, ...childNodes];
  });
}

export function flattenStagesWithContext(details: Detail[], parentPath: string[] = []): StageWithDetailContext[] {
  return details.flatMap((detail) => {
    const currentPath = [...parentPath, detail.detailName];
    const ownStages = detail.stages.map((stage) => ({
      stage,
      detailPath: currentPath,
    }));
    const childStages = detail.children ? flattenStagesWithContext(detail.children, currentPath) : [];
    return [...ownStages, ...childStages];
  });
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

  // Add direct purchase price and overhead comparisons
  const stageDeltas: ComparisonDelta[] = [];
  
  // Compare direct purchase prices
  const oldDirectPrice = snapshotA.json.directPurchasePrice;
  const newDirectPrice = snapshotB.json.directPurchasePrice;
  
  if (oldDirectPrice !== newDirectPrice) {
    stageDeltas.push({
      field: 'directPurchasePrice',
      label: 'Прямые затраты',
      oldValue: oldDirectPrice,
      newValue: newDirectPrice,
      delta: newDirectPrice - oldDirectPrice,
      deltaPercent: oldDirectPrice > 0 ? ((newDirectPrice - oldDirectPrice) / oldDirectPrice) * 100 : 0,
      currency: snapshotB.json.currency,
    });
  }

  // Compare overhead percentages
  const oldOverheadPercent = oldDirectPrice > 0 ? ((oldTotal - oldDirectPrice) / oldDirectPrice) * 100 : 0;
  const newOverheadPercent = newDirectPrice > 0 ? ((newTotal - newDirectPrice) / newDirectPrice) * 100 : 0;
  
  if (oldOverheadPercent !== newOverheadPercent) {
    stageDeltas.push({
      field: 'overheadPercent',
      label: 'Накладные расходы (%)',
      oldValue: oldOverheadPercent,
      newValue: newOverheadPercent,
      delta: newOverheadPercent - oldOverheadPercent,
      deltaPercent: oldOverheadPercent > 0 ? ((newOverheadPercent - oldOverheadPercent) / oldOverheadPercent) * 100 : 0,
      currency: '%',
    });
  }

  // Compare stage costs using added data
  const stageMapA = new Map<string, number>();
  const stageMapB = new Map<string, number>();

  snapshotA.json.details.forEach((detail) => {
    detail.stages.forEach((stage) => {
      const stageCost =
        (stage.added?.material?.basePrice || 0) +
        (stage.added?.operation?.basePrice || 0) +
        (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0));
      
      const current = stageMapA.get(stage.stageName) || 0;
      stageMapA.set(stage.stageName, current + stageCost);
    });
  });

  snapshotB.json.details.forEach((detail) => {
    detail.stages.forEach((stage) => {
      const stageCost =
        (stage.added?.material?.basePrice || 0) +
        (stage.added?.operation?.basePrice || 0) +
        (Array.isArray(stage.added?.equipment) ? 0 : (stage.added?.equipment?.basePrice || 0));
      
      const current = stageMapB.get(stage.stageName) || 0;
      stageMapB.set(stage.stageName, current + stageCost);
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

export function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    width: 'Ширина (мм)',
    length: 'Длина (мм)',
    height: 'Высота (мм)',
    weight: 'Вес (г)',
    purchasingPrice: 'Прямые затраты',
    basePrice: 'Себестоимость',
    widthproduct: 'Ширина продукта',
    lengthproduct: 'Длина продукта',
    kolichestvo_listov_bumagi_s_priladkoy: 'Кол-во листов с приладкой',
    kolichestvo_listov_bumagi_bez_priladki: 'Кол-во листов без приладки',
    vmestimost: 'Вместимость',
    koeffitsient_svoy_chuzhoy_oborot: 'Коэффициент своя/чужая',
    kolichestvo_priladok: 'Кол-во приладок',
    stoimost_priladki_dlya_storony_1: 'Стоимость приладки сторона 1',
    stoimost_priladki_dlya_storony_2: 'Стоимость приладки сторона 2',
    summa_po_vsem_priladkam: 'Сумма по всем приладкам',
  };

  return keyMap[key] || key;
}

export function getDetailDirectCost(detail: Detail): number {
  return detail.outputs?.purchasingPrice ?? detail.purchasePrice ?? 0;
}

export function getDetailCost(detail: Detail): number {
  return detail.outputs?.basePrice ?? detail.basePrice ?? 0;
}

export function getStageDirectCost(stage: Stage): number {
  return stage.outputs?.purchasingPrice ?? 0;
}

export function getStageCost(stage: Stage): number {
  return stage.outputs?.basePrice ?? 0;
}

export function getDetailDimension(detail: Detail, key: 'width' | 'length' | 'height' | 'weight'): number {
  const rawValue = detail.outputs?.[key] ?? detail[key];
  return typeof rawValue === 'number' ? rawValue : 0;
}
