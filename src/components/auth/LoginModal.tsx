import { useState, type FormEvent } from 'react';
import { X, LogIn } from 'lucide-react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-80 bg-[#0f0f17] border border-[#1a1a24] rounded-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563eb]/10 rounded-lg flex items-center justify-center">
              <LockKeyhole size={16} className="text-[#2563eb]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Operator login</h2>
              <p className="text-xs text-[#71717a]">Acoustic Guard Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#71717a] mb-1.5">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              className="w-full bg-[#0a0a0f] border border-[#1a1a24] rounded-lg px-3 py-2 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71717a] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-[#0a0a0f] border border-[#1a1a24] rounded-lg px-3 py-2 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn size={16} />
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}