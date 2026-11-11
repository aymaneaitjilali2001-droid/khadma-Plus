import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, Building2, CheckCircle2, FileText, Loader2, MapPin, Plus, Save, Tag, X } from 'lucide-react';
import apiClient from '../api/client';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance'];
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100';

function toFormState(initialData) {
  return {
    title: initialData?.title ?? '',
    company: initialData?.company ?? '',
    location: initialData?.location ?? '',
    contract: initialData?.contract ?? 'CDI',
    description: initialData?.description ?? '',
    status: initialData?.status ?? 'draft',
    tags: Array.isArray(initialData?.tags) ? initialData.tags : [],
  };
}

export default function JobForm({ initialData, onCancel, onSubmitSuccess }) {
  const [job, setJob] = useState(() => toFormState(initialData));
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    setJob(toFormState(initialData));
    setTagInput('');
    setError('');
  }, [initialData]);

  const descriptionLength = job.description.trim().length;
  const ready = useMemo(() =>
    job.title.trim().length >= 5 && job.company.trim().length >= 2 &&
    Boolean(job.location.trim()) && descriptionLength >= 20,
    [job.title, job.company, job.location, descriptionLength]);

  function handleChange(event) {
    const { name, value } = event.target;
    setJob(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  function addTags(value) {
    const incoming = value.split(',').map(tag => tag.trim()).filter(Boolean);
    if (!incoming.length) return;
    setJob(prev => ({
      ...prev,
      tags: [...new Map([...prev.tags, ...incoming].map(tag => [tag.toLocaleLowerCase('fr'), tag])).values()],
    }));
    setTagInput('');
  }

  function removeTag(tag) {
    setJob(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }));
  }

  function validate() {
    if (job.title.trim().length < 5) return 'Le titre doit contenir au moins 5 caractères.';
    if (job.company.trim().length < 2) return "Le nom de l’entreprise doit contenir au moins 2 caractères.";
    if (!job.location.trim()) return 'Veuillez saisir la localisation.';
    if (!CONTRACT_TYPES.includes(job.contract)) return 'Veuillez sélectionner un type de contrat valide.';
    if (descriptionLength < 20) return 'La description doit contenir au moins 20 caractères.';
    if (!['draft', 'published'].includes(job.status)) return 'Statut de publication invalide.';
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setSubmitting(true);
    const extraTags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
    const tags = [...new Map([...job.tags, ...extraTags].map(tag => [tag.toLocaleLowerCase('fr'), tag])).values()];
    const payload = {
      title: job.title.trim(), company: job.company.trim(), location: job.location.trim(),
      contract: job.contract, description: job.description.trim(), status: job.status, tags,
    };
    try {
      const { data } = isEditing
        ? await apiClient.put(`/offers/${initialData.id}`, payload)
        : await apiClient.post('/offers', payload);
      const savedOffer = data?.offer ?? data;
      if (!savedOffer || typeof savedOffer !== 'object') throw new Error('Réponse du serveur invalide.');
      onSubmitSuccess?.(savedOffer);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || "Impossible d’enregistrer l’offre.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/40">
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 px-6 py-8 text-white sm:px-9">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-violet-100">
          <BriefcaseBusiness size={15} /> Espace recruteur
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{isEditing ? "Modifier l’offre" : 'Créer une nouvelle offre'}</h1>
        <p className="mt-2 text-sm text-slate-300">Renseignez les informations du poste et choisissez quand le publier.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8 p-5 sm:p-9">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><BriefcaseBusiness size={20} /></div>
            <div><h2 className="font-bold text-slate-900">Informations générales</h2><p className="text-xs text-slate-500">Les détails essentiels de votre annonce</p></div>
          </div>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Titre du poste <span className="text-violet-600">*</span></span>
            <input required minLength={5} name="title" value={job.title} onChange={handleChange} placeholder="Ex. Développeur Full Stack React / Node.js" className={inputClass} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Building2 size={16} /> Entreprise *</span>
              <input required minLength={2} name="company" value={job.company} onChange={handleChange} placeholder="Nom de l’entreprise" className={inputClass} />
            </label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><MapPin size={16} /> Localisation *</span>
              <input required name="location" value={job.location} onChange={handleChange} placeholder="Ex. Casablanca, Maroc" className={inputClass} />
            </label>
          </div>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Type de contrat *</span>
            <select name="contract" value={job.contract} onChange={handleChange} className={inputClass}>
              {CONTRACT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        </section>

        <section className="space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700"><FileText size={20} /></div>
            <div><h2 className="font-bold text-slate-900">Description et compétences</h2><p className="text-xs text-slate-500">Présentez le poste et les compétences recherchées</p></div>
          </div>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Description du poste *</span>
            <textarea required minLength={20} name="description" rows={7} value={job.description} onChange={handleChange} placeholder="Décrivez les missions, le profil recherché et les avantages du poste..." className={`${inputClass} resize-y`} />
            <span className={`mt-1 block text-right text-xs ${descriptionLength < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>{descriptionLength} caractères (minimum 20)</span>
          </label>
          <div><label htmlFor="tag-input" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Tag size={16} /> Compétences (optionnel)</label>
            <div className="flex gap-2"><input id="tag-input" value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTags(tagInput); } }} onBlur={() => { if (tagInput.includes(',')) addTags(tagInput); }} placeholder="Ex. React, Node.js, MySQL" className={inputClass} />
              <button type="button" onClick={() => addTags(tagInput)} aria-label="Ajouter les compétences" className="shrink-0 rounded-xl bg-violet-100 px-4 text-violet-700 transition hover:bg-violet-200"><Plus size={20} /></button></div>
            <p className="mt-2 text-xs text-slate-500">Séparez les compétences par une virgule ou appuyez sur Entrée.</p>
            {job.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{job.tags.map(tag => <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">{tag}<button type="button" onClick={() => removeTag(tag)} aria-label={`Retirer ${tag}`} className="rounded-full p-0.5 hover:bg-violet-200"><X size={13} /></button></span>)}</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><CheckCircle2 size={20} /></div>
            <div><h2 className="font-bold text-slate-900">Publication</h2><p className="text-xs text-slate-500">Choisissez la visibilité de votre offre</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ value: 'draft', label: 'Brouillon', detail: 'Conserver sans publier' }, { value: 'published', label: 'Publiée', detail: 'Rendre l’offre visible aux candidats' }].map(option => (
              <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${job.status === option.value ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 hover:border-violet-200'}`}>
                <input type="radio" name="status" value={option.value} checked={job.status === option.value} onChange={handleChange} className="mt-1 accent-violet-700" />
                <span><span className="block text-sm font-bold text-slate-900">{option.label}</span><span className="mt-1 block text-xs text-slate-500">{option.detail}</span></span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
          <button type="button" onClick={onCancel} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><ArrowLeft size={17} /> Annuler</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-indigo-700 hover:to-violet-800 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {submitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : job.status === 'published' ? 'Créer et publier' : 'Enregistrer le brouillon'}
          </button>
        </div>
        {!ready && <p className="text-xs text-slate-400">* Champs obligatoires. Le titre, l’entreprise et la description doivent respecter les longueurs minimales.</p>}
      </form>
    </div>
  );
}

