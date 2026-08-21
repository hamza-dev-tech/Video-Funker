import { Textarea } from "@product/components/ui/textarea";
import { Button } from "@product/components/ui/button";
import { Film, Copy } from "lucide-react";
import { useToast } from "@product/hooks/use-toast";

interface StepScriptProps {
  script: string;
  onChange: (value: string) => void;
}

export function StepScript({ script, onChange }: StepScriptProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast({ title: "Copied", description: "Script copied to clipboard." });
    } catch {
      toast({
        title: "Couldn't copy the script",
        description: "Failed to copy script.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Film className="w-5 h-5 text-primary" /> Video Script
          </h3>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Review and edit the script your avatar will speak.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleCopy}
          disabled={!script.trim()}
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </Button>
      </div>

      <Textarea
        value={script}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Script will be auto-filled from content..."
        className="resize-none min-h-[280px]"
      />

      <div className="flex justify-end text-[12.5px] text-muted-foreground">
        {script.length} characters
      </div>
    </div>
  );
}
