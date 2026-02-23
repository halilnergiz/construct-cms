import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FolderKanban, Loader2, KeyRound, Check, X } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const PASSWORD_RULES = [
  { key: 'length', label: 'En az 8 karakter', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'Bir büyük harf (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Bir küçük harf (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Bir rakam (0-9)', test: (p: string) => /[0-9]/.test(p) },
];

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const ruleResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );

  const allRulesPassed = ruleResults.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Şifre gereksinimleri karşılanmıyor');
      return;
    }

    if (!passwordsMatch) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre belirlenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
            <FolderKanban className="h-7 w-7 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Şifre Belirle</h1>
          <p className="text-center text-sm text-slate-500">
            Hesabınız için yeni bir şifre oluşturun
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email-display" className="mb-1.5 block text-sm font-medium text-slate-700">
              E-posta
            </label>
            <input
              id="email-display"
              type="email"
              value={user.email ?? ''}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Yeni Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Güçlü bir şifre girin"
            />
          </div>

          {password.length > 0 && (
            <ul className="space-y-1.5">
              {ruleResults.map((rule) => (
                <li key={rule.key} className="flex items-center gap-2 text-xs">
                  {rule.passed ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  )}
                  <span className={rule.passed ? 'text-emerald-600' : 'text-slate-400'}>
                    {rule.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Şifre Tekrar
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Şifrenizi tekrar girin"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-500">Şifreler eşleşmiyor</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allRulesPassed || !passwordsMatch}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Şifreyi Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
