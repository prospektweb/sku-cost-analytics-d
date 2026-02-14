import type { Snapshot, FilterState, OfferOption, PresetOption, PriceTypeOption } from './types';
import { mockSnapshots } from './mock-data';

const MOCK_DELAY = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async getSnapshots(filters: FilterState): Promise<Snapshot[]> {
    await delay(MOCK_DELAY);

    let filtered = [...mockSnapshots];

    if (filters.offerId) {
      filtered = filtered.filter((s) => s.json.offerId === filters.offerId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((s) => {
        const snapshotDate = parseDateTime(s.dateTime);
        return snapshotDate >= filters.dateFrom!;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter((s) => {
        const snapshotDate = parseDateTime(s.dateTime);
        return snapshotDate <= filters.dateTo!;
      });
    }

    if (filters.presetId) {
      filtered = filtered.filter((s) => s.json.presetId === filters.presetId);
    }

    return filtered.sort(
      (a, b) => parseDateTime(a.dateTime).getTime() - parseDateTime(b.dateTime).getTime()
    );
  },

  async getOffers(): Promise<OfferOption[]> {
    await delay(MOCK_DELAY);

    const uniqueOffers = new Map<number, OfferOption>();

    mockSnapshots.forEach((snapshot) => {
      if (!uniqueOffers.has(snapshot.json.offerId)) {
        uniqueOffers.set(snapshot.json.offerId, {
          id: snapshot.json.offerId,
          name: snapshot.json.offerName,
          productName: snapshot.json.productName,
        });
      }
    });

    return Array.from(uniqueOffers.values());
  },

  async getPresets(offerId?: number): Promise<PresetOption[]> {
    await delay(MOCK_DELAY);

    const uniquePresets = new Map<number, PresetOption>();

    mockSnapshots
      .filter((s) => !offerId || s.json.offerId === offerId)
      .forEach((snapshot) => {
        if (!uniquePresets.has(snapshot.json.presetId)) {
          uniquePresets.set(snapshot.json.presetId, {
            id: snapshot.json.presetId,
            name: snapshot.json.presetName,
          });
        }
      });

    return Array.from(uniquePresets.values());
  },

  async getPriceTypes(): Promise<PriceTypeOption[]> {
    await delay(MOCK_DELAY);

    const uniquePriceTypes = new Map<number, PriceTypeOption>();

    mockSnapshots.forEach((snapshot) => {
      snapshot.json.priceRangesWithMarkup.forEach((range) => {
        range.prices.forEach((price) => {
          if (!uniquePriceTypes.has(price.typeId)) {
            uniquePriceTypes.set(price.typeId, {
              id: price.typeId,
              name: price.typeName,
            });
          }
        });
      });
    });

    return Array.from(uniquePriceTypes.values());
  },
};

function parseDateTime(dateTimeStr: string): Date {
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
