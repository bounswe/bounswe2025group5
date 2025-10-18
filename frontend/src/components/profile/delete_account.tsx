import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";
import { clearTokens } from "@/lib/api/client";

export default function DeleteAccount() {
    const { t } = useTranslation();
    const [password, setPassword] = useState<string | null>(null);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const storedUsername = useMemo(() => {
        try {
            const raw = localStorage.getItem("username");
            if (raw) return raw;
        } catch {
            return null;
        }
    }, []);
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };
    const handlePasswordSubmit = async () => {
        if (!password) return;
        try {
            setSaving(true);
            setError(null);
            const res = await UsersApi.deleteAccount(storedUsername ?? "", password);
            if (res) {
                clearTokens();
                try { localStorage.removeItem('username'); } catch {}
            window.location.href = '/auth/login';
        }
            
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.toLowerCase().includes('incorrect password')) {
                setError(t('profile.incorrectPassword', 'Incorrect password'));
            } else {
                setError(t('profile.deleteFailed', 'Delete failed'));
            }
        } finally {
            setSaving(false);
        }
    };
    const onDeleteAccount = () => {
        setPasswordOpen(true);
    };
    return (
    
        <Popover open={passwordOpen} onOpenChange={setPasswordOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="destructive" onClick={onDeleteAccount}>
                    {t('profile.delete')}
                </Button>
            </PopoverTrigger>
        <PopoverContent className="w-96">
            <p className="text-sm text-accent-foreground mb-4">{t('profile.confirmDelete', 'This will permanently delete your account. Continue?')}</p>
            <Input value={password ?? ""} onChange={handlePasswordChange} placeholder={t('profile.passwordPlaceholder', 'Enter your password')} />
            {error && (
                <div className="text-destructive text-sm mt-2">{error}</div>
            )}
            <Button type="button" variant="destructive" onClick={handlePasswordSubmit} disabled={saving} aria-busy={saving}>
                {saving ? t('profile.deleting', 'Deleting...') : t('profile.delete')}
            </Button>
        </PopoverContent>
        </Popover>
    );
}