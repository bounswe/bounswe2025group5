// create a modal to create a new challenge
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChallengesApi } from '@/lib/api/challenges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function CreateChallenge() {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'steps' | 'cycling' | 'running'>('steps');
    const [amount, setAmount] = useState<number | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (!title || !description || !startDate || !endDate) {
                setError(t('challenges.createError', 'Please fill all required fields'));
                setLoading(false);
                return;
            }
            if (new Date(startDate) >= new Date(endDate)) {
                setError(t('challenges.dateError', 'End date must be after start date'));
                setLoading(false);
                return;
            }
            await ChallengesApi.create({
                name: title,
                description,
                wasteType: type,
                amount: amount === '' ? null : amount,
                startDate,
                endDate,
            });
            setSuccess(t('challenges.createSuccess', 'Challenge created successfully'));
            setTitle('');
            setDescription('');
            setType('steps');
            setAmount('');
            setStartDate('');
            setEndDate('');
        } catch (e) {
            setError(e instanceof Error ? e.message : t('challenges.createError', 'Failed to create challenge'));
        } finally {
            setLoading(false);
        }
    };
}