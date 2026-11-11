import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import {
  Activity, ArrowLeft, BriefcaseBusiness, CheckCircle2, ChevronRight,
  ClipboardList, FileText, LayoutDashboard, LogOut, Menu, Plus,
  Search, Sparkles, Users, X, MapPin, Pencil, Eye, LoaderCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient, { fetcher } from '../api/client';
import JobForm from './JobForm';
import AIEvaluationModal from '../components/AIEvaluationModal';

const STATUSES = ['Tous', 'Pas encore traité', 'Accepté', 'Refusé'];
const statusClasses = {
  'Accepté': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Refusé': 'bg-rose-50 text-rose-700 ring-rose-200',
  'Pas encore traité': 'bg-amber-50 text-amber-700 ring-amber-200',
};
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
const dateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

function StatusBadge({ status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses[status] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>{status || '—'}</span>;
}
function EmptyState({ children }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">{children}</div>;
}

export default function DashboardRH() {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [filtreJob, setFiltreJob] = useState(null);
  const [jobView, setJobView] = useState('list');
  const [selectedJob, setSelectedJob] = useState(null);
  const [aiEvaluating, setAiEvaluating] = useState(new Set());
  const [aiResult, setAiResult] = useState(null);
  const [busyStatuses, setBusyStatuses] = useState(new Set());
  const [notice, setNotice] = useState('');

  const { data: jobsData, error: jobsError, isLoading: jobsLoading, mutate: mutateJobs } = useSWR('/offers/mine', fetcher);
  const { data: appsData, error: appsError, isLoading: appsLoading, mutate: mutateCandidatures } = useSWR('/manager/applications', fetcher);
  const jobs = Array.isArray(jobsData) ? jobsData : [];
  const candidatures = Array.isArray(appsData) ? appsData : [];
  const filteredJobs = useMemo(() => jobs.filter((job) => normalize([job.title, job.company, job.location, job.contract].join(' ')).includes(normalize(searchTerm.trim()))), [jobs, searchTerm]);
  const filteredCandidatures = useMemo(() => candidatures.filter((c) => {
    const text = normalize([c.prenom, c.nom, c.email, c.job_title, c.job_company].join(' '));
    return text.includes(normalize(searchTerm.trim())) && (filtreStatut === 'Tous' || c.statut === filtreStatut) && (!filtreJob || String(c.job_id) === String(filtreJob.id));
  }), [candidatures, searchTerm, filtreStatut, filtreJob]);
  const pending = candidatures.filter((c) => c.statut === 'Pas encore traité').length;
  const accepted = candidatures.filter((c) => c.statut === 'Accepté').length;
  const published = jobs.filter((j) => j.status === 'published').length;
  const firstName = String(user?.full_name || 'Recruteur').split(' ')[0];

  function switchMenu(menu) {
    setActiveMenu(menu);
    setMobileMenu(false);
    setSearchTerm('');
    setNotice('');
    if (menu === 'offres') setJobView('list');
    if (menu === 'candidats') setFiltreJob(null);
  }
  async function handleStatutChange(applicationId, statut) {
    setNotice('');
    setBusyStatuses((prev) => new Set(prev).add(applicationId));
    const oldData = candidatures;
    await mutateCandidatures(oldData.map((c) => c.id === applicationId ? { ...c, statut } : c), { revalidate: false });
    try {
      await apiClient.patch(`/manager/applications/${applicationId}/statut`, { statut });
      await mutateCandidatures();
    } catch (err) {
      await mutateCandidatures(oldData, { revalidate: false });
      setNotice(err.response?.data?.error || 'Impossible de modifier le statut. Réessayez.');
    } finally {
      setBusyStatuses((prev) => { const next = new Set(prev); next.delete(applicationId); return next; });
    }
  }
  function resultFrom(c, data) {
    return { candidateName: `${c.prenom || ''} ${c.nom || ''}`.trim(), jobTitle: c.job_title, score: data.score, accepted: data.accepted, reasons: data.reasons || [], summary: data.summary };
  }
  async function handleEvaluate(c) {
    setNotice('');
    setAiEvaluating((prev) => new Set(prev).add(c.id));
    try {
      const { data } = await apiClient.post(`/manager/applications/${c.id}/evaluate`);
      setAiResult(resultFrom(c, data));
      await mutateCandidatures();
    } catch (err) {
      setNotice(err.response?.data?.error || "Erreur lors de l'analyse IA.");
    } finally {
      setAiEvaluating((prev) => { const next = new Set(prev); next.delete(c.id); return next; });
    }
  }
  const navItems = [
    { id: 'dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'offres', label: "Offres d’emploi", icon: BriefcaseBusiness },
    { id: 'candidats', label: 'Candidatures', icon: Users },
  ];
  const nav = <>
    <Link to="/" className="flex items-center gap-3 px-5 py-6 text-white">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-violet-900/30"><BriefcaseBusiness size={23} /></span>
      <span className="text-xl font-extrabold tracking-tight">Khadma <span className="text-violet-300">Plus</span></span>
    </Link>
    <div className="px-4 pt-7"><p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[.2em] text-slate-500">Espace recruteur</p>
      <nav className="space-y-2" aria-label="Navigation du dashboard">{navItems.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" onClick={() => switchMenu(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeMenu === id ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={19} />{label}<ChevronRight size={15} className="ml-auto opacity-60" /></button>
      ))}</nav>
    </div>
    <div className="mt-auto border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/30 font-bold text-violet-100">{initials(user?.full_name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user?.full_name || 'Recruteur'}</p><p className="text-xs text-slate-400">Recruteur</p></div><button type="button" aria-label="Déconnexion" title="Déconnexion" onClick={logout} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><LogOut size={18} /></button></div></div>
  </>;

  return <div className="min-h-screen bg-[#f5f6fc] font-sans text-slate-900 md:flex">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#080e29] md:flex">{nav}</aside>
    {mobileMenu && <div className="fixed inset-0 z-50 md:hidden"><button className="absolute inset-0 bg-slate-950/60" aria-label="Fermer le menu" onClick={() => setMobileMenu(false)} /><aside className="relative flex h-full w-72 flex-col bg-[#080e29]">{nav}<button onClick={() => setMobileMenu(false)} className="absolute right-3 top-3 rounded-lg p-2 text-white" aria-label="Fermer"><X size={20}/></button></aside></div>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileMenu(true)} className="rounded-lg p-2 text-slate-700 md:hidden" aria-label="Ouvrir le menu"><Menu size={23}/></button><div><p className="text-xs font-medium text-slate-400">Khadma Plus / Recrutement</p><p className="text-sm font-bold text-slate-800">{navItems.find((n) => n.id === activeMenu)?.label}</p></div></div>
        <div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex"><span className="mr-2 h-2 w-2 rounded-full bg-emerald-500"/>Espace RH</span><span className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">{initials(user?.full_name)}</span></div>
      </header>
      <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-8 sm:py-9">
        {notice && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{notice}<button onClick={() => setNotice('')} aria-label="Fermer l'alerte"><X size={17}/></button></div>}
        {activeMenu === 'dashboard' && <>
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#111a4c] via-[#28206a] to-[#5a28b8] p-7 text-white shadow-xl shadow-violet-200/60 sm:p-9"><div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5"/><div className="relative"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100"><Sparkles size={14}/> Votre espace de recrutement</div><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Bonjour {firstName} 👋</h1><p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">Suivez vos offres, consultez les candidatures et avancez dans vos recrutements depuis un seul espace.</p><button type="button" onClick={() => { setActiveMenu('offres'); setJobView('create'); }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50"><Plus size={17}/> Créer une offre</button></div></section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistiques de recrutement">{[
            { label: 'Offres publiées', value: published, icon: BriefcaseBusiness, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Candidatures reçues', value: candidatures.length, icon: Users, color: 'bg-violet-50 text-violet-600' },
            { label: 'À traiter', value: pending, icon: ClipboardList, color: 'bg-amber-50 text-amber-600' },
            { label: 'Acceptées', value: accepted, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`rounded-xl p-2.5 ${color}`}><Icon size={20}/></span></div><p className="mt-3 text-3xl font-extrabold tracking-tight">{jobsLoading || appsLoading ? '…' : value}</p></div>)}</section>
          {(jobsError || appsError) && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Certaines statistiques n’ont pas pu être chargées.</div>}
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold">Candidatures récentes</h2><p className="mt-1 text-xs text-slate-500">Dernières candidatures reçues</p></div><button onClick={() => switchMenu('candidats')} className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:underline">Tout consulter <ChevronRight size={16}/></button></div>{appsLoading ? <p className="p-8 text-sm text-slate-500">Chargement…</p> : appsError ? <p className="p-8 text-sm text-rose-600">Impossible de charger les candidatures.</p> : candidatures.length === 0 ? <p className="p-8 text-sm text-slate-500">Aucune candidature pour le moment.</p> : <div className="divide-y divide-slate-100">{[...candidatures].sort((a,b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0)).slice(0,5).map((c) => <div key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">{initials(`${c.prenom || ''} ${c.nom || ''}`)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{c.prenom} {c.nom}</p><p className="truncate text-xs text-slate-500">{c.job_title} · {c.job_company}</p></div><StatusBadge status={c.statut}/><span className="hidden text-xs text-slate-400 sm:block">{dateLabel(c.applied_at)}</span></div>)}</div>}</section>
        </>}
        {activeMenu === 'offres' && <>
          {jobView === 'list' ? <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600">Gestion des postes</p><h1 className="mt-1 text-2xl font-extrabold">Offres d’emploi</h1><p className="mt-1 text-sm text-slate-500">Gérez vos publications et leurs candidatures.</p></div><button onClick={() => { setSelectedJob(null); setJobView('create'); }} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"><Plus size={18}/> Créer une offre</button></div>
            <div className="relative"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input aria-label="Rechercher une offre" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un poste, une entreprise, une ville…" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></div>
            {jobsLoading ? <EmptyState>Chargement des offres…</EmptyState> : jobsError ? <EmptyState>Impossible de charger les offres. Réessayez plus tard.</EmptyState> : filteredJobs.length === 0 ? <EmptyState>Aucune offre trouvée.</EmptyState> : <div className="grid gap-4 lg:grid-cols-2">{filteredJobs.map((job) => <article key={job.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 font-bold text-white">{initials(job.company).slice(0,1)}</span><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{job.title}</h2><p className="mt-1 text-sm text-slate-500">{job.company}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{job.contract || '—'}</span></div><p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} className="text-violet-600"/>{job.location || 'Non précisé'}</p><div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button onClick={() => { setActiveMenu('candidats'); setFiltreJob({ id: job.id, title: job.title }); setFiltreStatut('Tous'); setSearchTerm(''); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-violet-700"><Eye size={16}/> Candidatures</button><button onClick={() => { setSelectedJob(job); setJobView('edit'); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil size={15}/> Modifier</button></div></article>)}</div>}</> : <><button onClick={() => { setJobView('list'); setSelectedJob(null); }} className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:underline"><ArrowLeft size={17}/> Retour aux offres</button><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"><h1 className="mb-5 text-xl font-bold">{jobView === 'create' ? 'Créer une offre' : 'Modifier une offre'}</h1><JobForm initialData={jobView === 'edit' ? selectedJob : undefined} onCancel={() => { setJobView('list'); setSelectedJob(null); }} onSubmitSuccess={async () => { await mutateJobs(); setJobView('list'); setSelectedJob(null); }}/></div></>}
        </>}
        {activeMenu === 'candidats' && <><div><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600">Gestion des talents</p><h1 className="mt-1 text-2xl font-extrabold">Suivi des candidatures</h1><p className="mt-1 text-sm text-slate-500">Consultez les profils et gérez les étapes du recrutement.</p></div>
          {filtreJob && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-700">Offre : <strong>{filtreJob.title}</strong><button onClick={() => setFiltreJob(null)} className="ml-auto inline-flex items-center gap-1 font-semibold hover:underline"><X size={15}/> Retirer le filtre</button></div>}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between"><div className="relative w-full xl:max-w-sm"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input aria-label="Rechercher un candidat" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nom, email, poste, entreprise…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></div><div className="flex flex-wrap gap-2">{STATUSES.map((status) => <button key={status} onClick={() => setFiltreStatut(status)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${filtreStatut === status ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{status}</button>)}</div></div>
          {appsLoading ? <p className="p-8 text-sm text-slate-500">Chargement des candidatures…</p> : appsError ? <p className="p-8 text-sm text-rose-600">Impossible de charger les candidatures.</p> : filteredCandidatures.length === 0 ? <p className="p-8 text-sm text-slate-500">Aucune candidature ne correspond à ces critères.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{['Candidat','Poste visé','Date','CV','Analyse IA','Statut'].map((h) => <th key={h} className="px-5 py-4 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredCandidatures.map((c) => <tr key={c.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">{initials(`${c.prenom || ''} ${c.nom || ''}`)}</span><div className="min-w-0"><p className="font-bold">{c.prenom} {c.nom}</p><p className="max-w-[180px] truncate text-xs text-slate-500">{c.email}</p></div></div></td><td className="px-5 py-4"><p className="font-semibold">{c.job_title}</p><p className="text-xs text-slate-500">{c.job_company}</p></td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateLabel(c.applied_at)}</td><td className="px-5 py-4">{c.resume_path ? <a href={`${(apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')}${c.resume_path.startsWith('/') ? '' : '/'}${c.resume_path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-violet-700 hover:underline"><FileText size={16}/> Voir le CV</a> : <span className="text-slate-400">—</span>}</td><td className="px-5 py-4">{aiEvaluating.has(c.id) ? <span className="inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle size={15} className="animate-spin"/> Analyse…</span> : c.ai_score != null ? <button onClick={() => setAiResult(resultFrom(c, { score: c.ai_score, accepted: c.ai_decision, reasons: c.ai_reasons, summary: c.ai_summary }))} className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100"><Activity size={15}/> Score {c.ai_score}/100</button> : c.resume_path?.toLowerCase().split('?')[0].endsWith('.pdf') ? <button onClick={() => handleEvaluate(c)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Sparkles size={15}/> Analyser avec l’IA</button> : <span className="text-xs text-slate-400">CV PDF requis</span>}</td><td className="px-5 py-4"><select aria-label={`Statut de ${c.prenom} ${c.nom}`} value={c.statut || 'Pas encore traité'} disabled={busyStatuses.has(c.id)} onChange={(e) => handleStatutChange(c.id, e.target.value)} className={`max-w-[175px] cursor-pointer rounded-full border-0 px-3 py-2 text-xs font-bold outline-none ring-1 disabled:opacity-50 ${statusClasses[c.statut] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>{STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>}</div>
        </>}
      </main>
    </div>
    <AIEvaluationModal result={aiResult} onClose={() => setAiResult(null)}/>
  </div>;
}
