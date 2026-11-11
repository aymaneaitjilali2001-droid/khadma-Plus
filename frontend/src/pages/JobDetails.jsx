import { Link, useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays,
  MapPin, Building2, Sparkles, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';

function formatDate(value) {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Non renseignée'
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function JobDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7ff] px-4 py-10 animate-pulse" aria-label="Chargement de l'offre" role="status">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="h-64 bg-slate-200" />
        <div className="grid gap-8 p-8 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="h-7 w-1/2 rounded-lg bg-slate-200" />
            <div className="h-4 rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
          </div>
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-4 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">{children || 'Non renseigné'}</p>
      </div>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const { data: job, error, isLoading } = useSWR(id ? `/offers/${encodeURIComponent(id)}` : null, fetcher);

  if (isLoading) return <JobDetailsSkeleton />;

  if (error || !job) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f7ff] px-5 text-center">
        <span className="rounded-2xl bg-red-50 p-4 text-red-600"><AlertCircle className="h-8 w-8" /></span>
        <h1 className="text-2xl font-bold text-slate-950">Offre indisponible</h1>
        <p className="max-w-md text-sm text-slate-600">Impossible d'afficher cette offre pour le moment. Vérifiez le lien ou réessayez plus tard.</p>
        <Link to="/#offers" className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800">
          <ArrowLeft className="h-4 w-4" /> Retour aux offres
        </Link>
      </main>
    );
  }

  const isPublished = job.status === 'published';
  const isManager = user?.role === 'manager';
  const tags = Array.isArray(job.tags) ? job.tags : [];

  function apply() {
    if (!isPublished || authLoading || isManager) return;
    // Conserver l'orthographe de la route déjà utilisée dans le projet.
    const destination = `/condidat-form/${job.id}`;
    navigate(user ? destination : '/login', {
      state: user ? undefined : { from: destination },
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f7ff] text-slate-900">
      <header className="border-b border-violet-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold tracking-tight text-slate-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-violet-200">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <span>Khadma <span className="text-violet-700">Plus</span></span>
          </Link>
          <Link to="/#offers" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Retour aux offres</span><span className="sm:hidden">Retour</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">
          <section className="relative overflow-hidden bg-gradient-to-br from-[#080d2b] via-[#15104a] to-[#4912a2] px-6 py-10 text-white sm:px-10 sm:py-14">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100">
                <Sparkles className="h-4 w-4" /> Opportunité professionnelle
              </span>
              <h1 className="mt-6 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {job.title || 'Offre d’emploi'}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-lg font-medium text-violet-100">
                <Building2 className="h-5 w-5 shrink-0" /> {job.company || 'Entreprise non renseignée'}
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
                  <MapPin className="h-4 w-4" /> {job.location || 'Localisation non renseignée'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
                  <BriefcaseBusiness className="h-4 w-4" /> {job.contract || 'Contrat non renseigné'}
                </span>
                <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${isPublished ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'}`}>
                  {isPublished ? 'Offre publiée' : 'Offre non publiée'}
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,2fr)_minmax(290px,1fr)]">
            <div className="space-y-10 p-6 sm:p-10">
              <section aria-labelledby="job-description">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-8 w-1 rounded-full bg-violet-600" />
                  <h2 id="job-description" className="text-2xl font-bold tracking-tight text-slate-950">Description du poste</h2>
                </div>
                <p className="whitespace-pre-line break-words text-base leading-8 text-slate-600">
                  {job.description || 'Aucune description fournie pour cette offre.'}
                </p>
              </section>

              {tags.length > 0 && (
                <section aria-labelledby="job-skills">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full bg-violet-600" />
                    <h2 id="job-skills" className="text-2xl font-bold tracking-tight text-slate-950">Compétences recherchées</h2>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag, index) => (
                      <span key={`${tag}-${index}`} className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="border-t border-violet-100 bg-[#fbfaff] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm lg:sticky lg:top-6">
                <h2 className="text-xl font-bold text-slate-950">Aperçu de l'offre</h2>
                <p className="mt-1 text-sm text-slate-500">Informations essentielles</p>
                <div className="mt-5">
                  <DetailRow icon={BriefcaseBusiness} label="Type de contrat">{job.contract}</DetailRow>
                  <DetailRow icon={MapPin} label="Localisation">{job.location}</DetailRow>
                  <DetailRow icon={CalendarDays} label="Date de publication">{formatDate(job.created_at)}</DetailRow>
                </div>
                <Button
                  type="button"
                  onClick={apply}
                  disabled={authLoading || !isPublished || isManager}
                  className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 font-bold text-white shadow-lg shadow-violet-200 hover:from-indigo-700 hover:to-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {authLoading
                    ? 'Chargement...'
                    : isManager
                      ? 'Réservé aux candidats'
                      : isPublished
                        ? 'Postuler maintenant'
                        : 'Candidature indisponible'}
                  {isPublished && !isManager && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  {isManager
                    ? 'Les comptes recruteur peuvent consulter les offres, mais ne peuvent pas déposer de candidature.'
                    : 'Connectez-vous avec un compte candidat pour accéder au formulaire de candidature.'}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
