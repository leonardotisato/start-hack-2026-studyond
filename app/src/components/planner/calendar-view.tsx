"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { WorkspaceEvent } from "./workspace-view";

type EventType = WorkspaceEvent["type"];

const TYPE_COLORS: Record<EventType, string> = {
  milestone: "#22c55e",
  meeting: "#3b82f6",
  deadline: "#ef4444",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface CalendarViewProps {
  events: WorkspaceEvent[];
  onEventsChange: React.Dispatch<React.SetStateAction<WorkspaceEvent[]>>;
}

export function CalendarView({ events, onEventsChange }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Dialog state for adding events
  const [addDialogDate, setAddDialogDate] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<EventType>("meeting");

  // Dialog state for event detail
  const [selectedEvent, setSelectedEvent] = useState<WorkspaceEvent | null>(null);

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

  function eventsForDay(day: number): WorkspaceEvent[] {
    const dateStr = formatDateStr(year, month, day);
    return events.filter((e) => e.date === dateStr);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function handleDayClick(day: number) {
    const dateStr = formatDateStr(year, month, day);
    setAddDialogDate(dateStr);
    setNewLabel("");
    setNewType("meeting");
  }

  function handleAddEvent() {
    if (!addDialogDate || !newLabel.trim()) return;
    const ev: WorkspaceEvent = {
      id: `ev-${Date.now()}`,
      date: addDialogDate,
      label: newLabel.trim(),
      type: newType,
    };
    onEventsChange((prev) => [...prev, ev]);
    setAddDialogDate(null);
  }

  function handleDeleteEvent(id: string) {
    onEventsChange((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-md px-2 py-1 text-sm hover:bg-accent transition">&larr;</button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button onClick={nextMonth} className="rounded-md px-2 py-1 text-sm hover:bg-accent transition">&rarr;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-background p-1 min-h-[70px]" />;
          }

          const dateStr = formatDateStr(year, month, day);
          const dayEvents = eventsForDay(day);
          const isToday = dateStr === todayStr;

          return (
            <div
              key={day}
              className="bg-background p-1 min-h-[70px] cursor-pointer hover:bg-accent/30 transition"
              onClick={() => handleDayClick(day)}
            >
              <div
                className={`text-xs mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="text-[10px] leading-tight rounded px-1 py-0.5 mb-0.5 truncate text-white cursor-pointer hover:opacity-80"
                  style={{ background: TYPE_COLORS[ev.type] }}
                  title={ev.label}
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
        <span className="ml-auto">Click a day to add an event</span>
      </div>

      {/* Add event dialog */}
      <Dialog open={!!addDialogDate} onOpenChange={(open) => { if (!open) setAddDialogDate(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Event &mdash; {addDialogDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
              placeholder="Event label..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as EventType)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="meeting">Meeting</option>
              <option value="milestone">Milestone</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleAddEvent} disabled={!newLabel.trim()}>
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: TYPE_COLORS[selectedEvent?.type ?? "meeting"] }} />
              <span className="capitalize">{selectedEvent?.type}</span>
            </div>
            <p className="text-muted-foreground">Date: {selectedEvent?.date}</p>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
