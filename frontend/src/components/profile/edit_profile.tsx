import { useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { UsersApi } from "@/lib/api/users";
import userAvatar from "@/assets/user.png";

type EditProfileProps = {
    username: string | null;
    initialBio: string;
    initialPhotoUrl: string | null;
    onBioSaved?: (newBio: string) => void;
    onPhotoSaved?: (newPhotoUrl: string | null) => void;
};

export default function EditProfile({ username, initialBio, initialPhotoUrl, onBioSaved, onPhotoSaved }: EditProfileProps) {
    const { t } = useTranslation();
    const [profileOpen, setProfileOpen] = useState(false);
    const [bio, setBio] = useState<string | null>(initialBio ?? null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl ?? null);
    const [profilePhotoSrc, setProfilePhotoSrc] = useState(initialPhotoUrl);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const storedUsername = useMemo(() => username ?? (() => {
        try {
            const raw = localStorage.getItem("username");
            if (raw) return raw;
        } catch {
            return null;
        }
        return null;
    })(), [username]);
    const handleBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBio(e.target.value);
    };
    const handleBioSubmit = async () => {
        if (bio == null) return;
        try {
            setSaving(true);
            await UsersApi.updateProfile(storedUsername ?? "", bio);
            onBioSaved?.(bio);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
            setProfileOpen(false);
        }
    };
    const handlePhotoUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const updated = await UsersApi.uploadProfilePhoto(storedUsername ?? "", file);
            const newUrl = updated.photoUrl ?? null;
            setPhotoUrl(newUrl);
            setProfilePhotoSrc(newUrl);
            onPhotoSaved?.(newUrl);
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
        <PopoverContent className="w-96">
            <div className="flex flex-col items-center gap-4">
                {/* Photo with hover edit overlay */}
                <div
                    className="relative group w-32 h-32 rounded-full overflow-hidden bg-muted border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={t('profile.changePhoto')}
                >
                    {photoUrl ? (
                        <img
                            src={profilePhotoSrc || photoUrl}
                            onError={() => setProfilePhotoSrc(userAvatar)}
                            alt={storedUsername ? t('profile.photoAlt', { username: storedUsername, defaultValue: `${storedUsername}'s profile photo` }) : t('profile.photoAltAnon', 'Profile photo')}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full grid place-items-center text-muted-foreground">{t('profile.noPhoto', 'No photo')}</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white text-sm">
                            {/* Pencil icon */}
                            <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                            <span>{t('profile.editImage', 'Edit image')}</span>
                        </div>
                    </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUrlChange} />

                {/* Username */}
                <div className="text-lg font-semibold">{storedUsername}</div>

                {/* Bio */}
                <Input value={bio ?? ""} onChange={handleBioChange} placeholder={t('profile.bioPlaceholder', 'Tell us about yourself')} />

                {/* Actions */}
                <div className="flex gap-2">
                    <Button type="button" variant="default" onClick={handleBioSubmit} disabled={saving} aria-busy={saving}>
                        {saving ? t('profile.saving', 'Saving...') : t('profile.save')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
                        {t('profile.cancel', 'Cancel')}
                    </Button>
                </div>
            </div>
        </PopoverContent>
        </Popover>
    );
}