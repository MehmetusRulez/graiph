# Python Graph Generation Backend

This service generates professional graph images using matplotlib and seaborn.

## Setup

1. Install Python dependencies:
```bash
cd python-backend
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### GET /health
Health check endpoint

### POST /generate-graphs
Generates graph images from dashboard plan

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
  "charts": [
    {
      "id": "chart-1",
      "title": "Revenue by Region",
      "image": "base64_encoded_png_image",
      "type": "bar"
    }
  ]
}
```

## Supported Chart Types

- `bar` / `column` - Bar charts with aggregation
- `line` - Line charts for trends
- `pie` / `donut` - Pie charts
- `histogram` - Distribution histograms
- `scatter` - Scatter plots
- `boxplot` - Box plots for statistical distribution
- `heatmap` - Correlation heatmaps
- `kpi` / `card` - KPI cards with large numbers
