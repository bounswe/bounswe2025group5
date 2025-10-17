import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";

export default function DeleteAccount() {
    const { t } = useTranslation();
    const [password, setPassword] = useState<string | null>(null);
    const [passwordOpen, setPasswordOpen] = useState(false);

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
            await UsersApi.deleteAccount(storedUsername ?? "", password);
        } catch (e) {
            console.error(e);
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
        <PopoverContent>
            <Input value={password ?? ""} onChange={handlePasswordChange} placeholder={t('profile.passwordPlaceholder', 'Enter your password')} />
            <Button type="button" variant="destructive" onClick={handlePasswordSubmit}>
                {t('profile.delete')}
            </Button>
        </PopoverContent>
        </Popover>
    );
}