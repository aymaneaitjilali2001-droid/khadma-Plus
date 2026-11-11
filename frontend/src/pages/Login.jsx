import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailIsValid = emailPattern.test(email);

  function validateForm() {
    if (!email.trim()) return "L’email est obligatoire";
    if (!emailPattern.test(email)) return "Format d’email invalide";
    if (!password) return 'Le mot de passe est obligatoire';
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f3ff] p-3 sm:p-5 lg:p-7">
      <div className="pointer-events-none absolute -left-24 -top-40 h-[34rem] w-[34rem] rounded-full bg-white/80 blur-2xl" />
      <div className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-violet-300/35 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[2.75rem] border border-white/80 bg-white/45 shadow-[0_24px_80px_rgba(91,33,182,0.12)] backdrop-blur-sm lg:grid-cols-[46%_54%]">
        <section className="hidden p-8 lg:flex lg:flex-col xl:p-12">
          <Link to="/" className="inline-flex w-fit items-center gap-4 text-2xl font-bold tracking-tight text-slate-950">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-xl shadow-violet-300/60">
              <BriefcaseBusiness className="h-7 w-7" />
            </span>
            <span>Khadma <span className="text-violet-700">Plus</span></span>
          </Link>

          <div className="mt-9 overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-indigo-200/70 ring-1 ring-white">
            <img
              src="/login-hero.png"
              alt="Recrutement intelligent Khadma Plus"
              className="aspect-[16/9] h-full w-full object-cover"
            />
          </div>

          <div className="mt-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-violet-700 shadow-sm">
              <Sparkles className="h-4 w-4" /> Votre prochaine étape
            </div>
            <h2 className="!text-slate-950 mt-5 max-w-xl text-3xl font-bold leading-tight xl:text-4xl">
              Donnez de l’élan à votre <span className="text-violet-700">avenir professionnel.</span>
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Retrouvez des opportunités adaptées à vos compétences et avancez avec confiance.
            </p>

            <div className="mt-6 space-y-3 border-l-2 border-violet-500 pl-5 text-sm font-medium text-slate-800">
              {['Des offres sélectionnées', 'Une candidature simple', 'Une analyse intelligente des profils'].map((item) => (
                <p key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 fill-violet-600 text-white" /> {item}
                </p>
              ))}
            </div>
          </div>

          <p className="mt-auto flex items-center gap-3 pt-8 text-sm italic text-slate-600">
            <Target className="h-5 w-5 text-violet-700" />
            La plateforme qui rapproche les talents des bonnes opportunités.
          </p>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden rounded-[2.75rem] border border-violet-100 bg-white p-6 sm:p-10 lg:p-14 xl:p-20">
          <div className="pointer-events-none absolute -bottom-44 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-100 to-violet-500/70" />
          <div className="relative z-10 w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3 text-xl font-bold text-slate-950">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                Khadma <span className="text-violet-700">Plus</span>
              </Link>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-bold uppercase tracking-wide text-violet-700 transition hover:bg-violet-100">
              <ArrowLeft className="h-4 w-4" /> Bon retour
            </Link>

            <div className="mb-9 mt-7">
              <h1 className="!text-slate-950 text-5xl font-bold tracking-tight sm:text-6xl">Connexion</h1>
              <p className="mt-4 text-base leading-7 text-slate-500">
                Connectez-vous pour retrouver vos offres et vos candidatures.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="block">
                <span className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Mail className="h-5 w-5 text-violet-700" /> Email
                </span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="user@example.com"
                    autoComplete="email"
                    className="h-16 w-full rounded-2xl border border-violet-200 bg-violet-50/40 pl-12 pr-14 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                  {emailIsValid && (
                    <span className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </label>

              <label className="block">
                <span className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <LockKeyhole className="h-5 w-5 text-violet-700" /> Mot de passe
                </span>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    className="h-16 w-full rounded-2xl border border-violet-200 bg-violet-50/40 pl-12 pr-14 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-slate-400 transition hover:bg-violet-100 hover:text-violet-700"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-3 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-5 w-5 rounded-md border-violet-300 accent-violet-600"
                  />
                  Se souvenir de moi
                </label>
                <span className="font-semibold text-violet-700">Mot de passe oublié ?</span>
              </div>

              <button
                disabled={loading}
                className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-base font-bold text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-bold text-violet-700 hover:text-violet-800 hover:underline">
                S’inscrire
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
