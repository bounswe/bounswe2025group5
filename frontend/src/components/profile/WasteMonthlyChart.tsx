import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WasteApi, type MonthlyWasteData } from '@/lib/api/waste';
import { DEFAULT_WASTE_TYPE, WASTE_TYPE_OPTIONS } from '@/lib/api/schemas/goals';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

type WasteMonthlyChartProps = {
  username?: string | null;
  className?: string;
};

export default function WasteMonthlyChart({ username, className }: WasteMonthlyChartProps) {
  const { t } = useTranslation();
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

  const [wasteType, setWasteType] = useState(DEFAULT_WASTE_TYPE);
  const [monthlyData, setMonthlyData] = useState<MonthlyWasteData[]>([]);
  const [resolvedWasteType, setResolvedWasteType] = useState(DEFAULT_WASTE_TYPE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCollected = useMemo(
    () => monthlyData.reduce((sum, entry) => sum + entry.totalWeight, 0),
    [monthlyData]
  );

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

  const chartLabel = t('goals.monthlyChartLabel', 'Monthly collected waste in grams');
  const chartEmpty = !loading && monthlyData.length === 0;
  const maxScale = maxValue > 0 ? maxValue : 1000;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-2xl font-semibold">
            {t('goals.monthlyTitle', '12-month waste trends')}
          </CardTitle>
          <Badge variant="outline" className="uppercase tracking-wide">
            {resolvedWasteType}
          </Badge>
        </div>
        <CardDescription>
          {t(
            'goals.monthlySubtitle',
            'Powered by /api/logs/{{username}}/monthly?wasteType={{type}}',
            { username: fallbackUsername ?? 'username', type: wasteType }
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="grid gap-4 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void loadMonthly();
          }}
        >
          <div className="grid gap-1">
            <Label htmlFor="monthly-waste-type">{t('goals.monthlyWasteType', 'Waste type')}</Label>
            <Input
              id="monthly-waste-type"
              list="monthly-waste-type-options"
              value={wasteType}
              onChange={(event) => setWasteType(event.target.value)}
              placeholder={t('goals.summaryTypePlaceholder', 'e.g., PLASTIC')}
            />
            <datalist id="monthly-waste-type-options">
              {WASTE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
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

        <div className="rounded-2xl border bg-muted/20 p-4">
          {loading && monthlyData.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-10 w-10" />
            </div>
          ) : chartEmpty ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              {t('goals.monthlyEmpty', 'No logs found for this waste type in the last 12 months.')}
            </div>
          ) : (
            <BarChart
              ariaLabel={chartLabel}
              data={monthlyData}
              maxValue={maxScale}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label={t('goals.monthlyTotal', '12-month total')}
            value={formatWeight(totalCollected)}
            helper={t('goals.summaryScaleMax', 'Scale max') + `: ${formatWeight(maxScale)}`}
          />
          <Metric
            label={t('goals.monthlyPeak', 'Peak month')}
            value={peakMonth ? formatMonthLabel(peakMonth.year, peakMonth.month) : '--'}
            helper={peakMonth ? formatWeight(peakMonth.totalWeight) : t('goals.monthlyPeakEmpty', 'No logs yet')}
          />
          <Metric
            label={t('goals.monthlyEndpoint', 'Endpoint')}
            value="/api/logs/{username}/monthly"
            helper={t('goals.monthlyQueryHelper', 'GET wasteType={{type}}', { type: resolvedWasteType })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type BarChartProps = {
  data: MonthlyWasteData[];
  maxValue: number;
  ariaLabel: string;
};

function BarChart({ data, maxValue, ariaLabel }: BarChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} className="flex h-64 items-end gap-2">
      {data.map((entry) => {
        const percentage = maxValue > 0 ? (entry.totalWeight / maxValue) * 100 : 0;
        const monthLabel = formatMonthLabel(entry.year, entry.month);
        return (
          <div key={`${entry.year}-${entry.month}`} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex-1 w-full rounded-lg bg-background/50">
              <div
                className="absolute inset-x-0 bottom-0 rounded-lg bg-gradient-to-t from-emerald-500 to-sky-400"
                style={{ height: `${percentage}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-semibold text-foreground">{monthLabel.split(' ')[0]}</span>
            <span className="text-[11px] text-muted-foreground">{formatWeight(entry.totalWeight)}</span>
          </div>
        );
      })}
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
  helper?: string;
};

function Metric({ label, value, helper }: MetricProps) {
  return (
    <div className="rounded-2xl border bg-background/50 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
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

