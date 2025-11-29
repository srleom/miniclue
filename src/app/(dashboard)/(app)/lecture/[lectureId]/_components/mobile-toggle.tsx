import { Button } from "@/components/ui/button";
import { FileText, BookOpen } from "lucide-react";

type MobileToggleProps = {
  mobileView: "pdf" | "explanation";
  onViewChange: (view: "pdf" | "explanation") => void;
};

export function MobileToggle({ mobileView, onViewChange }: MobileToggleProps) {
  return (
    <div className="flex w-full justify-center gap-2 p-4 pt-0">
      <Button
        variant={mobileView === "pdf" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("pdf")}
        className="flex items-center gap-2"
        type="button"
      >
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button
        variant={mobileView === "explanation" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("explanation")}
        className="flex items-center gap-2"
        type="button"
      >
        <BookOpen className="h-4 w-4" />
        Explanation
      </Button>
    </div>
  );
}
