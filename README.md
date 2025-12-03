# Graiph

AI-Powered Automatic Dashboard Generator

Transform your CSV data into beautiful, insightful dashboards automatically using advanced AI analysis and quality validation.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What is Graiph?

Graiph is an intelligent dashboard generator that analyzes your tabular data and automatically creates the most relevant, insightful visualizations. Unlike traditional BI tools that require manual chart creation, Graiph uses AI to understand your data, generate smart visualizations, ensure quality through validation, and deliver dashboard-ready charts with professional styling.

### The Problem It Solves

Traditional dashboard creation requires hours of manual work, is prone to errors, requires expertise in chart selection, and involves tedious configuration. Graiph makes this instant (seconds instead of hours), smart (AI validates semantic correctness), professional (follows data visualization best practices), and effortless (just upload CSV, download dashboard).

## Features

### Core Capabilities

- CSV Upload: Supports any tabular dataset (e-commerce, HR, finance, IoT, etc.)
- AI-Powered Analysis: GPT-4o analyzes data and generates optimal visualizations
- 17 Chart Types: KPI cards, bar, column, line, area, pie, scatter, heatmap, treemap, funnel, and more
- Beautiful Design: Matplotlib-generated charts with professional styling
- Export Options: Download all charts as PNG or combined PDF
- Fast Generation: Complete dashboard in 30-60 seconds

### Three-Phase Quality System

Graiph uses a three-phase generation system to ensure every chart is perfect.

**Phase 1: Brainstorming**
The AI generates every possible chart idea and creates a comprehensive catalog of visualizations using maximum creativity.

**Phase 2: Selection**
The AI selects the best charts from the catalog, ensures diversity (7-9 different chart types), guarantees column coverage (uses all relevant columns), and respects user preferences.

**Phase 3: Quality Critic**
The AI becomes a critic and asks critical questions about each chart:

1. Does this aggregation make semantic sense?
   - Eliminates charts like "Average Release_Year" (years are temporal markers, not measurements)
   - Eliminates "Sum of Customer_ID" (IDs aren't metrics)
   - Keeps "Count of Orders by Month", "Average Revenue by Region"

2. Does this provide business value?
   - Eliminates redundant charts
   - Eliminates solid-color heatmaps (no information)
   - Keeps charts that reveal trends, patterns, insights

3. Is this chart readable?
   - Eliminates line charts with 100+ data points
   - Eliminates pie charts with 15+ slices
   - Keeps charts with appropriate binning and clear visuals

Only charts that pass all tests make it to your dashboard.

### Smart Data Validation

Graiph understands data semantics using universal pattern matching:

```
Pattern Recognition:
- *_Year, *_Date: Temporal markers (count, plot distributions)
- *_ID, *_Key: Identifiers (group by, count unique)
- Revenue, Price, Quantity: True metrics (safe to average/sum)

Works with any dataset:
- E-commerce: Order_Date, Customer_ID, Order_Value
- HR: Hire_Year, Employee_ID, Salary
- Finance: Transaction_Date, Account_ID, Amount
- IoT: Timestamp, Sensor_ID, Reading
- Healthcare: Admission_Date, Patient_ID, Cost
```

## Architecture

### Tech Stack

**Frontend:**
- Next.js 14.2.33 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Recharts (chart previews)

**Backend:**
- Python 3.11 + Flask
- Matplotlib + Seaborn (chart generation)
- NumPy + Pandas (data processing)

**AI:**
- OpenAI GPT-4o (dashboard planning)
- Custom prompts with semantic validation
- JSON-mode for structured outputs

### System Flow

```
CSV Upload
    ↓
Data Profiling
  - Column types (numeric/categorical)
  - Statistics (min/max/avg)
  - Missing data detection
  - Cardinality analysis
    ↓
PHASE 1: Brainstorming
  GPT-4o generates all chart ideas
  (30-50 possibilities)
    ↓
PHASE 2: Selection
  GPT-4o selects best 10-12 charts
  (ensures diversity + coverage)
    ↓
PHASE 3: Quality Critic
  AI asks critical questions:
  - Semantic correctness?
  - Business value?
  - Readability?
  Eliminates charts that fail
    ↓
Python Backend
  Matplotlib generates final charts
  Returns base64 PNG images
    ↓
Dashboard Display
  Interactive grid with zoom/download
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- OpenAI API key

### Clone Repository

```bash
git clone https://github.com/MehmetusRulez/graiph.git
cd graiph
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=sk-...
```

### Backend Setup

```bash
cd python-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Backend:**
```bash
cd python-backend
source venv/bin/activate
python app.py
# Runs on http://localhost:5001
```

## Usage

### Basic Usage

1. Upload CSV
   - Click the upload area
   - Select your CSV file
   - Data will be profiled automatically

2. Configure (Optional)
   - Select specific chart types
   - Choose columns to focus on
   - Set max number of charts
   - Add usage context for better AI understanding

3. Generate Dashboard
   - Click "Generate Dashboard"
   - Wait 30-60 seconds for AI analysis
   - View generated charts in interactive grid

4. Export
   - Download individual charts as PNG
   - Download all charts as combined PDF

### Advanced Features

**Column Selection:**
```javascript
// Only visualize specific columns
includeColumns: ["Revenue", "Region", "Product_Category"]
```

**Chart Type Restriction:**
```javascript
// Only generate bar, line, and pie charts
selectedChartTypes: ["bar", "line", "pie"]
```

**Column Pairing:**
```javascript
// Force specific column combinations
pairings: [
  { x: "Date", y: "Revenue" },
  { x: "Region", y: "Sales", series: "Product" }
]
```

**Usage Context:**
```javascript
// Help AI understand your data
usageContext: "This is sales data for Q4 2024. Focus on regional performance and product trends."
```

## Supported Chart Types

| Category | Chart Types |
|----------|-------------|
| KPIs | Number cards with key metrics |
| Comparison | Bar, Column, Grouped Bar |
| Trend | Line, Area, Stacked Area |
| Distribution | Histogram, Box Plot, Violin Plot |
| Correlation | Scatter, Bubble |
| Composition | Pie, Donut, Treemap |
| Advanced | Heatmap, Funnel, Radar, Gauge |

## Example Datasets

Graiph works with any CSV data. Try these examples:

### E-commerce
```csv
Order_ID,Order_Date,Customer_ID,Product,Revenue,Region
1001,2024-01-15,C123,Widget A,299.99,North
1002,2024-01-16,C456,Widget B,449.99,South
...
```

### HR Analytics
```csv
Employee_ID,Hire_Year,Department,Salary,Performance_Score
E001,2020,Engineering,95000,4.2
E002,2021,Sales,75000,3.8
...
```

### IoT Sensors
```csv
Timestamp,Sensor_ID,Temperature,Humidity,Location
2024-01-15 10:00:00,S001,22.5,45.2,Building A
2024-01-15 10:05:00,S001,22.7,45.1,Building A
...
```

## Configuration

### Environment Variables

Create `.env.local`:

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Custom port for Next.js (default: 3000)
PORT=3001
```

### Python Backend Configuration

Edit `python-backend/app.py`:

```python
# Change port
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

# Adjust CORS origins
CORS(app, resources={r"/*": {"origins": ["http://localhost:3001"]}})
```

## Troubleshooting

### Common Issues

**Port 3000 is already in use**
```bash
# The app will automatically use port 3001
# Or kill the process using port 3000:
lsof -ti:3000 | xargs kill -9
```

**OpenAI API Key not found**
```bash
# Make sure .env.local exists and contains your API key
echo "OPENAI_API_KEY=sk-..." > .env.local
```

**Python backend connection failed**
```bash
# Ensure Python backend is running
cd python-backend
source venv/bin/activate
python app.py

# Check health endpoint
curl http://localhost:5001/health
```

**Charts not generating**
```bash
# Check backend logs for errors
# Common issue: Missing Python dependencies
pip install -r requirements.txt

# Matplotlib backend issues on macOS
pip install --upgrade matplotlib
```

## Performance

- Dashboard Generation Time: 30-60 seconds (depending on data size)
- Supported Dataset Size: Up to 100,000 rows (recommended < 50,000 for best performance)
- Concurrent Users: Scales with OpenAI API rate limits
- Chart Generation: 8-12 charts per dashboard

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for frontend code
- Follow existing code style (Prettier + ESLint)
- Add comments for complex logic
- Test with multiple dataset types
- Update README if adding features

## Roadmap

- Support for Excel files (.xlsx)
- Real-time data connections (PostgreSQL, MySQL, MongoDB)
- Custom chart styling/theming
- Dashboard templates by industry
- Interactive filters and drill-downs
- Scheduled dashboard regeneration
- Multi-language support
- Cloud deployment (Vercel + Railway)
- API access for programmatic use
- Collaborative dashboard editing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI: GPT-4o powers the intelligent analysis
- Next.js Team: Amazing React framework
- Matplotlib Community: Best Python visualization library

## Star History

If you find Graiph useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=MehmetusRulez/graiph&type=Date)](https://star-history.com/#MehmetusRulez/graiph&Date)

## Why "Graiph"?

Graiph = Graph + AI + graph

A combination representing the fusion of traditional graphing/charting with artificial intelligence. It's memorable, searchable, and reflects the core mission: making data visualization intelligent and effortless.

---

[Back to Top](#graiph)
