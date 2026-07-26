import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (!fullName.trim()) throw new Error('Please enter your full name');
        if (!username.trim()) throw new Error('Please choose a username');
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, username } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          // profile auto-created by trigger; nothing else needed
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg.replace(/^User already registered\.$/, 'An account with this email already exists. Try logging in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left hero */}
        <div className="hidden md:block px-6">
          <div className="flex items-center gap-3 mb-6">
            <Logo size={56} />
            <span className="text-5xl font-extrabold text-accent tracking-tight">Atlas</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Connect with the people and things that matter to you.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Share posts, build your community, follow friends, join groups, message in real time, and never miss a moment.
          </p>
          <ul className="mt-8 space-y-3 text-gray-300">
            {['A personalized feed of posts from friends and groups', 'Real-time messaging and notifications', 'Stories, reactions, comments and more'].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Right form */}
        <div className="atlas-card p-6 sm:p-8 max-w-md w-full mx-auto">
          <div className="md:hidden flex items-center justify-center gap-2 mb-6">
            <Logo size={40} />
            <span className="text-3xl font-extrabold text-accent tracking-tight">Atlas</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Log in to Atlas' : 'Create a new account'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {mode === 'login' ? 'Welcome back. Enter your details to continue.' : "It's quick and easy."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <input
                  className="atlas-input"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <input
                  className="atlas-input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                  required
                />
              </>
            )}
            <input
              className="atlas-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="atlas-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="text-sm text-primary bg-primary/10 rounded-lg px-3 py-2 border border-primary/30">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="atlas-btn-primary w-full py-2.5 text-base">
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>

          <div className="my-5 border-t border-gray-700" />

          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="atlas-btn-secondary w-full"
          >
            {mode === 'login' ? 'Create new account' : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
