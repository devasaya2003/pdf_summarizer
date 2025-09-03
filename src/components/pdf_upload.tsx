import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface PdfUploadProps {
  filePath: string;
  isAIMode: boolean;
  onFileSelect: () => void;
  onModeChange: (checked: boolean) => void;
}

export default function PdfUpload({ filePath, isAIMode, onFileSelect, onModeChange }: PdfUploadProps) {
  return (
    <div className="w-1/4 border-r border-[var(--border)] p-4 space-y-4 bg-[var(--card)]">
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-[var(--card-foreground)]">PDF Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onFileSelect} className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/80">
            Select PDF
          </Button>
          <div className="mt-4 flex items-center space-x-2">
            <label htmlFor="ai-mode" className="text-[var(--foreground)]">AI Mode</label>
            <Switch
              id="ai-mode"
              checked={isAIMode}
              onCheckedChange={onModeChange}
              disabled={!filePath}
            />
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            {filePath ? (isAIMode ? "AI Summarization" : "Local Summarization") : "Select a PDF to enable modes"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}