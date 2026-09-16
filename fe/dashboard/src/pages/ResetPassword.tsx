import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { KeyRound, Eye, EyeOff, Check, X } from "lucide-react";

export default function ResetPassword() {
  const { t } = useLanguage();
  const { resetPassword } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetPasswordEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Password strength indicators
  const passwordChecks = {
    minLength: newPassword.length >= 14,
    hasLower: /[a-z]/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^a-zA-Z0-9]/.test(newPassword),
  };

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const allChecksPass = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !code || !newPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.resetPassword.error'),
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: t('common.error'),
        description: t('auth.register.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (!allChecksPass) {
      toast({
        title: t('common.error'),
        description: t('auth.resetPassword.error'),
        variant: "destructive",
      });
      return;
    }

    try {
      await resetPassword.mutateAsync({
        email,
        code,
        newPassword,
      });

      // Clear stored email
      sessionStorage.removeItem('resetPasswordEmail');

      toast({
        title: t('auth.resetPassword.success'),
        description: t('auth.resetPassword.successDescription'),
      });

      navigate("/login");
    } catch (error: any) {
      const errorMessage = error.message || t('auth.resetPassword.error');

      if (errorMessage.includes('CodeMismatchException')) {
        toast({
          title: t('auth.resetPassword.invalidCode'),
          description: t('auth.resetPassword.invalidCodeDescription'),
          variant: "destructive",
        });
        return;
      }

      if (errorMessage.includes('ExpiredCodeException')) {
        toast({
          title: t('auth.resetPassword.expiredCode'),
          description: t('auth.resetPassword.expiredCodeDescription'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.resetPassword.title')}
          </CardTitle>
          <CardDescription>
            {t('auth.resetPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.resetPassword.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.resetPassword.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetPassword.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t('auth.resetPassword.code')}</Label>
              <Input
                id="code"
                type="text"
                placeholder={t('auth.resetPassword.codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center tracking-widest"
                maxLength={6}
                disabled={resetPassword.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.resetPassword.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={resetPassword.isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent z-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-1 ${passwordChecks.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {t('auth.register.passwordRequirements.minLength')}
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasLower ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {t('auth.register.passwordRequirements.lowercase')}
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasUpper ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {t('auth.register.passwordRequirements.uppercase')}
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {t('auth.register.passwordRequirements.number')}
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                  {passwordChecks.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {t('auth.register.passwordRequirements.special')}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={resetPassword.isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent z-10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-500">{t('auth.register.passwordMismatch')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetPassword.isPending || !allChecksPass || !passwordsMatch || !code}
            >
              {resetPassword.isPending ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Button
              variant="link"
              className="text-sm text-gray-500"
              onClick={() => navigate("/forgot-password")}
            >
              {t('auth.resetPassword.requestNewCode')}
            </Button>

            <div>
              <a href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                {t('auth.resetPassword.backToHome')}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
