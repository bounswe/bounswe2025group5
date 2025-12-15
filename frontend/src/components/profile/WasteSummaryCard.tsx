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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DEFAULT_WASTE_TYPE, WASTE_TYPE_OPTIONS, type WasteTypeOption } from '@/lib/api/schemas/goals';

type FormState = {
  startDate: string;
  endDate: string;
  wasteType: string;
};

function getDefaultForm(): FormState {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  const toIsoDate = (date: Date) => date.toISOString().split('T')[0];
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    wasteType: DEFAULT_WASTE_TYPE,
  };
}

const DEFAULT_FORM = getDefaultForm();

type ImpactUnitKey = 'trees' | 'barrels' | 'energy' | 'ore' | 'compost';

const IMPACT_UNIT_LABELS: Record<ImpactUnitKey, string> = {
  trees: 'trees',
  barrels: 'barrels of oil',
  energy: 'kWh saved',
  ore: 'kg of ore',
  compost: 'kg of compost',
};

const IMPACT_CONVERSIONS: Record<WasteTypeOption, { factorPerKg: number; unitKey: ImpactUnitKey }> = {
  PAPER: { factorPerKg: 0.017, unitKey: 'trees' }, // 1000kg = 17 trees -> 1kg = 0.017 trees
  PLASTIC: { factorPerKg: 0.0163, unitKey: 'barrels' }, // ~16.3 barrels per 1000kg
  GLASS: { factorPerKg: 0.042, unitKey: 'energy' }, // placeholder energy savings per kg
  METAL: { factorPerKg: 1.5, unitKey: 'ore' }, // placeholder ore savings per kg
  ORGANIC: { factorPerKg: 0.5, unitKey: 'compost' }, // placeholder compost generated per kg
};

type WasteSummaryCardProps = {
  className?: string;
  variant?: 'default' | 'compact';
};

export default function WasteSummaryCard({ className, variant = 'default' }: WasteSummaryCardProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [summary, setSummary] = useState<TotalLogResponse | null>(null);
  const [activeRange, setActiveRange] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gaugeId = useId();
  const accordionId = useId();
  const isCompact = variant === 'compact';

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
  const wasteTypeKey = summary?.wasteType?.name ?? form.wasteType;
  const wasteTypeLabel = t(`wasteTypes.${wasteTypeKey}`, { defaultValue: wasteTypeKey });
  const normalizedWasteTypeKey = (wasteTypeKey ?? '').toUpperCase() as WasteTypeOption;

  const impactInfo = useMemo(() => {
    if (!summary) return null;
    const conversion = IMPACT_CONVERSIONS[normalizedWasteTypeKey];
    if (!conversion) return null;
    const amountKg = summary.totalAmount / 1000;
    if (!Number.isFinite(amountKg) || amountKg <= 0) return null;
    const impactValue = amountKg * conversion.factorPerKg;
    const unitLabel = t(`goals.impact.units.${conversion.unitKey}`, IMPACT_UNIT_LABELS[conversion.unitKey]);
    return {
      impactValue,
      formattedImpact: formatNumber(impactValue, { maximumFractionDigits: 2 }),
      unitLabel,
    };
  }, [normalizedWasteTypeKey, summary, t]);

  const impactMessage = useMemo(() => {
    if (!summary) return null;
    if (!impactInfo) {
      return t('goals.summaryImpactEmpty', 'Log waste to see your real-world savings.');
    }
    return t(
      'goals.summaryImpactDescription',
      'All users logged {{amount}} of {{wasteType}}, saving about {{impact}} {{unit}}.',
      {
        amount: formatWeight(summary.totalAmount),
        wasteType: wasteTypeLabel,
        impact: impactInfo.formattedImpact,
        unit: impactInfo.unitLabel,
      }
    );
  }, [impactInfo, summary, t, wasteTypeLabel]);

  return (
    <Card className={cn('w-full relative min-h-[380px]', className)}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={accordionId} className="border-none">
          <CardHeader className={cn('space-y-2', isCompact ? 'p-4 pb-2' : 'p-5 pb-3')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className={cn('font-semibold', isCompact ? 'text-xl' : 'text-2xl')}>
                    {t('goals.summaryTitle', 'Waste impact snapshot')}
                  </CardTitle>
                  <Badge variant="secondary" className={cn('uppercase tracking-wide', isCompact && 'text-xs')}>
                    {wasteTypeLabel}
                  </Badge>
            </div>
            <CardDescription className={cn(isCompact ? 'text-xs' : 'text-sm')}>
              {t(
                'goals.summarySubtitle',
                '{{start}} / {{end}}.',
                { start: activeRange.startDate, end: activeRange.endDate }
              )}
            </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn('space-y-4', isCompact ? 'p-4 pt-0' : 'p-5 pt-0')}>
            <div className="flex items-center justify-center">
          {loading && !summary ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <CircularGauge
              gradientId={gaugeId}
              percent={progressValue}
              label={summary ? formatWeight(summary.totalAmount) : '--'}
              sublabel={t('goals.summaryTotal', 'Total collected')}
              scaleLabel={scaleMax > 0 ? `${t('goals.summaryScaleMax', 'Scale max')}: ${formatWeight(scaleMax)}` : undefined}
              size={isCompact ? 170 : 200}
            />
          )}
            </div>

            <div className="absolute bottom-2 right-2">
              <AccordionTrigger className="hover:no-underline p-2 rounded-full hover:bg-accent transition-colors" />
            </div>
          </CardContent>

          <AccordionContent>
            <CardContent className={cn('space-y-3', isCompact ? 'p-4 pt-0' : 'p-5 pt-0')}>
          <form
            className={cn(
              'grid gap-4',
              isCompact ? 'md:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]' : 'md:grid-cols-[repeat(3,minmax(0,1fr))_auto]'
            )}
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
            <div className={cn('flex items-end', isCompact && 'md:col-span-2 lg:col-span-1')}>
              <Button
                type="submit"
                className="w-full"
                disabled={!rangeIsValid || loading}
              >
                {loading ? t('goals.summaryFetching', 'Fetching...') : t('goals.summaryFetch', 'Refresh data')}
              </Button>
            </div>
          </form>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label={t('goals.summaryRange', 'Tracking window')}
              value={durationDays > 0 ? t('goals.summaryDuration', '{{count}} day span', { count: durationDays }) : ""}
              variant={isCompact ? 'compact' : 'default'}
            />
            <StatCard
              label={t('goals.summaryAverage', 'Average per day')}
              value={summary ? formatWeight(averagePerDay) : '--'}
              variant={isCompact ? 'compact' : 'default'}
            />
            <StatCard
              label={t('goals.summaryWasteLabel', 'Selected waste type')}
              value={wasteTypeLabel}
              variant={isCompact ? 'compact' : 'default'}
            />
            <StatCard
              label={t('goals.summaryImpactLabel', 'Real-world savings')}
              value={
                impactInfo
                  ? `${impactInfo.formattedImpact} ${impactInfo.unitLabel}`
                  : t('goals.summaryImpactEmptyValue', 'No savings yet')
              }
              helper={
                impactInfo && summary
                  ? t('goals.summaryImpactHelper', 'From {{amount}} of {{wasteType}}', {
                      amount: formatWeight(summary.totalAmount),
                      wasteType: wasteTypeLabel,
                    })
                  : undefined
              }
              variant={isCompact ? 'compact' : 'default'}
            />
            </div>

          {summary && impactMessage && (
            <p className="text-sm text-muted-foreground">{impactMessage}</p>
          )}

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
        </CardContent>
      </AccordionContent>
        </AccordionItem>
      </Accordion>
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
  variant?: 'default' | 'compact';
};

function StatCard({ label, value, helper, variant = 'default' }: StatCardProps) {
  const isCompact = variant === 'compact';
  return (
    <div className={cn('rounded-2xl border bg-muted/30', isCompact ? 'p-3' : 'p-4')}>
      <p className={cn('text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>{label}</p>
      <p className={cn('mt-1 font-semibold', isCompact ? 'text-lg' : 'text-2xl')}>{value}</p>
      {helper && <p className={cn('text-muted-foreground', isCompact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs')}>{helper}</p>}
    </div>
  );
}

type CircularGaugeProps = {
  percent: number;
  label: string;
  sublabel: string;
  scaleLabel?: string;
  gradientId: string;
  size?: number;
};

function CircularGauge({ percent, label, sublabel, scaleLabel, gradientId, size = 220 }: CircularGaugeProps) {
  const radius = 0.36 * size;
  const circumference = 2 * Math.PI * radius;
  const normalizedPercent = Number.isFinite(percent) ? Math.max(0, Math.min(percent, 100)) : 0;
  const dashOffset = circumference * (1 - normalizedPercent / 100);

  return (
    <div className="relative">
      <svg
        role="img"
        aria-label={`${label} (${sublabel})`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={`${gradientId}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(16 185 129)" />
            <stop offset="100%" stopColor="rgb(59 130 246)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="14"
          className="text-muted-foreground/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
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
        <text x={size / 2} y={size / 2 - 5} textAnchor="middle" className="fill-foreground text-2xl font-semibold">
          {label}
        </text>
        <text x={size / 2} y={size / 2 + 20} textAnchor="middle" className="fill-muted-foreground text-sm">
          {sublabel}
        </text>
        <text x={size / 2} y={size / 2 + 40} textAnchor="middle" className="fill-muted-foreground text-xs">
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

function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options,
  }).format(Number.isFinite(value) ? value : 0);
}

