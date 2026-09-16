import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'common.error': 'Error',
    'nav.dashboard': 'Admin',
    'auth.login.title': 'Tsuru Admin',
    'auth.login.subtitle': 'Sign in with your platform administrator account',
    'auth.login.email': 'Email',
    'auth.login.emailPlaceholder': 'your@email.com',
    'auth.login.password': 'Password',
    'auth.login.passwordPlaceholder': 'Enter your password',
    'auth.login.submit': 'Sign in',
    'auth.login.forgotPassword': 'Forgot your password?',
    'auth.login.success': 'Login successful',
    'auth.login.successDescription': 'The administration console is ready',
    'auth.login.error': 'Login error',
    'auth.forgotPassword.title': 'Forgot your password?',
    'auth.forgotPassword.subtitle': "Enter your email and we'll send you a recovery code",
    'auth.forgotPassword.email': 'Email',
    'auth.forgotPassword.emailPlaceholder': 'your@email.com',
    'auth.forgotPassword.submit': 'Send code',
    'auth.forgotPassword.submitting': 'Sending...',
    'auth.forgotPassword.backToLogin': 'Back to sign in',
    'auth.forgotPassword.success': 'Code sent',
    'auth.forgotPassword.successDescription': 'Check your email for the recovery code',
    'auth.forgotPassword.error': 'Error sending code',
    'auth.forgotPassword.checkEmail.title': 'Check your email',
    'auth.forgotPassword.checkEmail.subtitle': "We've sent a recovery code to",
    'auth.forgotPassword.checkEmail.enterCode': 'Enter code',
    'auth.forgotPassword.checkEmail.differentEmail': 'Use a different email',
    'auth.resetPassword.title': 'Reset password',
    'auth.resetPassword.subtitle': 'Enter the code from your email and your new password',
    'auth.resetPassword.email': 'Email',
    'auth.resetPassword.emailPlaceholder': 'your@email.com',
    'auth.resetPassword.code': 'Recovery code',
    'auth.resetPassword.codePlaceholder': 'Enter the 6-digit code',
    'auth.resetPassword.newPassword': 'New password',
    'auth.resetPassword.newPasswordPlaceholder': 'Enter your new password',
    'auth.resetPassword.confirmPassword': 'Confirm password',
    'auth.resetPassword.confirmPasswordPlaceholder': 'Confirm your new password',
    'auth.resetPassword.submit': 'Reset password',
    'auth.resetPassword.submitting': 'Resetting...',
    'auth.resetPassword.requestNewCode': 'Request a new code',
    'auth.resetPassword.backToHome': 'Back to sign in',
    'auth.resetPassword.success': 'Password reset',
    'auth.resetPassword.successDescription': 'You can now sign in with your new password',
    'auth.resetPassword.error': 'Error resetting password',
    'auth.resetPassword.invalidCode': 'Invalid code',
    'auth.resetPassword.invalidCodeDescription': 'The code you entered is incorrect',
    'auth.resetPassword.expiredCode': 'Code expired',
    'auth.resetPassword.expiredCodeDescription': 'Please request a new code',
    'auth.register.passwordMismatch': 'Passwords do not match',
    'auth.register.passwordRequirements.minLength': 'Minimum 14 characters',
    'auth.register.passwordRequirements.lowercase': 'One lowercase letter',
    'auth.register.passwordRequirements.uppercase': 'One uppercase letter',
    'auth.register.passwordRequirements.number': 'One number',
    'auth.register.passwordRequirements.special': 'One special character',
  },
  es: {
    'common.error': 'Error',
    'nav.dashboard': 'Administración',
    'auth.login.title': 'Administración de Tsuru',
    'auth.login.subtitle': 'Inicia sesión con tu cuenta de administración de la plataforma',
    'auth.login.email': 'Email',
    'auth.login.emailPlaceholder': 'tu@email.com',
    'auth.login.password': 'Contraseña',
    'auth.login.passwordPlaceholder': 'Ingresa tu contraseña',
    'auth.login.submit': 'Iniciar sesión',
    'auth.login.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.login.success': 'Inicio de sesión exitoso',
    'auth.login.successDescription': 'La consola administrativa está lista',
    'auth.login.error': 'Error de inicio de sesión',
    'auth.forgotPassword.title': '¿Olvidaste tu contraseña?',
    'auth.forgotPassword.subtitle': 'Ingresa tu email y te enviaremos un código de recuperación',
    'auth.forgotPassword.email': 'Email',
    'auth.forgotPassword.emailPlaceholder': 'tu@email.com',
    'auth.forgotPassword.submit': 'Enviar código',
    'auth.forgotPassword.submitting': 'Enviando...',
    'auth.forgotPassword.backToLogin': 'Volver a iniciar sesión',
    'auth.forgotPassword.success': 'Código enviado',
    'auth.forgotPassword.successDescription': 'Revisa tu email para el código de recuperación',
    'auth.forgotPassword.error': 'Error al enviar código',
    'auth.forgotPassword.checkEmail.title': 'Revisa tu email',
    'auth.forgotPassword.checkEmail.subtitle': 'Hemos enviado un código de recuperación a',
    'auth.forgotPassword.checkEmail.enterCode': 'Ingresar código',
    'auth.forgotPassword.checkEmail.differentEmail': 'Usar otro email',
    'auth.resetPassword.title': 'Restablecer contraseña',
    'auth.resetPassword.subtitle': 'Ingresa el código de tu email y tu nueva contraseña',
    'auth.resetPassword.email': 'Email',
    'auth.resetPassword.emailPlaceholder': 'tu@email.com',
    'auth.resetPassword.code': 'Código de recuperación',
    'auth.resetPassword.codePlaceholder': 'Ingresa el código de 6 dígitos',
    'auth.resetPassword.newPassword': 'Nueva contraseña',
    'auth.resetPassword.newPasswordPlaceholder': 'Ingresa tu nueva contraseña',
    'auth.resetPassword.confirmPassword': 'Confirmar contraseña',
    'auth.resetPassword.confirmPasswordPlaceholder': 'Confirma tu nueva contraseña',
    'auth.resetPassword.submit': 'Restablecer contraseña',
    'auth.resetPassword.submitting': 'Restableciendo...',
    'auth.resetPassword.requestNewCode': 'Solicitar un nuevo código',
    'auth.resetPassword.backToHome': 'Volver a iniciar sesión',
    'auth.resetPassword.success': 'Contraseña restablecida',
    'auth.resetPassword.successDescription': 'Ya puedes iniciar sesión con tu nueva contraseña',
    'auth.resetPassword.error': 'Error al restablecer contraseña',
    'auth.resetPassword.invalidCode': 'Código inválido',
    'auth.resetPassword.invalidCodeDescription': 'El código ingresado es incorrecto',
    'auth.resetPassword.expiredCode': 'Código expirado',
    'auth.resetPassword.expiredCodeDescription': 'Solicita un nuevo código',
    'auth.register.passwordMismatch': 'Las contraseñas no coinciden',
    'auth.register.passwordRequirements.minLength': 'Mínimo 14 caracteres',
    'auth.register.passwordRequirements.lowercase': 'Una letra minúscula',
    'auth.register.passwordRequirements.uppercase': 'Una letra mayúscula',
    'auth.register.passwordRequirements.number': 'Un número',
    'auth.register.passwordRequirements.special': 'Un carácter especial',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('admin-language');
    if (saved === 'en' || saved === 'es') return saved;
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem('admin-language', nextLanguage);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let translated = translations[language][key] || key;
    for (const [name, value] of Object.entries(params || {})) {
      translated = translated.split(`{${name}}`).join(value);
    }
    return translated;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>
    {children}
  </LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
