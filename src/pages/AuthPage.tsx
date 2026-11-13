import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioLines, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToasts } from '../store/toast';

export function AuthPage() {
  const navigate = useNavigate();
  const toast = useToasts((s) => s.push);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || email.split('@')[0] } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setError('Account created, but no session was returned. Try signing in.');
          return;
        }
        toast('Welcome to Pulse', 'success');
        navigate('/');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-accent">
            <AudioLines size={28} strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-2xl font-black tracking-tight">Pulse</div>
            <p className="mt-1 text-sm text-muted">
              Stream the catalog. Save your favourites. Upload your own.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-base p-1">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  mode === m ? 'bg-overlay text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted">Display name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-11 rounded-xl border border-line bg-base px-3.5 text-sm outline-none placeholder:text-faint focus:border-accent"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 rounded-xl border border-line bg-base px-3.5 text-sm outline-none placeholder:text-faint focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="h-11 rounded-xl border border-line bg-base px-3.5 text-sm outline-none placeholder:text-faint focus:border-accent"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-ink transition-colors hover:bg-accent-deep disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-faint">
            Accounts are stored in Supabase. Uploads stay private to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
