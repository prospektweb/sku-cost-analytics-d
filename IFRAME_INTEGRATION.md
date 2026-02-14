# SKU Cost Analytics Dashboard - Iframe Integration

This document describes the iframe integration implementation for embedding the dashboard in Bitrix.

## Overview

The SKU Cost Analytics Dashboard can be embedded as an iframe in any parent application (e.g., Bitrix). It receives data through the `postMessage` API and displays interactive cost analytics.

## Usage in Parent Application

### 1. Embed the iframe

```html
<iframe id="sku-cost-analytics" src="https://your-domain.com/path-to-dashboard/"></iframe>
```

### 2. Send data via postMessage

Once the iframe is loaded, send the initialization message:

```javascript
const iframe = document.getElementById('sku-cost-analytics');

iframe.contentWindow.postMessage({
    type: "PROSPEKTWEB_CALC_DASHBOARD_INIT",
    offerId: 2749,  // Integer: ID of the offer
    history: snapshots  // Array of Snapshot objects OR JSON string
}, "*");
```

### Message Format

- `type`: Must be `"PROSPEKTWEB_CALC_DASHBOARD_INIT"`
- `offerId`: Integer - The trade offer ID
- `history`: Array of snapshot objects OR JSON string containing the array

The `history` field can be:
1. An already parsed array of objects
2. A JSON string that will be parsed automatically

Each snapshot in the history array should follow this structure:

```typescript
{
  id: number;
  xmlId: string;
  dateTime: string;  // Format: "DD.MM.YYYY HH:MM:SS"
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
  }
}
```

### Example

See `/tmp/test-postmessage.html` for a complete working example.

## Features

### 1. Data Reception
- Listens for `PROSPEKTWEB_CALC_DASHBOARD_INIT` messages
- Handles both JSON string and parsed object formats
- Validates message type before processing

### 2. Dynamic Filtering
- **Offer Name**: Filter by unique offer names (handles name changes over time)
- **Offer ID**: Display and filter by offer ID
- **Date Range**: Filter by date range
- **Preset**: Filter by calculation preset
- **Price Type**: Select specific price type or view all

### 3. Visualizations
- **Price Dynamics Chart**: Historical price trends over time
- **Cost Breakdown**: Pie chart of cost distribution
- **Cost Tree**: Hierarchical view of stages and details
- **Snapshot Comparison**: Compare two calculation snapshots
- **Stage Outputs**: Detailed view of stage parameters

## Build Configuration

The application builds with fixed filenames for easy Bitrix integration:

```
dist/
├── dashboard.html
└── assets/
    ├── db-index.js        # Main bundle
    ├── db-index.es.js     # ES module bundle
    ├── db-purify.es.js    # DOMPurify module
    └── db-style.css       # Styles
```

### Build Settings

- No hash in filenames
- Single CSS file (no code splitting)
- Module preload disabled
- Optimized for iframe embedding

## Security Considerations

### Origin Validation

The current implementation accepts messages from any origin for maximum flexibility. **In production**, you should validate the origin:

```typescript
// In src/lib/store.ts
const trustedOrigins = ['https://your-bitrix-domain.com'];
if (!trustedOrigins.includes(event.origin)) {
  console.warn('Rejected postMessage from untrusted origin:', event.origin);
  return;
}
```

### Dependencies

All dependencies are regularly audited. Current status: **0 vulnerabilities**

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing PostMessage Integration

1. Start the dev server: `npm run dev`
2. Open `/tmp/test-postmessage.html` in a browser
3. Click "Send Mock Snapshots" to test data reception

## Technical Stack

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Zustand**: State management
- **TanStack Query**: Data fetching and caching
- **Recharts**: Charts and visualizations
- **html2canvas + jsPDF**: PDF export
- **Tailwind CSS**: Styling

## API Reference

### Store Methods

```typescript
import { useDashboardStore } from '@/lib/store';

// Initialize with data
useDashboardStore.getState().initializeFromPostMessage(offerId, history);

// Reset state
useDashboardStore.getState().reset();

// Access state
const { offerId, snapshots, isInitialized } = useDashboardStore();
```

### Data API

```typescript
import { api } from '@/lib/api';

// Get filtered snapshots
const snapshots = await api.getSnapshots(filters);

// Get available offers
const offers = await api.getOffers();

// Get offer names
const names = await api.getOfferNames();

// Get presets
const presets = await api.getPresets(offerId);

// Get price types
const priceTypes = await api.getPriceTypes();
```

## Troubleshooting

### Dashboard shows "Ожидание данных..." indefinitely

1. Check that the iframe has loaded completely
2. Verify the postMessage is being sent with correct format
3. Check browser console for any errors
4. Ensure `type` field is exactly `"PROSPEKTWEB_CALC_DASHBOARD_INIT"`

### Data not displaying

1. Check that `offerId` is a valid integer
2. Verify `history` array contains valid snapshot objects
3. Check browser console for JSON parsing errors
4. Ensure date format is "DD.MM.YYYY HH:MM:SS"

### PDF export not working

1. Ensure charts and visualizations are fully rendered
2. Check for CORS issues with external resources
3. Verify sufficient browser memory for canvas rendering
4. Try with a smaller data set first

## License

[Your License Here]
