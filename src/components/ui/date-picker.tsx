import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const QUICK_ACTIONS = ["Hoje", "Ontem", "Esta semana", "Este mês", "Mês passado"];

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  invalid?: boolean;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string) {
  const date = parseInputDate(value);
  if (!date) return "Selecionar data";
  return date.toLocaleDateString("pt-BR");
}

function buildMonthDays(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function DatePicker({ id, value, onChange, ariaLabel = "Data", invalid }: DatePickerProps) {
  const selectedDate = parseInputDate(value);
  const todayValue = toInputDate(new Date());
  const [open, setOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(() => selectedDate ?? new Date());
  const wrapRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useEffect(() => {
    const nextSelectedDate = parseInputDate(value);
    if (nextSelectedDate) setMonthDate(nextSelectedDate);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function moveMonth(delta: number) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectDate(date: Date) {
    onChange(toInputDate(date));
    setOpen(false);
  }

  function applyQuickAction(action: string) {
    const now = new Date();
    if (action === "Ontem") now.setDate(now.getDate() - 1);
    if (action === "Mês passado") now.setMonth(now.getMonth() - 1);
    selectDate(now);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        value={formatDisplayDate(value)}
        readOnly
        inputMode="none"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        className={cn(
          "box-border flex min-h-[var(--field-height)] w-full min-w-0 rounded-[var(--radius-field)] border border-[var(--color-border-field)] bg-[var(--color-bg-field)] px-4 pr-10 text-base font-semibold leading-none text-foreground shadow-[var(--shadow-xs)] transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out hover:border-primary/45 focus-visible:border-[var(--color-border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm",
          invalid && "border-danger ring-2 ring-danger/20",
        )}
      />
      <button
        type="button"
        aria-label={`Abrir calendario: ${formatDisplayDate(value)}`}
        onClick={() => setOpen((current) => !current)}
        className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div role="dialog" aria-label="Selecionar data" className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-[min(28rem,calc(100dvh-2rem))] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto animate-in fade-in-0 zoom-in-95 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-elevated">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => applyQuickAction(action)}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold leading-none text-muted-foreground transition hover:border-primary/45 hover:text-foreground"
              >
                {action}
              </button>
            ))}
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" className="size-8" aria-label="Mês anterior" onClick={() => moveMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <strong className="text-sm font-bold capitalize text-foreground">{monthLabel}</strong>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Próximo mês" onClick={() => moveMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
            {WEEKDAYS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((date) => {
              const dayValue = toInputDate(date);
              const isSelected = dayValue === value;
              const isToday = dayValue === todayValue;
              const isOutside = date.getMonth() !== monthDate.getMonth();
              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={cn(
                    "relative inline-flex h-9 items-center justify-center rounded-lg text-xs font-semibold leading-none transition hover:bg-primary-soft hover:text-primary",
                    isOutside && "text-muted-foreground/55",
                    isToday && "ring-1 ring-primary/35",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
