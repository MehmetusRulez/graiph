# Graiph - Two-Phase Dashboard Generation Architecture

## Overview

Graiph uses a **Two-Phase Dashboard Generation System** where AI creates the plan (draft) and an integrated backend system generates the actual charts.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS CSV                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA PROFILING SYSTEM                          │
│  • Analyzes CSV structure                                        │
│  • Detects column types (numeric, categorical, datetime, text)   │
│  • Extracts sample values                                        │
│  • Calculates missing rates                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          PHASE 1: AI PLANNING (Draft Creation)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  GPT-4o (DASHBOARD PLANNER PRO)                           │  │
│  │                                                           │  │
│  │  AI Responsibilities:                                     │  │
│  │   Analyze data profile                                  │  │
│  │   Decide which columns to visualize                     │  │
│  │   Decide how many charts to create (3-6 optimal)        │  │
│  │   Decide what type each chart should be                 │  │
│  │   Decide x/y/series/aggregation mappings                │  │
│  │   Design layout (rows x columns grid)                   │  │
│  │                                                           │  │
│  │  Output: Dashboard Plan (JSON)                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Dashboard Plan (JSON)
                             │ {
                             │   layout: { rows: 2, columns: 2 },
                             │   charts: [
                             │     {
                             │       id: "chart-1",
                             │       title: "Revenue by Month",
                             │       type: "line",
                             │       mapping: { x: "date", y: "revenue", ... }
                             │     },
                             │     ...
                             │   ]
                             │ }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│       PHASE 2: BACKEND CHART GENERATION (Implementation)         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Integrated Backend System (chartGenerator.ts)           │  │
│  │                                                           │  │
│  │  Backend Responsibilities:                               │  │
│  │   Validate AI plan                                      │  │
│  │   Check all column references exist                     │  │
│  │   Verify chart types are supported                      │  │
│  │   Ensure required mappings are present                  │  │
│  │   Apply smart enhancements:                             │  │
│  │    - Auto-generate descriptions if missing               │  │
│  │    - Infer best aggregation methods                      │  │
│  │    - Optimize data transformations                       │  │
│  │   Return validated, renderable charts                   │  │
│  │                                                           │  │
│  │  Output: Final Dashboard Schema                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CHART RENDERING SYSTEM                         │
│  • Receives final schema                                         │
│  • Renders each chart using Recharts library                     │
│  • Supports 20+ chart types                                      │
│  • Displays in responsive grid layout                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown

### PHASE 1: AI Planning (Draft Creation)

**Location:** `src/lib/llm.ts` + `src/lib/dashboardAgentPrompt.ts`

**What the AI Does:**
1. Receives the data profile with column information
2. Receives user preferences (context, theme, column selections, pairings)
3. Analyzes the data to understand metrics vs dimensions
4. Makes intelligent decisions:
   - "This dataset has dates and sales → use a line chart"
   - "This has categories and amounts → use a bar chart"
   - "This has a single key metric → use a KPI card"
5. Creates a JSON plan with:
   - Layout grid (e.g., 2 rows × 3 columns)
   - Chart specifications (type, title, column mappings)

**What the AI Does NOT Do:**
-  Does not render charts
-  Does not process the actual data
-  Does not validate column existence
-  Does not handle data transformations

**Example AI Output (Dashboard Plan):**
```json
{
  "layout": {
    "rows": 2,
    "columns": 2
  },
  "charts": [
    {
      "id": "chart-1",
      "title": "Revenue Trend",
      "type": "line",
      "mapping": {
        "x": "date",
        "y": "revenue",
        "aggregation": "sum"
      }
    },
    {
      "id": "chart-2",
      "title": "Sales by Region",
      "type": "bar",
      "mapping": {
        "x": "region",
        "y": "sales",
        "aggregation": "sum"
      }
    },
    {
      "id": "chart-3",
      "title": "Total Revenue",
      "type": "kpi",
      "mapping": {
        "y": "revenue",
        "aggregation": "sum"
      }
    }
  ]
}
```

---

### PHASE 2: Backend Chart Generation (Implementation)

**Location:** `src/lib/chartGenerator.ts`

**What the Backend Does:**
1. Receives the AI plan (draft)
2. **Validates each chart:**
   -  Does the column "revenue" exist in the dataset?
   -  Is "line" a supported chart type?
   -  Does a line chart have both x and y mappings?
3. **Enhances charts:**
   - Adds descriptions if missing
   - Infers optimal aggregation methods
   - Applies data transformation logic
4. **Returns final schema:**
   - Only validated charts
   - Enhanced with smart defaults
   - Ready to render

**Example Backend Processing Log:**
```
 BACKEND CHART GENERATOR: Processing AI plan...
   - Total charts in plan: 3
   - Layout: 2x2
   - Validating chart 1/3: Revenue Trend
   - Validating chart 2/3: Sales by Region
   - Validating chart 3/3: Total Revenue
 BACKEND CHART GENERATOR: Processing complete
   - Valid charts: 3
   - Invalid charts: 0
   - Processing time: 15ms
```

**What Happens if Validation Fails:**
- If a chart references a non-existent column → Chart is rejected
- If a chart type is unsupported → Chart is rejected
- If required mappings are missing → Chart is rejected
- The system returns only valid charts to ensure the dashboard works

---

## API Flow

**Endpoint:** `POST /api/generate-dashboard`

### Request:
```json
{
  "csvContent": "date,revenue,region\n2024-01-01,1000,North\n...",
  "usageContext": "Sales dashboard for executives",
  "themeText": "Professional and clean",
  "includeColumns": ["date", "revenue", "region"],
  "maxCharts": 4
}
```

### Processing Steps:

1. **Data Profiling**
   ```
    Dataset: 100 rows, 3 columns
   ```

2. **Phase 1: AI Planning**
   ```
    PHASE 1: AI PLANNING (Draft Creation)
      AI is analyzing your data and creating a dashboard plan...
       AI Plan Created:
         - Charts planned: 3
         - Layout: 2x2 grid
         - Chart 1: line - "Revenue Trend"
         - Chart 2: bar - "Sales by Region"
         - Chart 3: kpi - "Total Revenue"
   ```

3. **Phase 2: Backend Generation**
   ```
    PHASE 2: BACKEND CHART GENERATION (Implementation)
      Integrated backend is processing the AI plan...
       BACKEND CHART GENERATOR: Processing AI plan...
         - Validating chart 1/3: Revenue Trend
         - Validating chart 2/3: Sales by Region
         - Validating chart 3/3: Total Revenue
       BACKEND CHART GENERATOR: Processing complete
         - Valid charts: 3
         - Invalid charts: 0
   ```

4. **Completion**
   ```
    TWO-PHASE GENERATION COMPLETE
      - Backend processing time: 15ms
      - Final charts: 3/3
   ```

### Response:
```json
{
  "success": true,
  "schema": {
    "layout": { "rows": 2, "columns": 2 },
    "charts": [
      {
        "id": "chart-1",
        "title": "Revenue Trend",
        "description": "revenue by date",
        "type": "line",
        "mapping": { "x": "date", "y": "revenue", "aggregation": "sum" }
      },
      ...
    ]
  },
  "metadata": {
    "aiPlan": {
      "chartsPlanned": 3,
      "layout": { "rows": 2, "columns": 2 }
    },
    "generation": {
      "totalCharts": 3,
      "validCharts": 3,
      "invalidCharts": 0,
      "processingTime": 15
    }
  }
}
```

---

## Key Components

### 1. AI Planner (`src/lib/llm.ts`)
- Uses GPT-4o model
- Professional BI agent prompt
- Creates dashboard plans based on data analysis
- Temperature: 0.3 (deterministic)

### 2. Backend Generator (`src/lib/chartGenerator.ts`)
- Validates AI plans
- Checks column references
- Ensures chart type support
- Applies enhancements
- Returns final schema

### 3. Chart Renderer (`src/components/charts/ChartRenderer.tsx`)
- Renders 20+ chart types
- Uses Recharts library
- Supports: line, bar, pie, donut, KPI, scatter, funnel, etc.

### 4. API Route (`src/app/api/generate-dashboard/route.ts`)
- Orchestrates both phases
- Profiles data
- Calls AI planner
- Calls backend generator
- Returns final dashboard

---

## Benefits of Two-Phase System

### 1. **Separation of Concerns**
- AI focuses on decision-making
- Backend focuses on implementation
- Clear responsibilities for each component

### 2. **Reliability**
- Backend validation ensures all charts work
- Invalid charts are caught before rendering
- No runtime errors from bad column names

### 3. **Flexibility**
- Can swap out AI models easily
- Can change validation logic independently
- Can add new chart types without touching AI

### 4. **Debugging**
- Clear logs for each phase
- Easy to identify where issues occur
- Can inspect AI plan before implementation

### 5. **Performance**
- Backend processing is fast (< 20ms)
- AI only does planning, not data processing
- Efficient validation and transformation

---

## Supported Chart Types

The backend system currently supports:

**Basic:** line, bar, column, area, pie, donut, scatter
**KPI:** kpi, card
**Stacked:** stacked_bar, stacked_column, percent_stacked_bar, percent_stacked_column
**Advanced:** combo (line + bar), funnel, waterfall, histogram
**Data:** table, matrix
**Placeholders:** treemap, heatmap (can be enhanced)

---

## Future Enhancements

1. **Plan Preview UI**
   - Show AI plan to user before generating
   - Allow user to approve/modify plan
   - Interactive plan editing

2. **Advanced Validations**
   - Data type compatibility checks
   - Suggested aggregation improvements
   - Chart type recommendations

3. **Smart Enhancements**
   - Auto-detect time series patterns
   - Suggest drill-down relationships
   - Identify key correlations

4. **Performance Optimizations**
   - Cache AI plans for similar datasets
   - Parallel chart validation
   - Lazy chart rendering

---

## Conclusion

The Two-Phase Dashboard Generation System provides a robust, maintainable, and flexible architecture where:

- **AI** = Creative decision-making (what to show, how to show it)
- **Backend** = Reliable implementation (validation, transformation, rendering)

This separation ensures that dashboards are both intelligent and dependable.
