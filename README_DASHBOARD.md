# SKU Cost Analytics Dashboard

Production-ready dashboard for analyzing SKU cost history and price formation dynamics from Bitrix calculations.

## Features

- **Historical Data Filtering**: Filter cost snapshots by offer, date range, preset, and price type
- **Price Dynamics Visualization**: Interactive line charts showing price evolution over time with delta calculations
- **Cost Distribution Analysis**: Multiple chart types (donut, pie) showing cost breakdown by details and stages
- **Cost Formation Tree**: Hierarchical tree view with expandable detail → stage structure
- **Temporal Comparison**: A/B comparison between two snapshots with comprehensive delta analysis
- **Stage Outputs**: Detailed view of all stage outputs and calculation parameters
- **Data Export**: Export current view data to CSV or JSON formats

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **Shadcn v4** for UI components
- **Recharts** for data visualization
- **React Query (TanStack Query)** for data fetching and caching
- **Vite** as build tool

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── ui/                      # Shadcn UI components (pre-installed)
│   ├── DashboardFilters.tsx     # Filter controls
│   ├── PriceDynamicsChart.tsx   # Price time series chart
│   ├── CostBreakdown.tsx        # Cost distribution visualizations
│   ├── CostTree.tsx             # Hierarchical cost tree
│   ├── SnapshotComparison.tsx   # Temporal comparison view
│   ├── StageOutputs.tsx         # Stage outputs and parameters
│   └── ExportButton.tsx         # Export functionality
├── lib/
│   ├── types.ts                 # TypeScript type definitions
│   ├── api.ts                   # API client layer
│   ├── mock-data.ts             # Mock data for development
│   ├── data-utils.ts            # Data processing utilities
│   └── utils.ts                 # General utilities
├── App.tsx                      # Main application component
└── index.css                    # Global styles and theme
```

## Connecting to Real Bitrix API

The dashboard currently uses mock data. To connect to your real Bitrix API:

### 1. Update API Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://your-bitrix-domain.com/api
VITE_API_KEY=your-api-key
```

### 2. Update the API Client

Modify `src/lib/api.ts` to use real endpoints:

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const api = {
  async getSnapshots(filters: FilterState): Promise<Snapshot[]> {
    const params = new URLSearchParams();
    
    if (filters.offerId) params.append('offerId', filters.offerId.toString());
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    if (filters.presetId) params.append('presetId', filters.presetId.toString());

    const response = await fetch(
      `${API_BASE_URL}/snapshots?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async getOffers(): Promise<OfferOption[]> {
    const response = await fetch(`${API_BASE_URL}/offers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Similar updates for getPresets() and getPriceTypes()
};
```

### 3. Expected Backend API Endpoints

Your Bitrix backend should provide the following endpoints:

#### GET `/api/snapshots`

Query parameters:
- `offerId` (required): Offer ID to filter
- `dateFrom` (optional): Start date in ISO format
- `dateTo` (optional): End date in ISO format
- `presetId` (optional): Preset ID to filter

Response: Array of `Snapshot` objects (see `src/lib/types.ts`)

#### GET `/api/offers`

Response: Array of `OfferOption` objects

```typescript
{
  id: number;
  name: string;
  productName: string;
}[]
```

#### GET `/api/presets?offerId={offerId}`

Query parameters:
- `offerId` (optional): Filter presets by offer

Response: Array of `PresetOption` objects

```typescript
{
  id: number;
  name: string;
}[]
```

#### GET `/api/price-types`

Response: Array of `PriceTypeOption` objects

```typescript
{
  id: number;
  name: string;
}[]
```

### 4. Backend Data Format

The backend should return snapshot data in the following structure:

```typescript
interface Snapshot {
  id: number;
  xmlId: string;
  dateTime: string; // Format: "DD.MM.YYYY HH:mm:ss"
  userId: number;
  json: {
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
  };
}
```

See `src/lib/types.ts` for complete type definitions.

## Data Processing

The dashboard includes several utility functions for data processing:

- **`extractPriceTimeSeries`**: Converts snapshots into time series data for charts
- **`getCostBreakdownByDetail/Stage`**: Aggregates costs for breakdown visualizations
- **`buildCostTree`**: Creates hierarchical tree structure from snapshot data
- **`compareSnapshots`**: Calculates deltas between two snapshots
- **`formatCurrency/DateTime/Percent`**: Formatting utilities with Russian locale

## Performance Optimizations

- **React Query**: Automatic caching and background refetching
- **useMemo**: Memoization of expensive computations
- **Virtualization**: Ready for large datasets (can add `react-window` if needed)
- **Lazy Loading**: Components load only when needed

## Testing

### Unit Tests

```bash
npm run test
```

Key areas to test:
- Data normalization functions in `data-utils.ts`
- Date parsing and formatting
- Currency formatting
- Delta calculations
- Export functions

### Example Test Structure

```typescript
// __tests__/data-utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, compareSnapshots } from '@/lib/data-utils';

describe('formatCurrency', () => {
  it('formats Russian rubles correctly', () => {
    expect(formatCurrency(1234.56, 'RUB')).toBe('1 234,56 RUB');
  });
});

describe('compareSnapshots', () => {
  it('calculates correct delta', () => {
    const result = compareSnapshots(snapshotA, snapshotB);
    expect(result.totalDelta.delta).toBe(1610);
  });
});
```

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Variables for Production

Ensure the following environment variables are set:

- `VITE_API_BASE_URL`: Your Bitrix API base URL
- `VITE_API_KEY`: Your API authentication key

## Customization

### Theme Colors

Edit `src/index.css` to customize the color palette:

```css
:root {
  --primary: oklch(0.45 0.15 250); /* Deep blue */
  --accent: oklch(0.65 0.22 25);   /* Coral */
  /* ... other colors */
}
```

### Chart Colors

Edit `CHART_COLORS` in `src/lib/data-utils.ts`:

```typescript
const CHART_COLORS = [
  'oklch(0.65 0.20 145)', // Teal
  'oklch(0.70 0.18 35)',  // Orange
  // ... add more colors
];
```

### Date Format

The default date format is Russian (`DD.MM.YYYY HH:mm:ss`). To change it, update the `parseDateTime` function in `src/lib/data-utils.ts`.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Support

For issues or questions:
1. Check the console for error messages
2. Verify API endpoint responses match expected format
3. Review `src/lib/types.ts` for data structure requirements
