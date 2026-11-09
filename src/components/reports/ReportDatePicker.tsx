import { useState } from 'react';
import { format } from 'date-fns';
import { enUS, id, ms, type Locale } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const DATE_LOCALES: Record<string, Locale> = { id, en: enUS, ms };
const MONTHS = Array.from({ length: 12 }, (_, month) => month);
const YEAR_NAVIGATION_LABELS = {
  id: { previous: 'Tahun sebelumnya', next: 'Tahun berikutnya' },
  en: { previous: 'Previous year', next: 'Next year' },
  ms: { previous: 'Tahun sebelumnya', next: 'Tahun seterusnya' },
};

interface ReportDatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  mode?: 'date' | 'month';
  min?: string;
  max?: string;
  className?: string;
}

export default function ReportDatePicker({
  id,
  value,
  onChange,
  mode = 'date',
  min,
  max,
  className,
}: ReportDatePickerProps) {
  const { i18n } = useTranslation('reports');
  const language = i18n.language.split('-')[0];
  const locale = DATE_LOCALES[language] ?? DATE_LOCALES.id;
  const yearNavigationLabels = YEAR_NAVIGATION_LABELS[language as keyof typeof YEAR_NAVIGATION_LABELS]
    ?? YEAR_NAVIGATION_LABELS.id;
  const [open, setOpen] = useState(false);
  const selectedDate = mode === 'month'
    ? new Date(`${value}-01T00:00:00`)
    : new Date(`${value}T00:00:00`);
  const [visibleYear, setVisibleYear] = useState(selectedDate.getFullYear());
  const label = format(selectedDate, mode === 'month' ? 'MMMM yyyy' : 'dd MMM yyyy', { locale });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setVisibleYear(selectedDate.getFullYear());
    setOpen(nextOpen);
  };

  const handleMonthSelect = (month: number) => {
    onChange(`${visibleYear}-${String(month + 1).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn('h-10 w-full justify-between px-3 font-normal', className)}
        >
          <span className="truncate">{label}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-xl p-0 shadow-lg" align="start">
        {mode === 'date' ? (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={date => {
              if (!date) return;
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            disabled={date =>
              (!!min && date < new Date(`${min}T00:00:00`)) ||
              (!!max && date > new Date(`${max}T23:59:59`))
            }
            initialFocus
            locale={locale}
            className="pointer-events-auto"
          />
        ) : (
          <div className="w-[280px] p-3">
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={yearNavigationLabels.previous}
                onClick={() => setVisibleYear(year => year - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">{visibleYear}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={yearNavigationLabels.next}
                onClick={() => setVisibleYear(year => year + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map(month => {
                const monthDate = new Date(visibleYear, month, 1);
                const isSelected = selectedDate.getFullYear() === visibleYear && selectedDate.getMonth() === month;
                return (
                  <Button
                    key={month}
                    type="button"
                    variant={isSelected ? 'default' : 'ghost'}
                    className="h-10 px-2 text-sm capitalize"
                    onClick={() => handleMonthSelect(month)}
                  >
                    {format(monthDate, 'MMM', { locale })}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
