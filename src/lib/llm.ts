// src/lib/llm.ts
import OpenAI from "openai";
import {
  COMPREHENSIVE_ANALYSIS_PROMPT,
  CHART_SELECTION_PROMPT,
  CHART_CRITIC_PROMPT
} from "./dashboardAgentPrompt";
import type {
  DashboardSchema,
  GenerateDashboardRequest,
} from "@/types/dashboard";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Attempts to repair malformed JSON by fixing common issues
 */
function repairJSON(jsonString: string): string {
  try {
    // Try parsing as-is first
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.log("⚠️  JSON parse failed, attempting to repair...");

    let repaired = jsonString;

    // Step 1: Remove any trailing commas before closing braces/brackets
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // Step 2: Fix common escape issues in AI-generated JSON
    repaired = repaired.replace(/([^"\\])\\n([^"])/g, '$1 $2');

    // Step 3: ADVANCED string termination repair with comprehensive state tracking
    let inString = false;
    let result = '';
    let escaped = false;
    let bracketDepth = 0;
    let braceDepth = 0;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      const nextChar = i + 1 < repaired.length ? repaired[i + 1] : '';

      // Track escape sequences
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }

      // Track if we're inside a string
      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }

      // If we're inside a string, check for problematic patterns
      if (inString) {
        // Close string before newline (AI often breaks strings at newlines)
        if (char === '\n') {
          result += '"\n';
          inString = false;
          continue;
        }

        // Close string before structural characters that shouldn't be in strings
        if ((char === '{' || char === '}' || char === '[' || char === ']' || char === ':') && nextChar !== '"') {
          // This is likely a malformed string - close it
          result += '" ' + char;
          inString = false;
          continue;
        }
      }

      // Track structure depth when outside strings
      if (!inString) {
        if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
      }

      result += char;
    }

    // If still in a string at the end, close it
    if (inString) {
      result += '"';
    }

    repaired = result;

    // Step 4: Close any unclosed structures
    let openBraces = 0;
    let openBrackets = 0;
    inString = false;
    escaped = false;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
      }
    }

    // Add closing structures if needed
    while (openBrackets > 0) {
      repaired += ']';
      openBrackets--;
    }
    while (openBraces > 0) {
      repaired += '}';
      openBraces--;
    }

    // Step 5: Remove invalid trailing content
    // Find the last complete JSON structure
    let lastValidEnd = repaired.length;
    let depth = 0;
    inString = false;
    escaped = false;

    for (let i = repaired.length - 1; i >= 0; i--) {
      const char = repaired[i];

      if (!escaped && char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
      }

      escaped = false;

      if (!inString) {
        if (char === '}' || char === ']') depth++;
        else if (char === '{' || char === '[') {
          depth--;
          if (depth < 0) {
            // Found unmatched opening bracket - this is invalid
            lastValidEnd = i;
          }
        }
      }
    }

    // Trim to last valid position if needed
    if (lastValidEnd < repaired.length) {
      repaired = repaired.substring(0, lastValidEnd);
    }

    console.log("✅ JSON repaired with ADVANCED techniques");
    return repaired;
  }
}

/**
 * Safe JSON parse with automatic repair attempt and aggressive fallback strategies
 */
function safeJSONParse<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.log("⚠️  Initial JSON parse failed, attempting repair...");

    // First attempt: standard repair
    try {
      const repaired = repairJSON(jsonString);
      return JSON.parse(repaired) as T;
    } catch (repairError) {
      console.log("⚠️  Standard repair failed, trying aggressive truncation...");

      // Second attempt: Truncate to last valid JSON structure
      try {
        // Find the last complete JSON object/array
        let truncated = jsonString;
        let lastValidIndex = -1;

        // Try to find the last closing brace/bracket that makes valid JSON
        for (let i = jsonString.length - 1; i >= jsonString.length / 2; i--) {
          const candidate = jsonString.substring(0, i);
          try {
            JSON.parse(candidate);
            lastValidIndex = i;
            break;
          } catch {
            // Continue searching
          }
        }

        if (lastValidIndex > 0) {
          truncated = jsonString.substring(0, lastValidIndex);
          console.log(`   Found valid JSON at position ${lastValidIndex}`);
          return JSON.parse(truncated) as T;
        }

        // Third attempt: repair the truncated version
        const repairedTruncated = repairJSON(truncated);
        return JSON.parse(repairedTruncated) as T;
      } catch (truncateError) {
        console.error("❌ All JSON repair attempts failed");
        console.error("   Original error:", error instanceof Error ? error.message : 'Unknown');
        console.error("   Repair error:", repairError instanceof Error ? repairError.message : 'Unknown');
        console.error("   Truncate error:", truncateError instanceof Error ? truncateError.message : 'Unknown');
        console.error("   JSON preview (first 500 chars):", jsonString.substring(0, 500));
        console.error("   JSON preview (last 500 chars):", jsonString.substring(Math.max(0, jsonString.length - 500)));

        throw new Error(`Failed to parse JSON even after repair attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

/**
 * PHASE 1: Generate ALL possible logical chart ideas (comprehensive analysis)
 */
async function generateAllChartIdeas(
  request: GenerateDashboardRequest
): Promise<any[]> {
  console.log("\n🔍 PHASE 1: Generating ALL possible chart ideas...");

  const userContent = JSON.stringify({
    message: "Generate an EXHAUSTIVE list of ALL logical chart ideas for this dataset.",
    dataProfile: request.dataProfile,
    usageContext: request.usageContext,
    theme: request.theme,
  }, null, 2);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: COMPREHENSIVE_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9, // Maximum creativity for brainstorming
      max_tokens: 8000, // MUCH more tokens for comprehensive list
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from Phase 1");
    }

    console.log(`   📄 Response length: ${content.length} characters`);

    const result = safeJSONParse<{ allChartIdeas: any[] }>(content);
    const chartIdeas = result.allChartIdeas || [];

    if (!Array.isArray(chartIdeas)) {
      throw new Error("Phase 1 response does not contain a valid chart ideas array");
    }

    console.log(`   ✅ Generated ${chartIdeas.length} chart ideas`);
    console.log(`   📊 Chart types: ${[...new Set(chartIdeas.map(c => c.type))].join(", ")}`);

    return chartIdeas;
  } catch (error) {
    console.error("Error in Phase 1 (generate all ideas):", error);
    throw error;
  }
}

/**
 * PHASE 2: Select the BEST charts from comprehensive list
 */
async function selectBestCharts(
  request: GenerateDashboardRequest,
  allChartIdeas: any[]
): Promise<DashboardSchema> {
  console.log("\n🎯 PHASE 2: Selecting BEST charts from comprehensive list...");

  // Build message with optional chart type restriction
  const selectedChartTypes = request.chartPreferences.selectedChartTypes;
  const hasChartTypePreference = selectedChartTypes && selectedChartTypes.length > 0;

  let message = "From this comprehensive list, select the BEST charts for a perfect dashboard. Return your response as JSON.";

  if (hasChartTypePreference) {
    message += `\n\n🎯 IMPORTANT USER PREFERENCE - CHART TYPE RESTRICTION:\nThe user has specifically selected these chart types: ${selectedChartTypes.join(", ")}.\n\n✅ YOU MUST ONLY select charts from these types.\n❌ DO NOT select any chart types that are not in this list.\n\nStill maintain quality standards and diversity, but ONLY within these allowed types.`;
    console.log(`   🎨 User selected ${selectedChartTypes.length} chart types: ${selectedChartTypes.join(", ")}`);
  } else {
    console.log("   🎨 No chart type preference - AI will select optimal types");
  }

  const userContent = JSON.stringify({
    message: message,
    dataProfile: request.dataProfile,
    allChartIdeas: allChartIdeas,
    usageContext: request.usageContext,
    columnPreferences: request.columnPreferences,
    chartPreferences: request.chartPreferences,
  }, null, 2);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: CHART_SELECTION_PROMPT,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, // Balanced temperature for comprehensive selection
      max_tokens: 6000, // MUCH more tokens to accommodate 10-12 charts
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from Phase 2");
    }

    const schema = safeJSONParse<DashboardSchema & { selectionReasoning?: string }>(content);

    console.log(`   ✅ Selected ${schema.charts.length} charts from ${allChartIdeas.length} possibilities`);
    console.log(`   📊 Selected types: ${[...new Set(schema.charts.map(c => c.type))].join(", ")}`);
    if (schema.selectionReasoning) {
      console.log(`   💡 Reasoning: ${schema.selectionReasoning}`);
    }

    // Validate schema structure
    if (!schema.layout || !schema.charts || !Array.isArray(schema.charts)) {
      throw new Error("Invalid schema structure received from Phase 2");
    }

    return schema;
  } catch (error) {
    console.error("Error in Phase 2 (select best charts):", error);
    throw error;
  }
}

/**
 * PHASE 3: CRITIC - Eliminate bad charts through self-questioning
 */
async function criticizeAndEliminateCharts(
  schema: DashboardSchema,
  dataProfile: any
): Promise<DashboardSchema> {
  console.log("\n🔍 PHASE 3: CHART QUALITY CRITIC (Self-Questioning & Elimination)");
  console.log("   AI will ask itself critical questions about EACH chart...");

  const userContent = JSON.stringify({
    message: "Evaluate EACH chart by asking yourself critical questions. Eliminate any chart that fails the tests.",
    dataProfile: dataProfile,
    proposedCharts: schema.charts,
  }, null, 2);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: CHART_CRITIC_PROMPT,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Low temperature for strict evaluation
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      console.log("   ⚠️  No content received from critic, keeping all charts");
      return schema;
    }

    const criticResult = safeJSONParse<{
      eliminationResults: Array<{
        chartId: string;
        chartTitle: string;
        keepChart: boolean;
        question1_semantics: {
          hasSemanticError: boolean;
          errorDescription: string | null;
          decision: string;
        };
        question2_businessValue: {
          score: number;
          reasoning: string;
          decision: string;
        };
        question3_readability: {
          score: number;
          reasoning: string;
          decision: string;
        };
        finalDecision: string;
        finalReasoning: string;
      }>;
      summary: {
        totalChartsReviewed: number;
        chartsKept: number;
        chartsEliminated: number;
        eliminationReasons: {
          semanticErrors: number;
          lowBusinessValue: number;
          poorReadability: number;
        };
      };
    }>(content);

    console.log(`\n   📊 CRITIC EVALUATION COMPLETE:`);
    console.log(`      Total charts reviewed: ${criticResult.summary.totalChartsReviewed}`);
    console.log(`      ✅ Charts kept: ${criticResult.summary.chartsKept}`);
    console.log(`      ❌ Charts eliminated: ${criticResult.summary.chartsEliminated}`);
    console.log(`      Elimination reasons:`);
    console.log(`         - Semantic errors: ${criticResult.summary.eliminationReasons.semanticErrors}`);
    console.log(`         - Low business value: ${criticResult.summary.eliminationReasons.lowBusinessValue}`);
    console.log(`         - Poor readability: ${criticResult.summary.eliminationReasons.poorReadability}`);

    // Log details of eliminated charts
    const eliminatedCharts = criticResult.eliminationResults.filter(r => r.finalDecision === "ELIMINATE");
    if (eliminatedCharts.length > 0) {
      console.log(`\n   ❌ ELIMINATED CHARTS:`);
      eliminatedCharts.forEach((chart, idx) => {
        console.log(`      ${idx + 1}. "${chart.chartTitle}"`);
        console.log(`         Reason: ${chart.finalReasoning}`);
        if (chart.question1_semantics.hasSemanticError) {
          console.log(`         ⚠️  SEMANTIC ERROR: ${chart.question1_semantics.errorDescription}`);
        }
      });
    }

    // Filter charts - keep only those marked as KEEP
    const keptChartIds = new Set(
      criticResult.eliminationResults
        .filter(r => r.finalDecision === "KEEP")
        .map(r => r.chartId)
    );

    const filteredCharts = schema.charts.filter(chart => keptChartIds.has(chart.id));

    console.log(`\n   ✅ FINAL CHART COUNT: ${filteredCharts.length} charts`);

    // If too many charts were eliminated (< 6 remaining), warn but proceed
    if (filteredCharts.length < 6) {
      console.log(`   ⚠️  WARNING: Only ${filteredCharts.length} charts remain after elimination`);
      console.log(`   This is fewer than the recommended minimum of 6-8 charts`);
    }

    // Update schema with filtered charts
    return {
      ...schema,
      charts: filteredCharts,
    };

  } catch (error) {
    console.error("   ❌ Error in Phase 3 (critic):", error);
    console.log("   ⚠️  Proceeding with original charts due to critic error");
    return schema;
  }
}

/**
 * Main function: Three-phase dashboard generation
 * Phase 1: Generate ALL possible chart ideas
 * Phase 2: Select the BEST ones
 * Phase 3: CRITIC - Eliminate bad charts through self-questioning
 */
export async function generateDashboardSchema(
  request: GenerateDashboardRequest
): Promise<DashboardSchema> {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 THREE-PHASE COMPREHENSIVE DASHBOARD GENERATION");
  console.log("=".repeat(60));

  try {
    // PHASE 1: Generate ALL chart ideas
    const allChartIdeas = await generateAllChartIdeas(request);

    if (allChartIdeas.length === 0) {
      throw new Error("Phase 1 generated no chart ideas");
    }

    // PHASE 2: Select BEST charts
    const schema = await selectBestCharts(request, allChartIdeas);

    // PHASE 3: CRITIC - Eliminate bad charts through self-questioning
    const finalSchema = await criticizeAndEliminateCharts(schema, request.dataProfile);

    console.log("\n" + "=".repeat(60));
    console.log("✅ THREE-PHASE DASHBOARD GENERATION COMPLETE");
    console.log("=".repeat(60) + "\n");

    return finalSchema;
  } catch (error) {
    console.error("Error in three-phase dashboard generation:", error);
    throw new Error(
      `Failed to generate dashboard schema: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validates if the generated dashboard plan is actually good for the dataset
 * Returns true if the dashboard is excellent, false if it needs regeneration
 */
export async function validateDashboardQuality(
  dataProfile: any,
  dashboardSchema: DashboardSchema
): Promise<{ isGood: boolean; feedback: string }> {
  const validationPrompt = `You are a STRICT DATA VALIDATION EXPERT reviewing a dashboard plan. Your job is to REJECT dashboards that use inappropriate columns or violate data visualization best practices.

**DATASET PROFILE:**
${JSON.stringify(dataProfile, null, 2)}

**PROPOSED DASHBOARD PLAN:**
${JSON.stringify(dashboardSchema, null, 2)}

**YOUR TASK:**
CAREFULLY inspect EVERY chart in the plan. REJECT if you find ANY of these CRITICAL ERRORS:

**🚨 CRITICAL ERRORS (MUST REJECT):**

1. **ID COLUMNS AS DATA** - NEVER graph ID fields
   ❌ REJECT: Any chart using columns named like: *_id, *_ID, id, ID, customer_id, order_id, transaction_id, user_id, product_id, etc.
   ❌ REJECT: Columns with very high cardinality (uniqueCount near rowCount) - these are IDs!
   ✅ GOOD: Only using actual metrics (sales, revenue, quantity) and dimensions (region, category)

2. **TEXT COLUMNS AS METRICS** - NEVER use text/description fields as chart data
   ❌ REJECT: Using columns named: name, description, comment, notes, address, email, phone, etc.
   ❌ REJECT: Columns with type="text" being used as Y-axis
   ✅ GOOD: Text columns should NEVER be in charts

3. **WRONG DATA TYPES** - Each chart type has specific requirements
   ❌ REJECT: Line chart with categorical X-axis (line needs datetime or ordered numeric)
   ❌ REJECT: Bar/column chart with numeric Y that's actually an ID (high cardinality)
   ❌ REJECT: Pie chart with >8 categories (too many slices)
   ❌ REJECT: Scatter plot where X or Y is categorical
   ❌ REJECT: Histogram where Y is categorical
   ✅ GOOD: Line for time series, Bar for categorical comparisons, Scatter for numeric correlations

4. **MEANINGLESS AGGREGATIONS** - Check if aggregation makes sense
   ❌ REJECT: SUM of ID columns
   ❌ REJECT: AVG of categorical data
   ❌ REJECT: COUNT where a real metric exists (use the actual metric!)
   ✅ GOOD: SUM of revenue, AVG of ratings, COUNT of records

5. **NO DIVERSITY** - Dashboard must have variety
   ❌ REJECT: >60% of charts are the same type (e.g., 4 bars out of 6 charts = 67%)
   ❌ REJECT: Only 1-2 chart types total
   ✅ GOOD: At least 3-4 different chart types

6. **MISSING DATA** - Don't use columns with too much missing data
   ❌ REJECT: Using columns with missingRate > 0.5 (50%+ missing)
   ✅ GOOD: Only using columns with good data coverage

**VALIDATION PROCESS:**
For EACH chart, ask yourself:
1. Are the column names logical business metrics/dimensions? (not IDs, not text fields)
2. Does the X column type match the chart type? (categorical for bar, datetime for line, numeric for scatter)
3. Does the Y column type make sense? (must be numeric for most charts)
4. Does the aggregation make business sense?
5. Is the uniqueCount reasonable? (very high uniqueCount = probably an ID)

**SCORING RUBRIC:**
- Start with 10 points
- **-3 points** for EACH chart using ID columns (customer_id, *_id pattern, uniqueCount near rowCount)
- **-3 points** for EACH chart using text columns as data
- **-2 points** for EACH wrong chart type (line for categorical, pie with >8 categories)
- **-2 points** for EACH meaningless aggregation
- **-2 points** if >60% charts are same type
- **-1 point** for EACH column with missingRate > 0.5

**OUTPUT FORMAT (JSON only):**
{
  "isGood": true | false,
  "score": number (1-10),
  "feedback": "DETAILED explanation of what's wrong OR why it's good",
  "rejectionReasons": ["list of specific issues found"] or []
}

**DECISION RULES (VERY STRICT):**
- If score >= 8: set isGood = true (excellent dashboard, proceed)
- If score < 8: set isGood = false (NOT GOOD ENOUGH - must regenerate)

**NO TOLERANCE FOR MEDIOCRITY:**
- A score of 7 is NOT ENOUGH - we demand excellence (8+)
- ANY semantic errors (averaging years/IDs) = automatic REJECT regardless of score
- ANY use of ID or text columns = automatic REJECT regardless of score

Be RUTHLESSLY STRICT about data accuracy. REJECT any dashboard using ID columns, text fields, wrong data types, or semantic errors.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a STRICT data validation expert and dashboard quality checker. Your job is to REJECT any dashboard that uses ID columns, text fields, wrong data types, or violates data visualization best practices. Be thorough and uncompromising about data accuracy.",
        },
        {
          role: "user",
          content: validationPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return { isGood: true, feedback: "No feedback received, proceeding..." };
    }

    const result = safeJSONParse<{
      isGood: boolean;
      score?: number;
      feedback: string;
    }>(content);

    console.log(`\n🔍 AI QUALITY VALIDATION:`);
    console.log(`   Score: ${result.score || 'N/A'}/10`);
    console.log(`   Is Good: ${result.isGood ? '✅ YES' : '❌ NO'}`);
    console.log(`   Feedback: ${result.feedback}`);

    return result;
  } catch (error) {
    console.error("Error validating dashboard quality:", error);
    // If validation fails, assume it's okay to proceed
    return { isGood: true, feedback: "Validation error, proceeding..." };
  }
}
