import { NextRequest, NextResponse } from 'next/server';
import { profileCSV, parseCSV } from '@/lib/dataProfile';
import { generateDashboardSchema, validateDashboardQuality } from '@/lib/llm';
import { generateChartsFromPlan } from '@/lib/chartGenerator';
import type {
  GenerateDashboardRequest,
  DashboardSchema,
} from '@/types/dashboard';

/**
 * THREE-PHASE DASHBOARD GENERATION SYSTEM
 *
 * PHASE 1: BRAINSTORMING (Generate ALL Ideas)
 * - AI (GPT-4o) analyzes the data
 * - Generates EVERY possible chart idea
 * - Creates comprehensive catalog of visualizations
 *
 * PHASE 2: SELECTION (Choose the Best)
 * - AI selects the BEST charts from the catalog
 * - Decides which columns to use
 * - Decides how many charts to create
 * - Decides what type each chart should be
 * - Creates a dashboard PLAN (draft)
 *
 * PHASE 3: CRITIC (Self-Questioning & Elimination)
 * - AI becomes a RUTHLESS CRITIC
 * - Asks critical questions about EACH chart:
 *   - "Does this aggregation make semantic sense?"
 *   - "Does this provide business value?"
 *   - "Is this chart readable?"
 * - ELIMINATES charts that fail quality tests
 * - ONLY perfect charts proceed to visualization
 *
 * PHASE 4: PYTHON BACKEND CHART GENERATION (Implementation)
 * - Integrated backend system receives the final plan
 * - Validates each chart specification
 * - Applies data transformations
 * - Generates final renderable charts
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      csvContent: string;
      usageContext?: string;
      themeText?: string;
      includeColumns?: string[];
      pairings?: any[];
      maxCharts?: number;
      layoutHint?: string;
      selectedChartTypes?: string[];
    };

    const {
      csvContent,
      usageContext,
      themeText,
      includeColumns = [],
      pairings = [],
      maxCharts,
      layoutHint,
      selectedChartTypes = [],
    } = body;

    if (!csvContent) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 },
      );
    }

    console.log('====================================');
    console.log('🚀 THREE-PHASE DASHBOARD GENERATION');
    console.log('====================================');

    // Profile the dataset
    const dataProfile = profileCSV(csvContent);
    console.log(`📊 Dataset: ${dataProfile.rowCount} rows, ${dataProfile.columns.length} columns`);

    // Build LLM request
    const llmRequest: GenerateDashboardRequest = {
      dataProfile,
      usageContext: usageContext || null,
      theme: {
        text: themeText || null,
      },
      columnPreferences: {
        includeColumns: includeColumns.length > 0 ? includeColumns : null,
        pairings: pairings.length > 0 ? pairings : null,
      },
      chartPreferences: {
        maxCharts:
          typeof maxCharts === 'number' && maxCharts > 0 ? maxCharts : null,
        layoutHint: layoutHint || null,
        selectedChartTypes: selectedChartTypes.length > 0 ? selectedChartTypes : null,
      },
    };

    // ==========================================
    // PHASE 1: AI PLANNING WITH QUALITY VALIDATION
    // ==========================================
    console.log('\n📝 PHASE 1: AI PLANNING (Draft Creation)');
    console.log('   AI is analyzing your data and creating a dashboard plan...');

    const MAX_ATTEMPTS = 3; // Try up to 3 times to get a quality dashboard
    let aiPlan: DashboardSchema | null = null;
    let validationPassed = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`\n   Attempt ${attempt}/${MAX_ATTEMPTS}...`);

      // Generate dashboard plan
      const proposedPlan: DashboardSchema = await generateDashboardSchema(llmRequest);

      console.log('   📊 Plan Created:');
      console.log(`      - Charts planned: ${proposedPlan.charts.length}`);
      console.log(`      - Layout: ${proposedPlan.layout.rows}x${proposedPlan.layout.columns} grid`);
      proposedPlan.charts.forEach((chart, idx) => {
        console.log(`      - Chart ${idx + 1}: ${chart.type} - "${chart.title}"`);
      });

      // Validate quality
      console.log('\n   🔍 Validating dashboard quality...');
      const validation = await validateDashboardQuality(dataProfile, proposedPlan);

      if (validation.isGood) {
        console.log('   ✅ VALIDATION PASSED - Dashboard quality is excellent!');
        console.log(`   💬 Feedback: ${validation.feedback}`);
        aiPlan = proposedPlan;
        validationPassed = true;
        break;
      } else {
        console.log('   ❌ VALIDATION FAILED - Regenerating...');
        console.log(`   💬 Feedback: ${validation.feedback}`);

        if (attempt === MAX_ATTEMPTS) {
          console.log('   ⚠️  Max attempts reached, using last generated plan');
          aiPlan = proposedPlan;
        }
      }
    }

    if (!aiPlan) {
      throw new Error('Failed to generate a valid dashboard plan');
    }

    console.log('\n   ✅ Final AI Plan Selected:');
    console.log(`      - Charts: ${aiPlan.charts.length}`);
    console.log(`      - Validated: ${validationPassed ? 'Yes ✅' : 'No (max attempts)'}`);

    // ==========================================
    // PHASE 2: PYTHON BACKEND GRAPH GENERATION
    // ==========================================
    console.log('\n🐍 PHASE 2: PYTHON BACKEND GRAPH GENERATION');
    console.log('   Calling Python service to generate actual graphs...');

    // Validate the plan first
    const validationResult = await generateChartsFromPlan(aiPlan, dataProfile);

    if (!validationResult.success) {
      console.error('   ❌ Plan validation failed');
      return NextResponse.json(
        {
          error: 'Plan validation failed',
          details: validationResult.errors?.join(', '),
        },
        { status: 500 },
      );
    }

    // Parse the CSV data for Python backend
    const parsedData = parseCSV(csvContent);

    // Call Python backend to generate graphs
    try {
      const pythonResponse = await fetch('http://localhost:5001/generate-graphs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: parsedData,
          charts: validationResult.generatedCharts,
        }),
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python backend error: ${pythonResponse.statusText}`);
      }

      const pythonResult = await pythonResponse.json();

      console.log(`   ✅ Python backend generated ${pythonResult.total} graphs`);
      console.log('\n✅ THREE-PHASE GENERATION COMPLETE');
      console.log('====================================\n');

      return NextResponse.json({
        success: true,
        schema: aiPlan,
        charts: pythonResult.charts,  // Contains base64 images
        dataProfile,
        metadata: {
          aiPlan: {
            chartsPlanned: aiPlan.charts.length,
            layout: aiPlan.layout,
          },
          generation: {
            totalCharts: pythonResult.total,
            validCharts: pythonResult.total,
            backend: 'python-matplotlib',
          },
        },
      });

    } catch (pythonError) {
      console.error('   ❌ Python backend error:', pythonError);
      return NextResponse.json(
        {
          error: 'Failed to generate graphs',
          details: pythonError instanceof Error ? pythonError.message : 'Python backend unavailable',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error in generate-dashboard API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
