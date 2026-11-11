import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, FileText, Loader2, Mail, MapPin, Phone, ShieldCheck, UploadCloud, X } from 'lucide-react';
import apiClient from '../api/client';

const initialForm = { nom: '', prenom: '', email: '', telephone: '', whatsapp: true, linkedin: '', portfolio: '', message: '' };
const MAX_CV_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = /\.(pdf|doc|docx)$/i;
const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100';
const labelClass = 'block text-sm font-semibold text-slate-700';

function validate(form, cvFile) {
  if (!form.nom.trim()) return 'Le nom est obligatoire.';
  if (!form.prenom.trim()) return 'Le prénom est obligatoire.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Veuillez saisir une adresse email valide.';
  if (!/^[+\d\s().-]{8,20}$/.test(form.telephone.trim())) return 'Veuillez saisir un numéro de téléphone valide.';
  for (const key of ['linkedin', 'portfolio']) {
    if (form[key].trim()) {
      try {
        const url = new URL(form[key].trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid');
      } catch {
        return `Le lien ${key === 'linkedin' ? 'LinkedIn' : 'du portfolio'} doit commencer par https:// ou http://.`;
      }
    }
  }
  if (!cvFile) return 'Veuillez joindre votre CV.';
  if (!ACCEPTED_EXTENSIONS.test(cvFile.name)) return 'Le CV doit être au format PDF, DOC ou DOCX.';
  if (cvFile.size > MAX_CV_SIZE) return 'Le CV ne doit pas dépasser 5 Mo.';
  return null;
}

export default function CondidatForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [cvFile, setCvFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setJobLoading(true);
    setJob(null);
    setJobError('');
    apiClient.get(`/offers/${id}`)
      .then(({ data }) => { if (!cancelled) setJob(data); })
      .catch(() => { if (!cancelled) setJobError("Impossible de charger cette offre. Vérifiez qu'elle est toujours disponible."); })
      .finally(() => { if (!cancelled) setJobLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  }

  function handleCvChange(event) {
    const file = event.target.files?.[0] || null;
    if (file && (!ACCEPTED_EXTENSIONS.test(file.name) || file.size > MAX_CV_SIZE)) {
      setCvFile(null);
      setError('Choisissez un CV PDF, DOC ou DOCX de 5 Mo maximum.');
    } else {
      setCvFile(file);
      setError('');
    }
    event.target.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || jobLoading || jobError || !job || (job.status && job.status !== 'published')) return;
    const validationError = validate(form, cvFile);
    if (validationError) { setError(validationError); return; }
    setSubmitting(true);
    setError('');
    try {
      const data = new FormData();
      data.append('job_id', id);
      for (const [key, value] of Object.entries(form)) data.append(key, typeof value === 'boolean' ? String(value) : value.trim());
      data.append('cv', cvFile);
      await apiClient.post('/candidate/applications', data);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7ff] px-5 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-xl shadow-violet-100/60 sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-11 w-11" /></div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">Candidature envoyée !</h1>
        <p className="mt-4 leading-7 text-slate-600">Votre candidature {job?.title ? <>pour <strong>{job.title}</strong></> : ''} a bien été transmise au recruteur.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-200 transition hover:from-indigo-700 hover:to-violet-800">Retour aux offres <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );

  const unavailable = !jobLoading && (Boolean(jobError) || !job || (job.status && job.status !== 'published'));

  return (
    <div className="min-h-screen bg-[#f7f7ff] text-slate-900">
      <header className="border-b border-violet-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3 font-extrabold tracking-tight text-slate-950"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-violet-200"><BriefcaseBusiness className="h-5 w-5" /></span><span>Khadma <span className="text-violet-700">Plus</span></span></Link>
          <Link to={`/job-details/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" /> Retour à l'offre</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start lg:py-14">
        <div className="min-w-0 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">
          <div className="bg-gradient-to-r from-[#090f30] via-[#17134c] to-[#40169b] px-6 py-9 text-white sm:px-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-100"><BriefcaseBusiness className="h-3.5 w-3.5" /> Votre prochaine étape</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Postuler à cette offre</h1>
            {jobLoading ? <p className="mt-3 text-sm text-violet-200">Chargement de l'offre...</p> : job ? <p className="mt-3 text-violet-100">{job.title} <span className="text-violet-300">• {job.company}</span></p> : <p className="mt-3 text-violet-200">Vérification de l'offre indisponible</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-10" noValidate>
            {unavailable && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{jobError || (!job ? 'Offre introuvable.' : "Cette offre n'est plus ouverte aux candidatures.")}</div>}
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

            <section>
              <h2 className="mb-5 text-lg font-bold text-slate-950">Informations personnelles</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Nom <span className="text-violet-600">*</span><input className={fieldClass} autoComplete="family-name" name="nom" value={form.nom} onChange={handleChange} placeholder="Votre nom" required /></label>
                <label className={labelClass}>Prénom <span className="text-violet-600">*</span><input className={fieldClass} autoComplete="given-name" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Votre prénom" required /></label>
                <label className={`${labelClass} sm:col-span-2`}>Adresse email <span className="text-violet-600">*</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-slate-400" /><input className={`${fieldClass} pl-11`} type="email" autoComplete="email" name="email" value={form.email} onChange={handleChange} placeholder="vous@exemple.com" required /></div></label>
                <div className="sm:col-span-2"><label htmlFor="candidate-phone" className={labelClass}>Téléphone <span className="text-violet-600">*</span></label><div className="relative"><Phone className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-slate-400" /><input id="candidate-phone" className={`${fieldClass} pl-11`} type="tel" autoComplete="tel" name="telephone" value={form.telephone} onChange={handleChange} placeholder="+212 6 00 00 00 00" required /></div><label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="whatsapp" checked={form.whatsapp} onChange={handleChange} className="h-4 w-4 accent-violet-600" /> J'utilise ce numéro sur WhatsApp</label></div>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <h2 className="mb-5 text-lg font-bold text-slate-950">CV et liens professionnels</h2>
              <span className={labelClass}>Votre CV <span className="text-violet-600">*</span></span>
              {cvFile ? <div className="mt-2 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4"><FileText className="h-6 w-6 shrink-0 text-violet-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{cvFile.name}</p><p className="text-xs text-slate-500">{(cvFile.size / 1024 / 1024).toFixed(2)} Mo</p></div><button type="button" onClick={() => setCvFile(null)} aria-label="Retirer le CV" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600"><X className="h-5 w-5" /></button></div> : <label className="mt-2 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 px-5 py-8 text-center transition hover:border-violet-500 hover:bg-violet-50"><UploadCloud className="h-9 w-9 text-violet-600" /><span className="mt-3 text-sm font-bold text-slate-800">Cliquez pour ajouter votre CV</span><span className="mt-1 text-xs text-slate-500">PDF, DOC ou DOCX • 5 Mo maximum</span><input type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} className="sr-only" /></label>}
              <div className="mt-6 grid gap-5"><label className={labelClass}>Profil LinkedIn <span className="font-normal text-slate-400">(facultatif)</span><input className={fieldClass} type="url" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://www.linkedin.com/in/..." /></label><label className={labelClass}>Portfolio <span className="font-normal text-slate-400">(facultatif)</span><input className={fieldClass} type="url" name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://votre-portfolio.com" /></label></div>
            </section>

            <section className="border-t border-slate-100 pt-7"><label className={labelClass}>Votre message au recruteur <span className="font-normal text-slate-400">(facultatif)</span><textarea className={`${fieldClass} min-h-32 resize-y`} name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Présentez-vous en quelques lignes et expliquez votre motivation..." /></label></section>
            <button type="submit" disabled={submitting || jobLoading || unavailable} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-indigo-700 hover:to-violet-800 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Envoi en cours...</> : <>Envoyer ma candidature <ArrowRight className="h-5 w-5" /></>}</button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-violet-600" /> Vos informations sont transmises au recruteur.</p>
          </form>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-8"><div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold text-slate-950">L'offre en bref</h2>{jobLoading ? <p className="mt-4 text-sm text-slate-500">Chargement...</p> : job ? <div className="mt-5 space-y-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Poste</p><p className="mt-1 font-bold text-slate-900">{job.title}</p></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Entreprise</p><p className="mt-1 font-semibold text-slate-700">{job.company}</p></div><div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-violet-600" /> {job.location || 'Non précisée'}</div><div className="flex items-center gap-2 text-sm text-slate-600"><BriefcaseBusiness className="h-4 w-4 text-violet-600" /> {job.contract || 'Non précisé'}</div></div> : <p className="mt-4 text-sm text-slate-500">Offre indisponible.</p>}</div><div className="rounded-3xl border border-violet-100 bg-violet-50 p-6"><div className="flex items-center gap-2 font-bold text-violet-900"><CheckCircle2 className="h-5 w-5" /> Avant d'envoyer</div><p className="mt-3 text-sm leading-6 text-violet-900/80">Vérifiez vos coordonnées, votre CV et vos liens professionnels pour présenter une candidature complète.</p></div></aside>
      </main>
    </div>
  );
}
