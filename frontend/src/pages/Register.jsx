import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const requirements = [
    { label: '8 caractères minimum', valid: password.length >= 8 },
    { label: 'Une lettre majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Un chiffre', valid: /\d/.test(password) },
  ];

  function validateForm() {
    if (fullName.trim().length < 3) return 'Le nom complet doit contenir au moins 3 caractères.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Veuillez saisir une adresse email valide.';
    if (requirements.some((item) => !item.valid)) return 'Le mot de passe ne respecte pas les critères indiqués.';
    if (!['candidate', 'manager'].includes(role)) return 'Type de compte invalide.';
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(fullName.trim(), email.trim().toLowerCase(), password, role);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message;
      setError(typeof message === 'string' ? message : "Impossible de créer votre compte. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080f2b] px-4 py-10 text-slate-900 sm:px-6 lg:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-indigo-600/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-[#111b50] via-indigo-900 to-violet-800 p-12 text-white lg:flex">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 text-xl font-extrabold tracking-tight">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-2xl">K</span>
              Khadma Plus
            </Link>
            <div className="mt-24 max-w-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-100">Votre carrière commence ici</span>
              <h1 className="mt-7 text-4xl font-extrabold leading-tight">Une nouvelle opportunité vous attend.</h1>
              <p className="mt-5 text-base leading-8 text-indigo-100">Rejoignez Khadma Plus pour trouver votre prochain emploi ou rencontrer les talents qui feront grandir votre équipe.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-indigo-100">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" />
            Un compte pour découvrir, postuler et recruter.
          </div>
        </aside>

        <section className="px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
          <div className="mb-8">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">Bienvenue</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Créer un compte</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Complétez vos informations pour rejoindre Khadma Plus.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-slate-700">Nom complet <span className="text-red-500">*</span></label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input id="register-name" autoComplete="name" type="text" required minLength={3} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" className={`${inputClass} pl-12`} />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-slate-700">Adresse email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input id="register-email" autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className={`${inputClass} pl-12`} />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-slate-700">Mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input id="register-password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Créez un mot de passe sécurisé" className={`${inputClass} pl-12 pr-12`} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 hover:text-indigo-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {requirements.map((item) => <span key={item.label} className={`inline-flex items-center gap-1.5 text-xs ${item.valid ? 'text-emerald-700' : 'text-slate-400'}`}><CheckCircle2 className="h-3.5 w-3.5" />{item.label}</span>)}
              </div>
            </div>

            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-slate-700">Je souhaite <span className="text-red-500">*</span></legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { value: 'candidate', label: 'Trouver un emploi', subtitle: 'Compte candidat', Icon: Users },
                  { value: 'manager', label: 'Recruter', subtitle: 'Compte recruteur', Icon: BriefcaseBusiness },
                ].map(({ value, label, subtitle, Icon }) => (
                  <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${role === value ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                    <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${role === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0"><span className="block text-sm font-bold text-slate-800">{label}</span><span className="block text-xs text-slate-500">{subtitle}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Création du compte...' : "Créer mon compte"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="text-center text-sm text-slate-500">Déjà un compte ? <Link to="/login" className="font-bold text-indigo-600 hover:underline">Se connecter</Link></p>
          </form>
        </section>
      </div>
    </main>
  );
}
