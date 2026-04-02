// ─── Mess / Food Daily Rating — Owner Panel ──────────────────────────────────
// Drop this file at:  src/components/OwnerMessDashboard.tsx
//
// Usage inside your owner dashboard (mess/food tab):
//
//   import OwnerMessDashboard from "@/components/OwnerMessDashboard";
//   ...
//   <OwnerMessDashboard ownerHostelIds={["b1", "b2"]} />

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Utensils } from "lucide-react";
import {
  type MessRating,
  type MealType,
  MEAL_EMOJI,
  REACTION_EMOJIS,
  getMessRatingsForHostel,
  getLast7DaysScores,
  getTodayString,
} from "@/data/messRatings";

interface OwnerMessDashboardProps {
  ownerHostelIds: string[];
  /** Pass the hostel name map so we can show names not just IDs */
  hostelNames?: Record<string, string>;
}

const MEALS: MealType[] = ["Breakfast", "Lunch", "Dinner"];

const TrendIcon = ({ delta }: { delta: number }) => {
  if (delta > 0.2)
    return <TrendingUp className="h-4 w-4 text-success" />;
  if (delta < -0.2)
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const OwnerMessDashboard = ({
  ownerHostelIds,
  hostelNames = {},
}: OwnerMessDashboardProps) => {
  const [selectedHostel, setSelectedHostel] = useState(ownerHostelIds[0] ?? "");
  const [selectedMealFilter, setSelectedMealFilter] = useState<MealType | "All">("All");

  const ratings = useMemo(
    () => getMessRatingsForHostel(selectedHostel),
    [selectedHostel]
  );

  const trend = useMemo(
    () => getLast7DaysScores(selectedHostel),
    [selectedHostel]
  );

  const today = getTodayString();
  const todayRatings = ratings.filter((r) => r.date === today);

  // overall avg
  const overallAvg = useMemo(() => {
    if (!ratings.length) return 0;
    return (
      Math.round(
        (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) * 10
      ) / 10
    );
  }, [ratings]);

  // today avg
  const todayAvg = useMemo(() => {
    if (!todayRatings.length) return 0;
    return (
      Math.round(
        (todayRatings.reduce((a, r) => a + r.rating, 0) /
          todayRatings.length) *
          10
      ) / 10
    );
  }, [todayRatings]);

  // week delta (today vs 7 days ago)
  const weekDelta = useMemo(() => {
    const withData = trend.filter((d) => d.avgRating > 0);
    if (withData.length < 2) return 0;
    return (
      Math.round(
        (withData[withData.length - 1].avgRating - withData[0].avgRating) * 10
      ) / 10
    );
  }, [trend]);

  // per-meal breakdown
  const mealBreakdown = useMemo(() => {
    return MEALS.map((meal) => {
      const mealRatings = ratings.filter((r) => r.meal === meal);
      const avg = mealRatings.length
        ? Math.round(
            (mealRatings.reduce((a, r) => a + r.rating, 0) /
              mealRatings.length) *
              10
          ) / 10
        : 0;
      return { meal, avg, count: mealRatings.length };
    });
  }, [ratings]);

  // emoji reaction breakdown
  const emojiCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ratings.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    });
    return counts;
  }, [ratings]);

  // filtered recent list
  const filtered = useMemo(() => {
    const base =
      selectedMealFilter === "All"
        ? ratings
        : ratings.filter((r) => r.meal === selectedMealFilter);
    return base.slice(0, 20); // latest 20
  }, [ratings, selectedMealFilter]);

  const trendMax = Math.max(...trend.map((d) => d.avgRating), 5);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
    });

  if (!ownerHostelIds.length) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center shadow-card">
        <p className="text-sm text-muted-foreground">No hostels found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─ Hostel selector (if owner has multiple) ─ */}
      {ownerHostelIds.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {ownerHostelIds.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedHostel(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                selectedHostel === id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-foreground border-border hover:border-primary/40"
              }`}
            >
              {hostelNames[id] ?? id}
            </button>
          ))}
        </div>
      )}

      {/* ─ Top Stats ─ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-center">
          <p className="text-xl font-bold text-primary">
            {overallAvg > 0 ? `⭐ ${overallAvg}` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">All-time Avg</p>
        </div>
        <div className="rounded-2xl bg-secondary p-3 text-center">
          <p className="text-xl font-bold text-foreground">
            {todayAvg > 0 ? `⭐ ${todayAvg}` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Today</p>
        </div>
        <div
          className={`rounded-2xl p-3 text-center ${
            weekDelta > 0
              ? "bg-success/10"
              : weekDelta < 0
                ? "bg-destructive/10"
                : "bg-secondary"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <TrendIcon delta={weekDelta} />
            <p
              className={`text-xl font-bold ${
                weekDelta > 0
                  ? "text-success"
                  : weekDelta < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {weekDelta > 0 ? `+${weekDelta}` : weekDelta || "—"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">7-day trend</p>
        </div>
      </div>

      {/* ─ Per-Meal Breakdown ─ */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Rating by Meal
        </h4>
        <div className="space-y-2.5">
          {mealBreakdown.map(({ meal, avg, count }) => (
            <div key={meal} className="flex items-center gap-3">
              <span className="text-xl w-7">{MEAL_EMOJI[meal]}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{meal}</span>
                  <span className="text-muted-foreground">
                    {avg > 0 ? `⭐ ${avg}` : "No ratings"}{" "}
                    {count > 0 && `(${count})`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${avg > 0 ? (avg / 5) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─ Emoji Reactions ─ */}
      {Object.keys(emojiCounts).length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h4 className="text-sm font-bold text-foreground mb-3">
            Student Reactions
          </h4>
          <div className="flex gap-3">
            {REACTION_EMOJIS.map((emoji) => (
              <div key={emoji} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-semibold text-foreground">
                  {emojiCounts[emoji] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─ 7-Day Bar Chart ─ */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h4 className="text-sm font-bold text-foreground mb-3">
          7-Day Food Score
        </h4>
        {trend.every((d) => d.avgRating === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No ratings in the last 7 days yet.
          </p>
        ) : (
          <div className="flex items-end gap-1.5 h-20">
            {trend.map((day) => {
              const heightPct =
                day.avgRating > 0
                  ? Math.round((day.avgRating / trendMax) * 100)
                  : 4;
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  {day.avgRating > 0 && (
                    <span className="text-[9px] font-semibold text-muted-foreground">
                      {day.avgRating}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-md ${
                      isToday ? "bg-primary" : "bg-primary/30"
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${day.totalVotes} vote(s)`}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {formatDate(day.date).split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─ Recent Ratings Feed ─ */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-foreground">Recent Ratings</h4>
          {/* Meal filter pills */}
          <div className="flex gap-1.5">
            {(["All", ...MEALS] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMealFilter(m)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-all ${
                  selectedMealFilter === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-foreground border-border"
                }`}
              >
                {m === "All" ? "All" : MEAL_EMOJI[m]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No ratings yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-xl bg-secondary/40 px-3.5 py-2.5"
              >
                <span className="text-lg mt-0.5">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {r.studentName}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {MEAL_EMOJI[r.meal]} {r.meal}
                      </span>
                      <span className="text-[10px] font-bold text-warning ml-1">
                        ⭐ {r.rating}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      "{r.comment}"
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerMessDashboard;