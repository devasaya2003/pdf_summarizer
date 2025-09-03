import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast, Toaster } from "sonner";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import PdfUpload from "@/components/pdf_upload";
import SummaryDisplay from "@/components/summary_display";
import RawTextPane from "@/components/raw_text_pane";

export default function App() {
  const [rawText, setRawText] = useState("(Raw PDF text appears here)");
  const [summary, setSummary] = useState<any>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);

  const handleFileSelect = async () => {
    const selected = await open({
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (selected && typeof selected === "string") {
      setFilePath(selected);
      setRawText(`Loaded file: ${selected}\n\n[PDF extraction pending]`);
      toast.success("PDF selected successfully!");
    }
  };

  // Small helpers to make JSON parsing more reliable
  const sanitizeJsonCandidate = (s: string) => {
    // strip code fences and whitespace
    let t = s.trim();
    t = t.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    return t;
  };

  const safeParseJSON = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  const structureWithAI = async (rawTextFromLLM: string, pdfRawText: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is missing in .env");
    }
    const google = createGoogleGenerativeAI({ apiKey });

    // Attempt 1: primary prompt
    const primaryPrompt = `Return ONLY valid JSON with these exact keys:
- short_summary
- relevance_to_officials
- action_items
- confidence_estimate

Rules:
- Output JSON only. No prose, no markdown.
- Arrays must be arrays of strings.
- If a value is unknown, use an empty array or "unknown".
- Keep it concise.

Transform this raw response into that JSON:
${rawTextFromLLM}`;

    const { text: firstText } = await generateText({
      model: google("models/gemini-2.0-flash"),
      prompt: primaryPrompt,
    });

    let candidate = sanitizeJsonCandidate(firstText);
    let parsed = safeParseJSON(candidate);
    if (parsed) return { ...parsed, raw_text: pdfRawText };

    // Attempt 2: stricter prompt
    toast.message("Retrying JSON structuring with a stricter prompt…", { id: "summarize" });
    const strictPrompt = `You must output ONLY valid JSON with these exact keys:
- short_summary (string)
- relevance_to_officials (string[])
- action_items (string[])
- confidence_estimate (string: "high" | "medium" | "low" | "unknown")

No markdown, no explanations. If you are unsure, use empty arrays and "unknown".
Input to structure:
${rawTextFromLLM}`;

    const { text: secondText } = await generateText({
      model: google("models/gemini-2.0-flash"),
      prompt: strictPrompt,
    });

    candidate = sanitizeJsonCandidate(secondText);
    parsed = safeParseJSON(candidate);
    if (parsed) return { ...parsed, raw_text: pdfRawText };

    // If still not JSON, fall back to raw
    throw new Error("AI returned non-JSON twice. Showing raw output.");
  };

  const handleSummarize = async () => {
    if (!filePath) {
      toast.error("Please select a PDF file first.");
      return;
    }
    setIsLoading(true);
    toast.loading("Fetching raw response from backend…", { id: "summarize" });

    try {
      const command = isAIMode ? "summarize_ai" : "summarize_local";
      const result = (await invoke(command, { filePath })) as any;
      setRawText(result?.raw_text || "(No text extracted)");
      toast.success("Raw response received!", { id: "summarize" });

      if (isAIMode) {
        toast.loading("Structuring response with AI…", { id: "summarize" });
        try {
          const structured = await structureWithAI(result?.short_summary || "", result?.raw_text || "");
          setSummary(structured);
          toast.success("AI summarization completed!", { id: "summarize" });
        } catch (e: any) {
          toast.error(e?.message || "Failed to structure with AI. Showing raw output.", { id: "summarize" });
          setSummary({
            short_summary: result?.short_summary || "",
            relevance_to_officials: [],
            action_items: [],
            confidence_estimate: "unknown",
            raw_text: result?.raw_text || "",
          });
        }
      } else {
        setSummary(result);
        toast.success("Local summarization completed!", { id: "summarize" });
      }
    } catch (error: any) {
      console.error("Error summarizing:", error);
      setSummary({ error: String(error) });
      toast.error(`Summarization failed: ${String(error)}`, { id: "summarize" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
        <PdfUpload
          filePath={filePath}
          isAIMode={isAIMode}
          onFileSelect={handleFileSelect}
          onModeChange={setIsAIMode}
        />
        <SummaryDisplay
          summary={summary}
          isLoading={isLoading}
          isAIMode={isAIMode}
          filePath={filePath}
          onSummarize={handleSummarize}
        />
        <RawTextPane rawText={rawText} />
      </div>
    </>
  );
}
