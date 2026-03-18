"use client";

import { useMemo, useState } from "react";

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  label: string;
  type: "milestone" | "meeting" | "deadline";
}

const TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  milestone: "#22c55e",
  meeting: "#3b82f6",
  deadline: "#ef4444",
};

const DEMO_EVENTS: CalendarEvent[] = [
  { date: "2026-03-20", label: "Supervisor meeting", type: "meeting" },
  { date: "2026-03-25", label: "Literature review due", type: "deadline" },
  { date: "2026-04-01", label: "Methodology draft", type: "milestone" },
  { date: "2026-04-10", label: "Data collection start", type: "milestone" },
  { date: "2026-04-15", label: "Supervisor meeting", type: "meeting" },
  { date: "2026-04-30", label: "Mid-point check-in", type: "deadline" },
  { date: "2026-05-15", label: "Analysis complete", type: "milestone" },
  { date: "2026-05-20", label: "Supervisor meeting", type: "meeting" },
  { date: "2026-06-01", label: "First draft deadline", type: "deadline" },
  { date: "2026-06-15", label: "Final submission", type: "deadline" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthLabel = new Date(year, month).toLocaleDateString("en-CH", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(() => {
    const total = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);

    return cells;
  }, [year, month]);

  function eventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return DEMO_EVENTS.filter((e) => e.date === dateStr);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-md px-2 py-1 text-sm hover:bg-accent transition">&larr;</button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button onClick={nextMonth} className="rounded-md px-2 py-1 text-sm hover:bg-accent transition">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-background p-1 min-h-[60px]" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const events = eventsForDay(day);
          const isToday = dateStr === todayStr;

          return (
            <div key={day} className="bg-background p-1 min-h-[60px]">
              <div
                className={`text-xs mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
              {events.map((ev, j) => (
                <div
                  key={j}
                  className="text-[10px] leading-tight rounded px-1 py-0.5 mb-0.5 truncate text-white"
                  style={{ background: TYPE_COLORS[ev.type] }}
                  title={ev.label}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
