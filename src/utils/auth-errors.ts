export function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'E-Mail-Adresse oder Passwort ist nicht korrekt.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  }
  if (normalized.includes('user already registered')) {
    return 'Für diese E-Mail-Adresse gibt es bereits ein Konto.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Das Passwort erfüllt die Mindestlänge von Supabase nicht.';
  }
  if (normalized.includes('rate limit')) {
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
  }
  if (normalized.includes('supabase ist noch nicht konfiguriert')) {
    return message;
  }

  return 'Das hat leider nicht funktioniert. Bitte versuche es erneut.';
}
