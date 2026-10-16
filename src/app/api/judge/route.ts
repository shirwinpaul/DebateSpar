import { judgeRequestSchema } from "@/lib/schemas";
import { runJudge } from "@/lib/ai/service";
import { handleAIRoute } from "@/lib/ai/route";

// Vercel Hobby allows up to 60s (AI_ROUTE_MAX_DURATION in src/config/ai.ts). Must be a literal here.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleAIRoute(req, judgeRequestSchema, (data, deps) => runJudge(data, deps));
}
