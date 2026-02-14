# SKU Cost Analytics Dashboard

An advanced dashboard for analyzing SKU cost history and price formation dynamics from Bitrix calculations.

**Experience Qualities**:
1. **Analytical** - Provides deep insights into cost structure evolution with multi-dimensional breakdowns
2. **Professional** - Clean, data-focused interface with precise visualizations and formatting
3. **Responsive** - Smooth interactions with instant feedback and intelligent state management

**Complexity Level**: Complex Application (advanced functionality with multiple views)
The dashboard requires sophisticated data processing, multiple interconnected visualizations, temporal comparisons, hierarchical data display, and export capabilities - all working together to provide comprehensive cost analytics.

## Essential Features

### Historical Data Filtering
- **Functionality**: Filter cost snapshots by offer, date range, preset, and price type
- **Purpose**: Enable focused analysis on specific products and time periods
- **Trigger**: User interaction with filter controls in the header
- **Progression**: Select offer → Choose date range → Optional preset filter → Optional price type filter → Data refreshes automatically
- **Success criteria**: Filters apply instantly with loading states, empty results show helpful messages

### Price Dynamics Visualization
- **Functionality**: Line chart showing price evolution over time for different price types
- **Purpose**: Track how prices change and identify trends or anomalies
- **Trigger**: Data loads based on active filters
- **Progression**: Chart renders → User hovers over points → Tooltip shows details with delta → User can toggle price types on/off
- **Success criteria**: Smooth chart rendering, accurate delta calculations, responsive tooltips

### Cost Distribution Analysis
- **Functionality**: Multiple chart types (donut, treemap, stacked bar) showing cost breakdown
- **Purpose**: Understand which components contribute most to total cost
- **Trigger**: User selects aggregation level (binding/detail/stage)
- **Progression**: Select aggregation → Chart updates → Hover for details → Click segments for drill-down
- **Success criteria**: Charts update smoothly, percentages sum to 100%, colors are consistent

### Cost Formation Tree
- **Functionality**: Hierarchical tree view showing binding → detail → stage structure
- **Purpose**: Navigate the complete cost calculation hierarchy
- **Trigger**: Snapshot data loads
- **Progression**: Tree renders collapsed → User expands nodes → Details show with costs and dimensions → Percentages calculated relative to total
- **Success criteria**: Tree is performant with large datasets, expand/collapse is smooth, data is accurate

### Temporal Comparison
- **Functionality**: A/B comparison between two snapshots with delta analysis
- **Purpose**: Understand what changed between two points in time
- **Trigger**: User selects two dates from timeline
- **Progression**: Select date A → Select date B → Comparison view shows → Waterfall chart explains delta → Stage-by-stage breakdown visible
- **Success criteria**: Clear visual indication of increases/decreases, accurate delta calculations, waterfall logic is sound

### Data Export
- **Functionality**: Export current view data to CSV or JSON
- **Purpose**: Enable further analysis in external tools
- **Trigger**: User clicks export button
- **Progression**: Click export → Choose format → File downloads
- **Success criteria**: Export includes filtered data, proper formatting, filename includes timestamp

## Edge Case Handling
- **Empty snapshots**: Show empty state with guidance on selecting different filters
- **Single data point**: Disable comparison features, show message about needing multiple snapshots
- **Missing dimensions**: Handle optional fields (weight, dimensions) gracefully with N/A displays
- **Large datasets**: Implement virtualization for tables, pagination for lists
- **Network errors**: Retry logic with user-friendly error messages
- **Invalid data**: Validate structure and show warnings for malformed snapshots

## Design Direction
The design should evoke precision, clarity, and professionalism - like a high-end financial analytics platform. Users should feel confident in the data accuracy and find insights quickly through well-organized information hierarchy.

## Color Selection
A professional analytics palette with strong contrast and meaningful color coding.

- **Primary Color**: oklch(0.45 0.15 250) - Deep analytical blue communicating trust and professionalism
- **Secondary Colors**: 
  - Chart color 1: oklch(0.65 0.20 145) - Teal for primary data series
  - Chart color 2: oklch(0.70 0.18 35) - Warm orange for comparisons
  - Chart color 3: oklch(0.60 0.15 280) - Purple for tertiary data
  - Chart color 4: oklch(0.72 0.19 90) - Yellow-green for highlights
- **Accent Color**: oklch(0.65 0.22 25) - Coral for CTAs and important metrics
- **Foreground/Background Pairings**: 
  - Background (Pure white oklch(1 0 0)): Dark text oklch(0.25 0.02 250) - Ratio 11.4:1 ✓
  - Card (Light gray oklch(0.98 0.005 250)): Dark text oklch(0.25 0.02 250) - Ratio 10.8:1 ✓
  - Primary (oklch(0.45 0.15 250)): White text oklch(1 0 0) - Ratio 8.2:1 ✓
  - Accent (oklch(0.65 0.22 25)): White text oklch(1 0 0) - Ratio 4.8:1 ✓

## Font Selection
Typography should communicate technical precision while remaining highly readable for data-heavy interfaces.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter SemiBold/32px/tight letter-spacing (-0.02em)
  - H2 (Section Headers): Inter SemiBold/24px/tight letter-spacing
  - H3 (Card Titles): Inter Medium/18px/normal letter-spacing
  - Body (Descriptions): Inter Regular/14px/relaxed line-height (1.6)
  - Data Labels: JetBrains Mono Medium/13px/tabular figures for numbers
  - Small (Meta info): Inter Regular/12px/text-muted

## Animations
Animations should reinforce data relationships and state changes without distracting from analysis.

- Chart transitions use smooth easing (300ms) when data updates
- Filter changes trigger subtle fade transitions (200ms) for content
- Tree expand/collapse uses spring physics for natural feel
- Tooltip appears instantly (<50ms) but fades out gradually (150ms)
- Export button shows progress indicator during file generation
- Hover states on interactive elements use 150ms transitions
- Number changes animate with count-up effect for emphasis on deltas

## Component Selection
- **Components**: 
  - Select (multi-select for offers, date picker for ranges)
  - Card for widget containers with subtle shadows
  - Tabs for switching between chart types and aggregation levels
  - Accordion for collapsible sections in cost tree
  - Button with variants (primary for export, ghost for toggles)
  - Table with sticky headers for stage outputs
  - Tooltip for contextual information
  - Badge for price type indicators and status labels
  - Separator for visual section breaks
  - ScrollArea for long lists with custom scrollbars
- **Customizations**: 
  - Custom Recharts styling to match theme colors
  - Tree component built from scratch for hierarchical data
  - Waterfall chart custom implementation
  - Timeline scrubber for date selection
- **States**: 
  - Buttons: default, hover (lift + shadow), active (press), loading (spinner), disabled (muted)
  - Inputs: default, focused (ring + border color), error (red border), filled (subtle background)
  - Cards: default (white), hover (slight shadow increase for interactive cards)
- **Icon Selection**: 
  - Phosphor icons throughout: ChartLine, TreeStructure, ArrowsLeftRight, DownloadSimple, FunnelSimple, CalendarBlank, CaretDown/Up
- **Spacing**: 
  - Page padding: p-8
  - Card padding: p-6
  - Section gaps: gap-6
  - Element spacing: gap-4 for related items, gap-8 for sections
  - Grid layouts: grid with gap-6
- **Mobile**: 
  - Desktop-first with breakpoints at 1024px and 768px
  - Filters stack vertically on mobile
  - Charts scale down with adjusted aspect ratios
  - Tables scroll horizontally on small screens
  - Tree view uses full width with adjusted indentation
  - Export menu becomes drawer on mobile
