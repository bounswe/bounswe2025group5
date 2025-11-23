import { useCallback, useEffect, useMemo, useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { WasteApi, type TotalLogResponse } from '@/lib/api/waste';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_WASTE_TYPE, WASTE_TYPE_OPTIONS } from '@/lib/api/schemas/goals';

type FormState = {
  startDate: string;
  endDate: string;
  wasteType: string;
};

const DEFAULT_FORM: FormState = {
  startDate: '2025-10-01',
  endDate: '2025-10-20',
  wasteType: DEFAULT_WASTE_TYPE,
};

type WasteSummaryCardProps = {
  className?: string;
};

export default function WasteSummaryCard({ className }: WasteSummaryCardProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [summary, setSummary] = useState<TotalLogResponse | null>(null);
  const [activeRange, setActiveRange] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gaugeId = useId();

  const rangeIsValid = useMemo(() => {
    if (!form.startDate || !form.endDate) return false;
    return new Date(form.startDate) <= new Date(form.endDate);
  }, [form.endDate, form.startDate]);

  const loadSummary = useCallback(async (values: FormState) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        startDate: `${values.startDate}T00:00:00`,
        endDate: `${values.endDate}T23:59:59`,
        wasteType: values.wasteType,
      };
      const data = await WasteApi.summary(payload);
      setSummary(data);
      setActiveRange({ ...values });
    } catch (err) {
      setSummary(null);
      setActiveRange({ ...values });
      setError(err instanceof Error ? err.message : t('goals.summaryError', 'Unable to load waste summary.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSummary(DEFAULT_FORM);
  }, [loadSummary]);

  const durationDays = useMemo(() => calcDurationDays(activeRange.startDate, activeRange.endDate), [activeRange.endDate, activeRange.startDate]);
  const scaleMax = useMemo(() => summary ? niceCeil(summary.totalAmount) : 0, [summary]);
  const progressValue = summary && scaleMax > 0 ? Math.min((summary.totalAmount / scaleMax) * 100, 100) : 0;
  const averagePerDay = summary && durationDays > 0 ? summary.totalAmount / durationDays : 0;
  const wasteTypeLabel = summary?.wasteType?.name ?? form.wasteType;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-2xl font-semibold">{t('goals.summaryTitle', 'Waste impact snapshot')}</CardTitle>
          <Badge variant="secondary" className="uppercase tracking-wide">
            {wasteTypeLabel}
          </Badge>
        </div>
        <CardDescription>
          {t(
            'goals.summarySubtitle',
            'Aggregated from /api/logs/summary between {{start}} and {{end}}.',
            { start: activeRange.startDate, end: activeRange.endDate }
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!rangeIsValid) return;
            void loadSummary(form);
          }}
        >
          <Field label={t('goals.summaryStart', 'Start date')} htmlFor="summary-start">
            <Input
              id="summary-start"
              type="date"
              value={form.startDate}
              max={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              required
            />
          </Field>
          <Field label={t('goals.summaryEnd', 'End date')} htmlFor="summary-end">
            <Input
              id="summary-end"
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              required
            />
          </Field>
          <Field label={t('goals.summaryWasteType', 'Waste type')} htmlFor="summary-type">
            <Input
              id="summary-type"
              list="waste-type-options"
              value={form.wasteType}
              onChange={(event) => setForm((prev) => ({ ...prev, wasteType: event.target.value }))}
              placeholder={t('goals.summaryTypePlaceholder', 'e.g., PLASTIC')}
              required
            />
            <datalist id="waste-type-options">
              {WASTE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </Field>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full"
              disabled={!rangeIsValid || loading}
            >
              {loading ? t('goals.summaryFetching', 'Fetching...') : t('goals.summaryFetch', 'Refresh data')}
            </Button>
          </div>
        </form>

        {!rangeIsValid && (
          <p className="text-sm text-destructive">
            {t('goals.summaryInvalidRange', 'Start date must be on or before the end date.')}
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t('goals.summaryErrorTitle', 'Request failed')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <div className="flex items-center justify-center">
            {loading && !summary ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Spinner className="h-10 w-10" />
              </div>
            ) : (
              <CircularGauge
                gradientId={gaugeId}
                percent={progressValue}
                label={summary ? formatWeight(summary.totalAmount) : '--'}
                sublabel={t('goals.summaryTotal', 'Total collected')}
                scaleLabel={scaleMax > 0 ? `${t('goals.summaryScaleMax', 'Scale max')}: ${formatWeight(scaleMax)}` : undefined}
              />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label={t('goals.summaryRange', 'Tracking window')}
              value={`${formatDate(activeRange.startDate)} → ${formatDate(activeRange.endDate)}`}
              helper={durationDays > 0 ? t('goals.summaryDuration', '{{count}} day span', { count: durationDays }) : undefined}
            />
            <StatCard
              label={t('goals.summaryAverage', 'Average per day')}
              value={summary ? formatWeight(averagePerDay) : '--'}
              helper={summary ? t('goals.summaryAverageHelper', '~{{grams}} g/day', { grams: formatNumber(averagePerDay) }) : undefined}
            />
            <StatCard
              label={t('goals.summaryWasteLabel', 'Selected waste type')}
              value={wasteTypeLabel}
              helper={summary?.wasteType?.id ? `${t('goals.summaryTypeId', 'Type id')}: ${summary.wasteType.id}` : undefined}
            />
            <StatCard
              label={t('goals.summaryEndpointLabel', 'Data source')}
              value="/api/logs/summary"
              helper={t('goals.summaryQueryHelper', 'GET with ISO interval filters')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

type CircularGaugeProps = {
  percent: number;
  label: string;
  sublabel: string;
  scaleLabel?: string;
  gradientId: string;
};

function CircularGauge({ percent, label, sublabel, scaleLabel, gradientId }: CircularGaugeProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const normalizedPercent = Number.isFinite(percent) ? Math.max(0, Math.min(percent, 100)) : 0;
  const dashOffset = circumference * (1 - normalizedPercent / 100);

  return (
    <div className="relative">
      <svg
        role="img"
        aria-label={`${label} (${sublabel})`}
        width="220"
        height="220"
        viewBox="0 0 220 220"
      >
        <defs>
          <linearGradient id={`${gradientId}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(16 185 129)" />
            <stop offset="100%" stopColor="rgb(59 130 246)" />
          </linearGradient>
        </defs>
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted-foreground/30"
        />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId}-stroke)`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          className="text-primary transition-all duration-500"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x="110" y="105" textAnchor="middle" className="fill-foreground text-2xl font-semibold">
          {label}
        </text>
        <text x="110" y="130" textAnchor="middle" className="fill-muted-foreground text-sm">
          {sublabel}
        </text>
        <text x="110" y="150" textAnchor="middle" className="fill-muted-foreground text-xs">
          {`${Math.round(normalizedPercent)}%`}
        </text>
      </svg>
      {scaleLabel && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{scaleLabel}</p>
      )}
    </div>
  );
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function calcDurationDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / DAY_IN_MS) + 1;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1000;
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const fraction = value / base;
  if (fraction <= 1) return base;
  if (fraction <= 2) return 2 * base;
  if (fraction <= 5) return 5 * base;
  return 10 * base;
}

function formatWeight(grams: number): string {
  if (!Number.isFinite(grams)) return '--';
  if (Math.abs(grams) >= 1000) {
    return `${formatNumber(grams / 1000, { maximumFractionDigits: 2 })} kg`;
  }
  return `${formatNumber(grams, { maximumFractionDigits: 0 })} g`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options,
  }).format(Number.isFinite(value) ? value : 0);
}

