// create a modal to create a new challenge
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengesApi } from '@/lib/api/challenges';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function CreateChallenge() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
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
            if (!title || !description || !type || !startDate || !endDate || !amount) {
                setError(t('challenges.create.missingFields', 'Please fill in all required fields'));
                setLoading(false);
                return;
            }
            // check also that if the amount is a number and greater than 0
            if (typeof amount !== 'number' || amount <= 0) {
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
                amount: amount,
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
              <Button variant="default" className="px-6">{t("challenges.create.createChallenge")}</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("challenges.create.titleLabel")}</DialogTitle>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title" className="mb-1 block">{t("challenges.create.name")}</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t("challenges.create.namePlaceholder")} />
                </div>
                <div>
                  <Label htmlFor="type" className="mb-1 block">{t("challenges.create.type")}</Label>
                  <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder={t("challenges.create.typePlaceholder")} required />
                </div>
                <div>
                  <Label htmlFor="amount" className="mb-1 block">{t("challenges.create.amount")}</Label>
                  <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-1 block">{t("challenges.create.description")}</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder={t("challenges.create.descriptionPlaceholder")} />
                </div>
                <div>
                  <Label htmlFor="startDate" className="mb-1 block">{t("challenges.create.startDate")}</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="endDate" className="mb-1 block">{t("challenges.create.endDate")}</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
                {error && <div className="text-destructive">{error}</div>}
                {success && <div className="text-success">{success}</div>}
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner /> : t("common.submit")}
                </Button>
              </form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        </div>
    );
}