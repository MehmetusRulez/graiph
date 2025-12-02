// src/lib/callDashboardAgent.ts
import type {
  ResponseOutputMessage,
  ResponseOutputText,
} from "openai/resources/responses/responses";
import { openai } from "./openai";
import { DASHBOARD_AGENT_PROMPT } from "./dashboardAgentPrompt";
import {
  GenerateDashboardRequest,
  DashboardSchema,
} from "@/types/dashboard";

export async function callDashboardAgent(
  req: GenerateDashboardRequest
): Promise<DashboardSchema> {
  // İstek objesini JSON string yap
  const input = JSON.stringify(req);

  const response = await openai.responses.create({
    model: "gpt-5.1-thinking", // veya elindeki reasoning modeli
    instructions: DASHBOARD_AGENT_PROMPT,
    input,
  });

  const messageOutput = response.output.find(
    (item): item is ResponseOutputMessage => item.type === "message"
  );

  const text =
    messageOutput
      ?.content.filter(
        (chunk): chunk is ResponseOutputText => chunk.type === "output_text"
      )
      .map((chunk) => chunk.text)
      .join("\n") ?? "";

  // Model sadece JSON döndürdüğü için direkt parse edebiliriz
  const schema = JSON.parse(text) as DashboardSchema;

  return schema;
}
