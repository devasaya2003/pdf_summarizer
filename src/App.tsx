import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";  // Add this import
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

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
    <div className="flex h-screen">
      {/* Left Pane: PDF Upload */}
      <div className="w-1/4 border-r p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>PDF Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFileSelect}>Select PDF</Button>
            <div className="mt-4 flex items-center space-x-2">
              <label htmlFor="ai-mode">AI Mode</label>
              <Switch
                id="ai-mode"
                checked={isAIMode}
                onCheckedChange={setIsAIMode}
                disabled={!filePath}  // Disable if no file selected
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {filePath ? (isAIMode ? "AI Summarization" : "Local Summarization") : "Select a PDF to enable modes"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Center Pane: Chat & Summary */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Summary ({isAIMode ? "AI" : "Local"})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoading ? (
              <p className="text-muted-foreground">Processing PDF...</p>
            ) : summary ? (
              <pre className="bg-muted p-2 rounded text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(summary, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">
                Click "Summarize" to view structured output.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button onClick={handleSummarize} disabled={isLoading || !filePath}>
          {isLoading ? "Summarizing..." : "Summarize"}
        </Button>
      </div>

      {/* Right Pane: Raw Text (Collapsible) */}
      <div className="w-1/4 border-l p-4">
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-2">
              Toggle Raw Text
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-[80vh] w-full rounded border p-2">
              <pre className="text-xs whitespace-pre-wrap">{rawText}</pre>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
