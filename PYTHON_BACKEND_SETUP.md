# Python Backend Setup Guide

## NEW ARCHITECTURE

**ChatGPT** → Creates dashboard plan (decides what graphs to make)
**Python Backend** → Generates actual professional graph images (matplotlib/seaborn)
**Next.js Frontend** → Displays the generated images

---

## Quick Start

### 1. Install Python Dependencies

```bash
cd python-backend
pip install -r requirements.txt
```

### 2. Start Python Backend

```bash
python app.py
```

The Python service will start on `http://localhost:5001`

### 3. Start Next.js Frontend

In a **separate terminal**:

```bash
cd ..
npm run dev
```

The Next.js app will run on `http://localhost:3001`

---

## How It Works

1. **User uploads CSV** in Next.js frontend
2. **Phase 1: AI Planning** - ChatGPT analyzes data and creates plan:
   ```json
   {
     "charts": [
       {
         "id": "chart-1",
         "title": "Revenue by Region",
         "type": "bar",
         "mapping": { "x": "region", "y": "revenue" }
       }
     ]
   }
   ```

3. **Phase 2: Python Generation** - Next.js sends plan to Python backend:
   - Python receives plan + CSV data
   - Generates professional graphs using matplotlib/seaborn
   - Returns base64-encoded PNG images

4. **Frontend Display** - Next.js displays the images

---

## Python Backend API

### Endpoint: POST /generate-graphs

**Request:**
```json
{
  "data": [
    {"region": "North", "revenue": 5000},
    {"region": "South", "revenue": 3000}
  ],
  "charts": [
    {
      "id": "chart-1",
      "title": "Revenue by Region",
      "type": "bar",
      "mapping": {
        "x": "region",
        "y": "revenue",
        "aggregation": "sum"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 1,
  "charts": [
    {
      "id": "chart-1",
      "title": "Revenue by Region",
      "image": "iVBORw0KGgoAAAANSUhEUg...",  // base64 PNG
      "type": "bar"
    }
  ]
}
```

---

## Supported Chart Types

- `bar` / `column` - Bar/column charts
- `line` - Line charts for trends
- `pie` / `donut` - Pie charts
- `histogram` - Distribution histograms
- `scatter` - Scatter plots
- `boxplot` - Box plots
- `heatmap` - Correlation heatmaps
- `kpi` / `card` - KPI cards

---

## Troubleshooting

### Python backend not starting?

Check if port 5000 is available:
```bash
lsof -i :5000
```

### Connection refused error?

Make sure Python backend is running before using the Next.js app.

### Module not found errors?

Reinstall Python dependencies:
```bash
cd python-backend
pip install -r requirements.txt --upgrade
```

---

## Architecture Diagram

```
┌─────────────┐
│   User      │
│  Uploads    │
│   CSV       │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│    Next.js Frontend             │
│    (localhost:3001)             │
└──────┬──────────────────┬───────┘
       │                  │
       │ Phase 1          │ Phase 2
       ▼                  ▼
┌─────────────┐    ┌──────────────────┐
│  ChatGPT    │    │  Python Backend  │
│  (AI Plan)  │    │  (localhost:5000)│
│             │    │                  │
│  Decides:   │    │  Generates:      │
│  - Charts   │    │  - PNG images    │
│  - Columns  │    │  - Using         │
│  - Types    │    │    matplotlib    │
└─────────────┘    └──────────────────┘
       │                  │
       └────────┬─────────┘
                ▼
         ┌──────────────┐
         │  Dashboard   │
         │  with Images │
         └──────────────┘
```

---

## Benefits of Python Backend

 **Professional graphs** - matplotlib/seaborn create publication-quality visualizations
 **No frontend library issues** - Recharts problems are gone
 **More chart types** - Access to full Python visualization ecosystem
 **Better performance** - Graph generation happens on backend
 **Reusable images** - PNG images can be downloaded/shared

---

## Next Steps

Want to add more chart types? Edit `python-backend/app.py` and add new generator functions!

Want different styling? Customize matplotlib/seaborn settings in the Python code.
