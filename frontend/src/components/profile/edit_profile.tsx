import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import PasswordStrengthMeter from "@/components/common/password-strength-meter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { AuthApi } from "@/lib/api/auth";
import { UsersApi } from "@/lib/api/users";

const MIN_PASSWORD_LENGTH = 8;

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
    const [_profilePhotoSrc, setProfilePhotoSrc] = useState(initialPhotoUrl);
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);
    const [resetLoading, setResetLoading] = useState(false);

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

    const handleBioChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const handlePhotoUrlChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

    const { isStrong: isNewPasswordStrong } = usePasswordStrength(newPassword);

    const handleResetSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        setResetError(null);
        setResetSuccess(null);
        if (!storedUsername) {
            setResetError(t('profile.resetPassword.error.usernameMissing', 'We could not find your username. Please log in again.'));
            return;
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setResetError(t('profile.resetPassword.error.tooShort', { min: MIN_PASSWORD_LENGTH, defaultValue: 'Password must be at least {{min}} characters.' }));
            return;
        }
        if (!isNewPasswordStrong) {
            setResetError(t('profile.resetPassword.error.tooWeak', 'Password is too weak. Aim for "Good" or higher.'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setResetError(t('profile.resetPassword.error.passwordsDontMatch', 'Passwords do not match'));
            return;
        }
        if (newPassword === currentPassword) {
            setResetError(t('profile.resetPassword.error.samePassword', 'New password must be different from the current one.'));
            return;
        }
        try {
            setResetLoading(true);
            await AuthApi.resetPassword(storedUsername, currentPassword, newPassword);
            setResetSuccess(t('profile.resetPassword.success', 'Password updated successfully.'));
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            const message = err instanceof Error ? err.message : null;
            setResetError(message || t('profile.resetPassword.error.generic', 'Could not change password. Please try again.'));
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetCancel = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setResetError(null);
        setResetSuccess(null);
        setProfileOpen(false);
    };

    return (
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="secondary">
                    {t('profile.edit')}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[min(95vw,460px)] max-h-[85vh] overflow-y-auto p-6">
                <DialogHeader className="pb-2">
                    <DialogTitle>{t('profile.edit')}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="account" className="space-y-6 min-h-[455px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="account">{t('profile.account.details', 'Account Details')}</TabsTrigger>
                        <TabsTrigger value="password">{t('profile.account.password', 'Reset Password')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">
                        <div className="flex flex-col items-center gap-6">
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
                                        src={photoUrl}
                                        alt={storedUsername ? t('profile.photoAlt', { username: storedUsername, defaultValue: `${storedUsername}'s profile photo` }) : t('profile.photoAltAnon', 'Profile photo')}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">{t('profile.noPhoto', 'No photo')}</div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-white text-sm">
                                        <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                        </svg>
                                        <span>{t('profile.editImage', 'Edit image')}</span>
                                    </div>
                                </div>
                            </div>

                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUrlChange} />

                            <div className="text-xl font-semibold leading-tight break-words text-center">{storedUsername}</div>

                            <Textarea
                                value={bio ?? ""}
                                onChange={handleBioChange}
                                placeholder={t('profile.bioPlaceholder', 'Tell us about yourself')}
                                className="text-base py-3 px-4 min-h-[96px] resize-none"
                                aria-label={t('profile.bioPlaceholder', 'Tell us about yourself')}
                                rows={3}
                            />
                            <div className="flex flex-wrap gap-3 justify-center w-full">
                                <Button type="button" variant="default" onClick={handleBioSubmit} disabled={saving} aria-busy={saving} className="text-base px-5 py-2">
                                    {saving ? t('profile.saving', 'Saving...') : t('profile.save')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setProfileOpen(false)} className="text-base px-5 py-2">
                                    {t('profile.cancel', 'Cancel')}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="password">
                        <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div className="text-sm text-muted-foreground leading-relaxed">
                                {t('profile.resetPassword.subtitle', 'Set a new password to keep your account secure.')}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="current-password">{t('profile.resetPassword.currentLabel', 'Current password')}</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="text-base py-3 px-4"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">{t('profile.resetPassword.newLabel', 'New password')}</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={t('profile.resetPassword.placeholder', 'Choose a strong password')}
                                    autoComplete="new-password"
                                    required
                                    aria-describedby="password-requirements"
                                    className="text-base py-3 px-4"
                                />
                                <p id="password-requirements" className="text-xs text-muted-foreground">
                                    {t('profile.resetPassword.requirements', 'Use at least 8 characters. Mix letters, numbers, and symbols, and avoid common patterns.')}
                                </p>
                                {newPassword ? (
                                    <PasswordStrengthMeter password={newPassword} />
                                ) : (
                                    <div className="h-[34px]" aria-hidden="true" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">{t('profile.resetPassword.confirmLabel', 'Confirm new password')}</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('profile.resetPassword.confirmLabel', 'Confirm new password')}
                                    autoComplete="new-password"
                                    required
                                    className="text-base py-3 px-4"
                                />
                            </div>
                            {resetError && (
                                <Alert variant="destructive" className="p-3">
                                    <AlertDescription>{resetError}</AlertDescription>
                                </Alert>
                            )}
                            {resetSuccess && (
                                <Alert className="p-3">
                                    <AlertDescription>{resetSuccess}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex flex-wrap gap-3 justify-center pt-2">
                                <Button type="submit" disabled={resetLoading} aria-busy={resetLoading} className="text-base px-5 py-2">
                                    {resetLoading ? t('profile.resetPassword.updating', 'Updating...') : t('profile.resetPassword.update', 'Update password')}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleResetCancel} className="text-base px-5 py-2">
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
