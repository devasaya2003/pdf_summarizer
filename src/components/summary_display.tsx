import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface SummaryDisplayProps {
  summary: any;
  isLoading: boolean;
  isAIMode: boolean;
  filePath: string;
  onSummarize: () => void;
}

export default function SummaryDisplay({ summary, isLoading, isAIMode, filePath, onSummarize }: SummaryDisplayProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 bg-[var(--background)]">
      <Card className="flex-1 flex flex-col bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[var(--card-foreground)]">Summary ({isAIMode ? "AI" : "Local"})</CardTitle>
          {summary && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-[var(--border)] text-[var(--foreground)]">
                  View Full JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[var(--popover)] border-[var(--border)]">
                <DialogHeader>
                  <DialogTitle className="text-[var(--popover-foreground)]">Full Summary JSON</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                  <pre className="text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
                    {JSON.stringify(summary, null, 2)}
                  </pre>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {isLoading ? (
            <p className="text-[var(--muted-foreground)]">Processing PDF...</p>
          ) : summary ? (
            <div className="space-y-4">
              {/* Short Summary */}
              <Card className="bg-[var(--secondary)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-[var(--secondary-foreground)]">Short Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--secondary-foreground)]">{summary.short_summary}</p>
                </CardContent>
              </Card>

              {/* Derived Values */}
              <Card className="bg-[var(--accent)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-[var(--accent-foreground)]">Derived Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong className="text-[var(--accent-foreground)]">Relevance to Officials:</strong>
                    <ul className="list-disc list-inside text-[var(--accent-foreground)] mt-1">
                      {summary.relevance_to_officials.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[var(--accent-foreground)]">Action Items:</strong>
                    <ul className="list-disc list-inside text-[var(--accent-foreground)] mt-1">
                      {summary.action_items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-[var(--accent-foreground)]">Confidence Estimate:</strong>
                    <span className="text-[var(--accent-foreground)] ml-2">{summary.confidence_estimate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-[var(--muted-foreground)]">
              Click "Summarize" to view structured output.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button onClick={onSummarize} disabled={isLoading || !filePath} className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/80">
        {isLoading ? "Summarizing..." : "Summarize"}
      </Button>
    </div>
  );
}