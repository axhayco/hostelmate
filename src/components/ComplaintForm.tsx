// ─── Complaint & Maintenance Tracker — Student Form ─────────────────────────
// Drop this file at:  src/components/ComplaintForm.tsx
//
// Usage inside HostelDetail.tsx — just below the Community Chat button:
//
//   import ComplaintForm from "@/components/ComplaintForm";
//   ...
//   <ComplaintForm hostelId={hostel.id} hostelName={hostel.name} />

import { useState } from "react";
import { Send, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  type ComplaintCategory,
  type Complaint,
  COMPLAINT_CATEGORIES,
  CATEGORY_EMOJI,
  loadComplaints,
  saveComplaints,
} from "@/data/complaints";
import { complaintSchema, validateField, sanitizeText } from "@/lib/validation";
import { formSubmitLimiter } from "@/lib/rateLimiter";

interface ComplaintFormProps {
  hostelId: string;
  hostelName: string;
}

const ComplaintForm = ({ hostelId, hostelName }: ComplaintFormProps) => {
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    studentName.trim().length > 0 &&
    category !== "" &&
    description.trim().length > 10;

  const handleSubmit = () => {
    if (!canSubmit) return;

    // Rate Limiting
    const limit = formSubmitLimiter.tryConsume("complaint_submit");
    if (!limit.allowed) {
      alert(`Too many requests. Please try again in Math.ceil(limit.retryAfterMs / 1000)s.`);
      return;
    }

    // Validation & Sanitization
    const sanitizedName = sanitizeText(studentName);
    const sanitizedDesc = sanitizeText(description);

    const validation = validateField(complaintSchema, {
      studentName: sanitizedName,
      category: category as unknown, // Zod handles the true validation
      description: sanitizedDesc,
    });

    if ("success" in validation && "data" in validation && validation.success) {
      const validData = validation.data;
      setLoading(true);

      const newComplaint: Complaint = {
        id: `c-${Date.now()}`,
        hostelId,
        hostelName,
        studentName: validData.studentName || "",
        category: validData.category as ComplaintCategory,
        description: validData.description || "",
        status: "Open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existing = loadComplaints();
      saveComplaints([newComplaint, ...existing]);

      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setStudentName("");
          setCategory("");
          setDescription("");
          setOpen(false);
        }, 3000);
      }, 1000);
    } else if ("error" in validation) {
      alert(validation.error as string);
      return;
    }
  };

  return (
    <div className="rounded-2xl bg-card shadow-card mb-4 overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-base font-bold text-foreground">
            Report an Issue
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Form body */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-base font-bold text-foreground">
                Complaint Submitted!
              </p>
              <p className="text-sm text-muted-foreground">
                The hostel owner has been notified. You'll be updated when the
                status changes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Issue Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all text-left ${category === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-foreground hover:border-primary/40"
                        }`}
                    >
                      <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                      <span className="leading-tight">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Describe the Issue
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Give as much detail as possible — room number, since when, etc."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {description.length} / 500
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="animate-pulse">Submitting…</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintForm;