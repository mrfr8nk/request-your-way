import { FileDown, FileText, Printer, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportData, type ExportFormat } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

interface ExportDropdownProps {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  subtitle?: string;
  disabled?: boolean;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "lg";
}

const ExportDropdown = ({
  title,
  filename,
  headers,
  rows,
  subtitle,
  disabled = false,
  variant = "outline",
  size = "sm",
}: ExportDropdownProps) => {
  const { toast } = useToast();

  const handleExport = (format: ExportFormat) => {
    const count = exportData(format, { title, filename, headers, rows, subtitle });
    if (format !== "print") {
      toast({
        title: "Exported",
        description: `${count} records exported as ${format.toUpperCase()}.`,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled}>
          <FileDown className="w-4 h-4 mr-1" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          <span>CSV (Excel)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 cursor-pointer">
          <File className="w-4 h-4 text-red-600" />
          <span>PDF Document</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("word")} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Word Document</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("print")} className="gap-2 cursor-pointer">
          <Printer className="w-4 h-4 text-muted-foreground" />
          <span>Print</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
