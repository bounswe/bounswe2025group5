import { useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";

export default function EditProfile() {
    const { t } = useTranslation();
    const [profileOpen, setProfileOpen] = useState(false);
    const [bio, setBio] = useState<string | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const storedUsername = useMemo(() => {
        try {
            const raw = localStorage.getItem("username");
            if (raw) return raw;
        } catch {
            return null;
        }
    }, []);
    const handleBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBio(e.target.value);
    };
    const handleBioSubmit = async () => {
        if (!bio) return;
        try {
            await UsersApi.updateProfile(storedUsername ?? "", bio);
        } catch (e) {
            console.error(e);
        }
    };
    const handlePhotoUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const updated = await UsersApi.uploadProfilePhoto(storedUsername ?? "", file);
            setPhotoUrl(updated.photoUrl ?? null);
        } catch (e) {
            console.error(e);
        }
    };
    const onEditProfile = () => {
        setProfileOpen(true);
    };
    return (
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" onClick={onEditProfile}>
                    {t('profile.edit')}
                </Button>
            </PopoverTrigger>
        <PopoverContent>
            <Input value={bio ?? ""} onChange={handleBioChange} placeholder={t('profile.bioPlaceholder', 'Tell us about yourself')} />
            <Button type="button" variant="outline" onClick={handleBioSubmit}>
                {t('profile.save')}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUrlChange} />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                {t('profile.changePhoto')}
            </Button>
        </PopoverContent>
        </Popover>
    );
}