import { useCallback, useEffect, useMemo, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { WasteApi, type MonthlyWasteData } from '@/lib/api/waste';
import { DEFAULT_WASTE_TYPE, WASTE_TYPE_OPTIONS } from '@/lib/api/schemas/goals';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';

type WasteMonthlyChartProps = {
  username?: string | null;
  className?: string;
  variant?: 'default' | 'compact';
};

type ImpactUnitKey = 'trees' | 'barrels' | 'energy' | 'ore' | 'compost';

const IMPACT_UNIT_LABELS: Record<ImpactUnitKey, string> = {
  trees: 'trees',
  barrels: 'barrels of oil',
  energy: 'kWh saved',
  ore: 'kg of ore',
  compost: 'kg of compost',
};

const IMPACT_CONVERSIONS: Record<string, { factorPerKg: number; unitKey: ImpactUnitKey }> = {
  PAPER: { factorPerKg: 0.017, unitKey: 'trees' },
  PLASTIC: { factorPerKg: 0.0163, unitKey: 'barrels' },
  GLASS: { factorPerKg: 0.042, unitKey: 'energy' },
  METAL: { factorPerKg: 1.5, unitKey: 'ore' },
  ORGANIC: { factorPerKg: 0.5, unitKey: 'compost' },
};

export default function WasteMonthlyChart({ username, className, variant = 'default' }: WasteMonthlyChartProps) {
  const { t } = useTranslation();
  const isCompact = variant === 'compact';
  const fallbackUsername = useMemo(() => {
    if (username) return username;
    try {
      const stored = localStorage.getItem('username');
      if (stored) return stored;
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const [, payload] = token.split('.');
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload));
      return typeof decoded.username === 'string' ? decoded.username : null;
    } catch {
      return null;
    }
  }, [username]);

  const [wasteType, setWasteType] = useState<string>(DEFAULT_WASTE_TYPE);
  const [monthlyData, setMonthlyData] = useState<MonthlyWasteData[]>([]);
  const [resolvedWasteType, setResolvedWasteType] = useState<string>(DEFAULT_WASTE_TYPE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accordionId = useId();

  const totalCollected = useMemo(
    () => monthlyData.reduce((sum, entry) => sum + entry.totalWeight, 0),
    [monthlyData]
  );

  const impactInfo = useMemo(() => {
    const conversion = IMPACT_CONVERSIONS[resolvedWasteType ?? wasteType];
    if (!conversion) return null;
    const amountKg = totalCollected / 1000;
    if (!Number.isFinite(amountKg) || amountKg <= 0) return null;
    const impactValue = amountKg * conversion.factorPerKg;
    const unitLabel = t(`goals.impact.units.${conversion.unitKey}`, IMPACT_UNIT_LABELS[conversion.unitKey]);
    return {
      formattedImpact: formatNumber(impactValue, { maximumFractionDigits: 2 }),
      unitLabel,
    };
  }, [resolvedWasteType, totalCollected, t, wasteType]);

  const peakMonth = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return monthlyData.reduce((prev, curr) => (curr.totalWeight > prev.totalWeight ? curr : prev));
  }, [monthlyData]);

  const maxValue = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return Math.max(...monthlyData.map((entry) => entry.totalWeight));
  }, [monthlyData]);

  const loadMonthly = useCallback(async () => {
    if (!fallbackUsername) {
      setError(t('goals.monthlyNoUser', 'You need to be signed in to view monthly waste stats.'));
      setMonthlyData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await WasteApi.monthly({
        username: fallbackUsername,
        wasteType,
      });
      setMonthlyData(response.monthlyData);
      setResolvedWasteType(response.wasteType);
    } catch (err) {
      setMonthlyData([]);
      setResolvedWasteType(wasteType);
      setError(err instanceof Error ? err.message : t('goals.monthlyError', 'Unable to load monthly waste data.'));
    } finally {
      setLoading(false);
    }
  }, [fallbackUsername, t, wasteType]);

  useEffect(() => {
    void loadMonthly();
  }, [loadMonthly]);

  const chartEmpty = !loading && monthlyData.length === 0;
  const maxScale = maxValue > 0 ? maxValue : 1000;
  const chartData = monthlyData.map((entry) => ({
    label: entry.month,
    value: entry.totalWeight,
  }));

  return (
    <Card className={cn('w-full relative min-h-[380px]', className)}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={accordionId} className="border-none">
          <CardHeader className={cn('space-y-2', isCompact ? 'p-4 pb-2' : 'p-5 pb-3')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className={cn('font-semibold', isCompact ? 'text-xl' : 'text-2xl')}>
                    {t('goals.monthlyTitle', '12-month waste trends')}
                  </CardTitle>
                  <Badge variant="secondary" className={cn('uppercase tracking-wide', isCompact && 'text-xs')}>
                    {t(`wasteTypes.${resolvedWasteType}`, { defaultValue: resolvedWasteType })}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn('space-y-4', isCompact ? 'p-4 pt-0' : 'p-5 pt-0')}>
        <div className={cn('rounded-2xl border bg-muted/20', isCompact ? 'pl-1 pr-3 py-3 h-48' : 'pl-3 pr-4 py-4 h-60')}>
          {loading && monthlyData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-10 w-10" />
            </div>
          ) : chartEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              {t('goals.monthlyEmpty', 'No logs found for this waste type in the last 12 months.')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  interval={0}
                  tickFormatter={(value) => String(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={40}
                  tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  formatter={(value) => formatWeight(Number(value))}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--muted)',
                    background: 'var(--card)',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.value > 0 ? '#10b981' : '#d4d4d8'} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="absolute bottom-2 right-2">
          <AccordionTrigger className="hover:no-underline p-2 rounded-full hover:bg-accent transition-colors" />
        </div>
      </CardContent>

      <AccordionContent>
        <CardContent className={cn('space-y-4', isCompact ? 'p-4 pt-0' : 'p-5 pt-0')}>
          <div className={cn('grid gap-4', isCompact ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
            <Metric
              label={t('goals.monthlyTotal', '12-month total')}
              value={formatWeight(totalCollected)}
              helper={t('goals.summaryScaleMax', 'Scale max') + `: ${formatWeight(maxScale)}`}
              variant={isCompact ? 'compact' : 'default'}
            />
            <Metric
              label={t('goals.monthlyPeak', 'Peak month')}
              value={peakMonth ? formatMonthLabel(peakMonth.year, peakMonth.month) : '--'}
              helper={peakMonth ? formatWeight(peakMonth.totalWeight) : t('goals.monthlyPeakEmpty', 'No logs yet')}
              variant={isCompact ? 'compact' : 'default'}
            />
            <Metric
              label={t('goals.monthlyImpactLabel', '12-month impact')}
              value={
                impactInfo
                  ? `${impactInfo.formattedImpact} ${impactInfo.unitLabel}`
                  : t('goals.summaryImpactEmptyValue', 'No savings yet')
              }
              helper={
                impactInfo
                  ? t('goals.monthlyImpactHelper', 'From your last 12 months')
                  : undefined
              }
              variant={isCompact ? 'compact' : 'default'}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t('goals.recyclingNote', 'We calculate savings assuming the waste you log is recycled.')}
          </p>

          <form
            className={cn('grid gap-4', isCompact ? 'sm:grid-cols-2' : 'sm:grid-cols-[1fr_auto]')}
            onSubmit={(event) => {
              event.preventDefault();
              void loadMonthly();
            }}
          >
            <div className="grid gap-1">
              <Label htmlFor="monthly-waste-type">{t('goals.wasteType', 'Waste type')}</Label>
              <select
                id="monthly-waste-type"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={wasteType}
                onChange={(event) => setWasteType(event.target.value)}
              >
                {WASTE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={loading || !fallbackUsername}>
                {loading ? t('goals.monthlyFetching', 'Fetching...') : t('goals.monthlyFetch', 'Refresh data')}
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('goals.monthlyErrorTitle', 'Request failed')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!fallbackUsername && !error && (
            <p className="text-sm text-muted-foreground">
              {t('goals.monthlySignIn', 'Sign in to visualize your historical waste logs.')}
            </p>
          )}
        </CardContent>
      </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

type MetricProps = {
  label: string;
  value: string;
  helper?: string;
  variant?: 'default' | 'compact';
};

function Metric({ label, value, helper, variant = 'default' }: MetricProps) {
  const isCompact = variant === 'compact';
  return (
    <div className={cn('rounded-2xl border bg-background/50', isCompact ? 'p-3' : 'p-4')}>
      <p className={cn('text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>{label}</p>
      <p className={cn('mt-1 font-semibold', isCompact ? 'text-lg' : 'text-2xl')}>{value}</p>
      {helper && <p className={cn('text-muted-foreground', isCompact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs')}>{helper}</p>}
    </div>
  );
}

function formatMonthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
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

