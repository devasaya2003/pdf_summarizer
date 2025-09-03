import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import PdfUpload from "@/components/pdf_upload";
import SummaryDisplay from "@/components/summary_display";
import RawTextPane from "@/components/raw_text_pane";

export default function App() {
  const [rawText, setRawText] = useState("(Raw PDF text appears here)");
  const [summary, setSummary] = useState<any>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);  // Switch state: false = Local, true = AI

  const handleFileSelect = async () => {
    const selected = await open({
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (selected && typeof selected === "string") {
      setFilePath(selected);
      setRawText(`Loaded file: ${selected}\n\n[PDF extraction pending]`);
    }
  };

  const handleSummarize = async () => {
    if (!filePath) {
      alert("Please select a PDF file first.");
      return;
    }
    setIsLoading(true);
    try {
      const command = isAIMode ? "summarize_ai" : "summarize_local";
      const result = await invoke(command, { filePath }) as { raw_text?: string };
      setSummary(result);
      setRawText(result.raw_text || "(No text extracted)");
    } catch (error) {
      console.error("Error summarizing:", error);
      setSummary({ error: error as string });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}
