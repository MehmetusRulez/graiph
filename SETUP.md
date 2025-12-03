# Graiph - AI-Powered Dashboard Generator

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
npm install --cache /tmp/.npm-cache
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## How to Use

1. **Upload CSV File**: Click the upload area and select your CSV file
2. **Configure Options** (all optional):
   - **Usage Context**: Describe where the dashboard will be used
   - **Theme**: Describe the desired visual style
   - **Max Charts**: Set the maximum number of charts (or leave empty for AI to decide)
3. **Select Columns**: Choose which columns to visualize (all selected by default)
4. **Define Pairings**: Optionally specify which columns should be paired together
5. **Generate**: Click "Generate Dashboard" and the system will:
   - **Phase 1 (AI Planning)**: GPT-4o analyzes your data and creates a dashboard plan
   - **Phase 2 (Backend Generation)**: Integrated backend validates and generates the charts
   - View your professional dashboard with visualizations!

For detailed information about how the two-phase system works, see [ARCHITECTURE.md](ARCHITECTURE.md)

## Features

- **Automatic Chart Selection**: AI chooses the most appropriate chart types based on your data
- **Smart Column Pairing**: AI intelligently pairs columns for meaningful visualizations
- **Multiple Chart Types**: Supports 20+ chart types including:
  - Basic: Line, Bar, Column, Area, Pie, Donut
  - Stacked: Stacked Bar/Column, Percent Stacked Bar/Column
  - Advanced: Scatter, KPI/Card, Table/Matrix, Combo (Line + Bar)
  - Business: Funnel, Waterfall, Treemap
  - Statistical: Histogram, Heatmap
- **Responsive Layout**: Automatically creates a grid layout for your charts
- **Export Options**: Download the dashboard schema as JSON and data as CSV
- **Modern UI**: Glassmorphism effects with Tailwind CSS
- **Professional BI Agent**: Uses GPT-4o with expert BI dashboard architect prompting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **CSV Parsing**: PapaParse
- **AI**: OpenAI GPT-4

## Project Structure

```
Graiph/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate-dashboard/
│   │   │       └── route.ts          # API endpoint for dashboard generation
│   │   ├── globals.css               # Global styles with glassmorphism
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main page with workflow
│   ├── components/
│   │   ├── charts/
│   │   │   └── ChartRenderer.tsx     # Renders 20+ chart types
│   │   ├── ConfigurationForm.tsx     # Upload and config form
│   │   └── DashboardRenderer.tsx     # Dashboard grid layout
│   ├── lib/
│   │   ├── dataProfile.ts            # CSV profiling and parsing
│   │   ├── dashboardAgentPrompt.ts   # Professional BI agent prompt (Phase 1)
│   │   ├── llm.ts                    # OpenAI GPT-4o integration (Phase 1)
│   │   └── chartGenerator.ts         # Integrated backend chart generator (Phase 2)
│   └── types/
│       └── dashboard.ts              # TypeScript type definitions
├── .env.example                      # Environment variable template
├── package.json                      # Dependencies
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── next.config.js                    # Next.js configuration
```

## Troubleshooting

### npm Install Issues

If you encounter npm cache permission errors, use:

```bash
npm install --cache /tmp/.npm-cache
```

### OpenAI API Errors

- Make sure your API key is valid
- Check that you have sufficient credits in your OpenAI account
- Verify the `.env.local` file is in the root directory

### CSV Upload Issues

- Ensure your CSV file has headers in the first row
- Check that the file is properly formatted (comma-separated)
- Large files may take longer to process

## Example CSV Files

You can test with any CSV file. Here are some suggestions:

- Sales data (date, product, quantity, revenue)
- User analytics (date, users, sessions, conversions)
- Financial data (date, income, expenses, profit)
- Survey results (category, responses, ratings)

## License

This project is open source and available for use.
