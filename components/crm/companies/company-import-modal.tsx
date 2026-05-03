"use client";

import { useState } from "react";
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bulkImportCompanies } from "@/lib/crm/actions";
import { toast } from "sonner";

export function CompanyImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsPending] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const processData = async (rawData: any[]) => {
    // Transform data to our expected format
    const companies = rawData.map((row: any) => {
      // Extract multiple emails/phones if they are comma separated or in separate columns
      const emailValue = row["Email"] || row["Email_1"] || row["Company Email"] || "";
      const emails = typeof emailValue === 'string' ? emailValue.split(",").map((s: string) => s.trim()) : [emailValue];
      
      const phoneValue = row["Mobile Number"] || row["Phone"] || row["Company Phone"] || "";
      const phones = typeof phoneValue === 'string' ? phoneValue.split(",").map((s: string) => s.trim()) : [phoneValue];

      const contactName = row["Contact Person"] || row["Contact Name"] || "Primary Contact";
      const contactEmail = row["Contact Email"] || row["Email_2"] || "";
      const contactPhone = row["Contact Number"] || row["Contact Phone"] || "";
      
      return {
        name: row["Company Name"] || row["name"] || row["Company"] || "Unnamed Company",
        email: emails[0] || "",
        phone: phones[0] || "",
        address: row["Address"] || row["Location"] || "",
        rating: parseInt(row["Rating"]) || 5,
        contacts: [
          {
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            is_primary: true,
          }
        ]
      };
    });

    const res = await bulkImportCompanies(companies);
    
    if (res.ok && res.results) {
      setImportResult(res.results);
      toast.success(`Successfully imported ${res.results.success} companies`);
    } else {
      toast.error(res.error || "Failed to import companies");
    }
    
    setIsPending(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPending(true);
    setImportResult(null);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          processData(results.data);
        },
        error: (error: Error) => {
          toast.error("Failed to parse CSV file");
          setIsPending(false);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processData(data);
        } catch (error) {
          toast.error("Failed to parse Excel file");
          setIsPending(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsPending(false);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Please upload a .csv or .xlsx file");
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full bg-white shadow-sm border-slate-200 hover:bg-slate-50 transition-all">
          <FileUp className="mr-2 size-4 text-primary" />
          Import from CSV/Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[28px] border-slate-200/60 shadow-2xl backdrop-blur-xl bg-white/95">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Bulk Import Companies</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Upload a .csv or .xlsx file to automatically add multiple companies and contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!importResult ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[24px] p-10 bg-slate-50/50 transition-all hover:border-primary/30 hover:bg-slate-50">
              {isImporting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-slate-700 tracking-tight">Processing your data...</p>
                </div>
              ) : (
                <>
                  <div className="size-14 rounded-[20px] bg-white shadow-sm flex items-center justify-center mb-4 ring-1 ring-slate-100">
                    <FileSpreadsheet className="size-7 text-primary" />
                  </div>
                  <label className="cursor-pointer group">
                    <span className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group-hover:bg-primary/90">
                      Choose CSV/Excel File
                    </span>
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Columns: Company Name, Email, Mobile Number, Address, <br/> Contact Person, Contact Email, Contact Number
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="size-6 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">{importResult.success} Companies Imported</p>
                  <p className="text-xs text-emerald-700/80 font-medium">Data has been successfully added to your workspace.</p>
                </div>
              </div>
              
              {importResult.failed > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <AlertCircle className="size-6 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-rose-900">{importResult.failed} Entries Failed</p>
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-[11px] text-rose-700/70 font-medium truncate">{err}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/10 mt-2" 
                onClick={() => {
                  setIsOpen(false);
                  setImportResult(null);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
