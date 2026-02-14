export interface StageOutputs {
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  purchasingPrice?: number;
  basePrice?: number;
  operationPurchasingPrice?: number;
  operationBasePrice?: number;
  materialPurchasingPrice?: number;
  materialBasePrice?: number;
  [key: string]: string | number | undefined;
}

export interface Stage {
  stageId: string;
  stageName: string;
  timestamp_x: string;
  modified_by: string;
  currency: string;
  outputs: StageOutputs;
}

export interface Detail {
  detailId: string;
  detailName: string;
  detailType: string;
  timestamp_x: string;
  modified_by: string;
  stages: Stage[];
  purchasePrice: number;
  basePrice: number;
  currency: string;
  outputs: StageOutputs;
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  children?: Detail[];
}

export interface PriceType {
  typeId: number;
  typeName: string;
  purchasePrice: number;
  basePrice: number;
  currency: string;
}

export interface PriceRange {
  quantityFrom: number;
  quantityTo: number | null;
  prices: PriceType[];
}

export interface ParameterValue {
  name: string;
  value: string;
}

export interface SnapshotData {
  offerId: number;
  offerName: string;
  productId: number;
  productName: string;
  presetId: number;
  presetName: string;
  timestamp_x: string;
  modified_by: string;
  details: Detail[];
  directPurchasePrice: number;
  purchasePrice: number;
  currency: string;
  parametrValues: ParameterValue[];
  priceRangesWithMarkup: PriceRange[];
}

export interface Snapshot {
  id: number;
  xmlId: string;
  dateTime: string;
  userId: number;
  json: SnapshotData;
}

export interface FilterState {
  offerName?: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  presetId: number | null;
  selectedPriceTypeIds: number[];
}

export interface PriceDataPoint {
  timestamp: Date;
  dateTime: string;
  snapshotId: number;
  priceType: string;
  priceTypeId: number;
  value: number;
  currency: string;
  delta?: number;
  deltaPercent?: number;
}

export interface CostBreakdownItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  children?: CostBreakdownItem[];
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'detail' | 'stage';
  cost: number;
  percentage: number;
  width?: number;
  length?: number;
  height?: number;
  weight?: number;
  currency: string;
  children?: TreeNode[];
  outputs?: StageOutputs;
}

export interface ComparisonDelta {
  field: string;
  label: string;
  oldValue: number;
  newValue: number;
  delta: number;
  deltaPercent: number;
  currency: string;
}

export interface SnapshotComparison {
  snapshotA: Snapshot;
  snapshotB: Snapshot;
  totalDelta: ComparisonDelta;
  stageDeltas: ComparisonDelta[];
  detailDeltas: ComparisonDelta[];
}

export type AggregationLevel = 'detail' | 'stage';

export interface OfferOption {
  id: number;
  name: string;
  productName: string;
}

export interface PresetOption {
  id: number;
  name: string;
}

export interface PriceTypeOption {
  id: number;
  name: string;
}
