// create a modal to create a new challenge
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChallengesApi } from '@/lib/api/challenges';
import { WASTE_TYPES } from '@/lib/api/schemas/goals';

import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateChallenge() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState('');
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (!title || !description || !type || !startDate || !endDate || amount === '') {
                setError(t('challenges.create.missingFields', 'Please fill in all required fields'));
                setLoading(false);
                return;
            }
            // check also that if the amount is a number and greater than 0
            const amountNum = Number(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                setError(t('challenges.create.amountError', 'Amount must be a number greater than 0'));
                setLoading(false);
                return;
            }
            if (new Date(startDate) >= new Date(endDate)) {
                setError(t('challenges.create.dateError', 'End date must be after start date'));
                setLoading(false);
                return;
            }
            await ChallengesApi.create({
                name: title,
                description: description,
                amount: amountNum,
                startDate: startDate,
                endDate: endDate,
                type: type
            });
            setSuccess(t('challenges.create.createSuccess', 'Challenge created successfully'));
            setTitle('');
            setDescription('');
            setType('');
            setAmount('');
            setStartDate('');
            setEndDate('');
        } catch (e) {
            setError(e instanceof Error ? e.message : t('challenges.create.createError', 'Failed to create challenge'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="tertiary" className="px-6">{t("challenges.create.createChallenge")}</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("challenges.create.titleLabel")}</DialogTitle>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4" aria-label={t("challenges.create.titleLabel")}>
                <div>
                  <Label htmlFor="title" className="mb-1 block">{t("challenges.create.name")}</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required aria-required="true" placeholder={t("challenges.create.namePlaceholder")} />
                </div>
                <div>
                  <Label id="type-label" htmlFor="type" className="mb-1 block">{t("challenges.create.type")}</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger 
                      id="type" 
                      className="w-full" 
                      aria-labelledby="type-label"
                      aria-required="true"
                      aria-describedby={!type ? "type-required" : undefined}
                    >
                      <SelectValue placeholder={t("challenges.create.typePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="z-[80]">
                      {WASTE_TYPES.map((wasteType) => (
                        <SelectItem key={wasteType.id} value={wasteType.name}>
                          {wasteType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span id="type-required" className="sr-only">{t("challenges.create.typeRequired", "Waste type is required")}</span>
                </div>
                <div>
                  <Label htmlFor="amount" className="mb-1 block">{t("challenges.create.amount")}</Label>
                  <Input 
                    id="amount" 
                    type="text" 
                    inputMode="numeric" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    required 
                    aria-required="true" 
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-1 block">{t("challenges.create.description")}</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required aria-required="true" placeholder={t("challenges.create.descriptionPlaceholder")} />
                </div>
                <div>
                  <Label htmlFor="startDate" className="mb-1 block">{t("challenges.create.startDate")}</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required aria-required="true" />
                </div>
                <div>
                  <Label htmlFor="endDate" className="mb-1 block">{t("challenges.create.endDate")}</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required aria-required="true" />
                </div>
                {error && <div className="text-destructive" role="alert" aria-live="assertive">{error}</div>}
                {success && <div className="text-success" role="status" aria-live="polite">{success}</div>}
                <Button type="submit" disabled={loading} aria-busy={loading} aria-disabled={loading}>
                  {loading ? <Spinner aria-label={t("common.loading", "Loading")} /> : t("common.submit")}
                </Button>
              </form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        </div>
    );
}
