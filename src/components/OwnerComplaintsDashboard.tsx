// ─── Complaint & Maintenance Tracker — Owner Dashboard Panel ─────────────────
// Drop this file at:  src/components/OwnerComplaintsDashboard.tsx
//
// Usage inside your owner dashboard (replace the complaints tab content):
//
//   import OwnerComplaintsDashboard from "@/components/OwnerComplaintsDashboard";
//   ...
//   <OwnerComplaintsDashboard ownerHostelIds={["b1", "b2"]} />

import { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from "lucide-react";
import {
  type Complaint,
  type ComplaintStatus,
  CATEGORY_EMOJI,
  STATUS_COLOR,
  getComplaintsForOwner,
  updateComplaintStatus,
  loadComplaints,
} from "@/data/complaints";

interface OwnerComplaintsDashboardProps {
  ownerHostelIds: string[];
}

const STATUS_OPTIONS: ComplaintStatus[] = ["Open", "In Progress", "Resolved"];

const STATUS_ICON: Record<ComplaintStatus, React.ReactNode> = {
  "Open":        <AlertCircle className="h-4 w-4 text-destructive" />,
  "In Progress": <Clock className="h-4 w-4 text-warning" />,
  "Resolved":    <CheckCircle2 className="h-4 w-4 text-success" />,
};

const OwnerComplaintsDashboard = ({
  ownerHostelIds,
}: OwnerComplaintsDashboardProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // Load and refresh from localStorage whenever component mounts or
  // after any status update
  const refresh = () => {
    setComplaints(getComplaintsForOwner(ownerHostelIds));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerHostelIds.join(",")]);

  const filtered = useMemo(
    () =>
      filterStatus === "All"
        ? complaints
        : complaints.filter((c) => c.status === filterStatus),
    [complaints, filterStatus]
  );

  // Stats
  const stats = useMemo(() => {
    const open = complaints.filter((c) => c.status === "Open").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    return { open, inProgress, resolved, total: complaints.length };
  }, [complaints]);

  const handleStatusChange = (id: string, status: ComplaintStatus) => {
    const note = noteInputs[id] ?? "";
    updateComplaintStatus(id, status, note || undefined);
    refresh();
    // collapse after resolving
    if (status === "Resolved") setExpandedId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* ─ Stats Row ─ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open", count: stats.open, cls: "text-destructive", bg: "bg-destructive/10" },
          { label: "In Progress", count: stats.inProgress, cls: "text-warning", bg: "bg-warning/10" },
          { label: "Resolved", count: stats.resolved, cls: "text-success", bg: "bg-success/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl ${s.bg} p-3 text-center`}>
            <p className={`text-xl font-bold ${s.cls}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─ Filter Pills ─ */}
      <div className="flex gap-2 flex-wrap">
        {(["All", ...STATUS_OPTIONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${
              filterStatus === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:border-primary/40"
            }`}
          >
            {s} {s !== "All" && `(${complaints.filter((c) => c.status === s).length})`}
          </button>
        ))}
      </div>

      {/* ─ Complaints List ─ */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <BarChart2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {stats.total === 0
              ? "No complaints yet — great news!"
              : `No ${filterStatus.toLowerCase()} complaints.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-2xl bg-card shadow-card overflow-hidden"
              >
                {/* Card Header — always visible */}
                <button
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl mt-0.5 flex-shrink-0">
                      {CATEGORY_EMOJI[c.category]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {c.category}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.hostelName} · {c.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(c.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[c.status]}`}
                    >
                      {STATUS_ICON[c.status]}
                      {c.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                    {/* Description */}
                    <div className="rounded-xl bg-secondary/50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Student's Description
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    {/* Existing owner note */}
                    {c.ownerNote && (
                      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                          Your Previous Note
                        </p>
                        <p className="text-sm text-foreground">{c.ownerNote}</p>
                      </div>
                    )}

                    {/* Owner note input */}
                    {c.status !== "Resolved" && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Add a Note (optional)
                        </label>
                        <textarea
                          value={noteInputs[c.id] ?? ""}
                          onChange={(e) =>
                            setNoteInputs((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. Plumber scheduled for tomorrow 10 AM…"
                          rows={2}
                          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                        />
                      </div>
                    )}

                    {/* Status buttons */}
                    {c.status !== "Resolved" && (
                      <div className="flex gap-2">
                        {c.status === "Open" && (
                          <button
                            onClick={() => handleStatusChange(c.id, "In Progress")}
                            className="flex-1 rounded-xl border border-warning/40 bg-warning/10 py-2.5 text-sm font-bold text-warning transition-all hover:bg-warning/20 active:scale-[0.98]"
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(c.id, "Resolved")}
                          className="flex-1 rounded-xl border border-success/40 bg-success/10 py-2.5 text-sm font-bold text-success transition-all hover:bg-success/20 active:scale-[0.98]"
                        >
                          Mark Resolved ✓
                        </button>
                      </div>
                    )}

                    {c.status === "Resolved" && (
                      <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        <p className="text-sm font-semibold text-success">
                          Resolved on {formatDate(c.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerComplaintsDashboard;