import { useMemo, useState } from 'react';
import {
  ArrowRight, Bookmark, BriefcaseBusiness, Building2, CheckCircle2,
  Clock3, Home as HomeIcon, LayoutDashboard, LogIn, LogOut,
  MapPin, Menu, Search, ShieldCheck, Sparkles, UserPlus, X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { fetcher } from '../api/client';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const normalize = (value = '') => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function Home() {
  const { user, authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const { data, error, isLoading, mutate } = useSWR('/offers?status=published', fetcher);
  const offers = Array.isArray(data) ? data : [];

  const filteredOffers = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return offers;
    return offers.filter((offer) => {
      const searchable = normalize([
        offer.title, offer.company, offer.location, offer.contract,
        offer.description, ...(Array.isArray(offer.tags) ? offer.tags : []),
      ].join(' '));
      return terms.every((term) => searchable.includes(term));
    });
  }, [offers, query]);

  const openOffer = (offerId) => {
    const destination = `/job-details/${offerId}`;
    navigate(user ? destination : '/login', {
      state: user ? undefined : { from: destination },
    });
  };

  const toggleSaved = (id) => {
    setSavedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-18 min-h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-lg font-extrabold tracking-tight" aria-label="Khadma Plus, accueil">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-violet-200">
              <BriefcaseBusiness size={23} />
            </span>
            <span>Khadma <span className="text-violet-700">Plus</span></span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-2 lg:flex">
            <a href="#home" className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700"><HomeIcon size={16} /> Accueil</a>
            <a href="#offers" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700">Offres</a>
            <a href="#about" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700">Pourquoi Khadma Plus ?</a>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                {user.role === 'manager' && <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"><LayoutDashboard size={17} /> Dashboard</Link>}
                <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"><LogOut size={17} /> Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"><LogIn size={17} /> Connexion</Link>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:brightness-110"><UserPlus size={17} /> S'inscrire</Link>
              </>
            )}
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-700 sm:hidden" aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileMenuOpen && (
          <nav aria-label="Navigation mobile" className="flex flex-col gap-1 border-t border-slate-100 bg-white px-5 py-3 sm:hidden">
            <a onClick={() => setMobileMenuOpen(false)} href="#home" className="rounded-lg px-3 py-2 font-medium">Accueil</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#offers" className="rounded-lg px-3 py-2 font-medium">Offres</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#about" className="rounded-lg px-3 py-2 font-medium">À propos</a>
            {user ? <>
              {user.role === 'manager' && <Link to="/dashboard" className="rounded-lg px-3 py-2 font-medium">Dashboard</Link>}
              <button type="button" onClick={() => { setMobileMenuOpen(false); logout(); }} className="px-3 py-2 text-left font-medium">Déconnexion</button>
            </> : <>
              <Link to="/login" className="rounded-lg px-3 py-2 font-medium">Connexion</Link>
              <Link to="/register" className="rounded-lg bg-violet-600 px-3 py-2 font-semibold text-white">S'inscrire</Link>
            </>}
          </nav>
        )}
      </header>

      <section id="home" className="relative isolate overflow-hidden bg-[#060b24] text-white">
        <div className="pointer-events-none absolute -left-32 top-12 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-violet-900/40 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 sm:px-8 md:min-h-[520px] md:grid-cols-[1.12fr_0.88fr] md:py-20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200"><Sparkles size={15} /> Des opportunités qui vous ressemblent</span>
            <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl xl:text-6xl">
              Trouvez un <span className="relative inline-block text-violet-400">emploi<span className="absolute -bottom-2 left-0 h-1 w-full -rotate-2 rounded-full bg-violet-500" /></span> qui a du sens
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">Découvrez des offres adaptées à vos compétences et donnez un nouvel élan à votre carrière.</p>
            <form role="search" onSubmit={(event) => { event.preventDefault(); document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-8 flex max-w-2xl items-center gap-1 rounded-2xl bg-white p-1.5 shadow-2xl shadow-indigo-950/40">
              <Search size={20} className="ml-3 shrink-0 text-violet-600" />
              <input aria-label="Rechercher une offre d'emploi" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Poste, compétence, entreprise, ville..." className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
              <button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 sm:px-6"><Search size={17} /><span className="hidden sm:inline">Rechercher</span></button>
            </form>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><Building2 size={19} className="text-violet-300" /> Entreprises vérifiées</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={19} className="text-violet-300" /> Recherche rapide</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={19} className="text-violet-300" /> Accès sécurisé</span>
            </div>
          </div>
          <div className="relative hidden min-h-[350px] self-stretch md:block" aria-hidden="true">
            <div className="absolute inset-8 rounded-full bg-violet-600/30 blur-3xl" />
            <img src="/home-hero.png" alt="" className="absolute inset-0 h-full w-full rounded-3xl object-cover object-center [mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_100%)]" />
          </div>
        </div>
      </section>

      <main id="offers" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">À la une</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Trouvez votre prochaine opportunité</h2><span className="mt-3 block h-1 w-12 rounded-full bg-violet-600" /></div>
          {!isLoading && !error && <span aria-live="polite" className="rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700">{filteredOffers.length} offre{filteredOffers.length > 1 ? 's' : ''}</span>}
        </div>
        {isLoading ? (
          <div role="status" className="grid gap-5 lg:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-64 animate-pulse rounded-3xl bg-slate-200/70" />)}<span className="sr-only">Chargement des offres...</span></div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">Impossible de charger les offres. <button type="button" onClick={() => mutate()} className="ml-2 font-bold underline">Réessayer</button></div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-violet-200 bg-white px-6 py-16 text-center"><Search className="mx-auto mb-4 text-violet-500" size={32} /><h3 className="text-lg font-bold">Aucune offre trouvée</h3><p className="mt-2 text-slate-500">Essayez d'autres mots-clés ou une autre ville.</p>{query && <button type="button" onClick={() => setQuery('')} className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white">Effacer la recherche</button>}</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredOffers.map((offer) => {
              const saved = savedIds.has(offer.id);
              return <article key={offer.id} className="group flex flex-col rounded-3xl border border-violet-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/70">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-lg font-extrabold text-white shadow-lg shadow-violet-100">{String(offer.company || 'K').charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1"><h3 className="text-lg font-extrabold text-slate-950">{offer.title || 'Offre d’emploi'}</h3><p className="mt-1 text-sm font-medium text-slate-500">{offer.company || 'Entreprise'}</p></div>
                  <button type="button" onClick={() => toggleSaved(offer.id)} aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={saved} title="Favori pour cette session" className="rounded-xl p-2 text-violet-600 transition hover:bg-violet-50"><Bookmark size={21} fill={saved ? 'currentColor' : 'none'} /></button>
                </div>
                <div className="mt-5 flex min-h-8 flex-wrap gap-2">{(Array.isArray(offer.tags) ? offer.tags : []).map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">{tag}</span>)}</div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={17} className="text-violet-600" /> {offer.location || 'Lieu non précisé'}</span>{offer.contract && <span className="rounded-full bg-violet-100 px-3 py-1 font-bold text-violet-700">{offer.contract}</span>}</div>
                <Button onClick={() => openOffer(offer.id)} disabled={authLoading} className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 font-bold text-white transition hover:brightness-110">Voir l'offre <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </article>;
            })}
          </div>
        )}
        <p className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-500"><CheckCircle2 size={15} className="text-violet-600" /> Khadma Plus — trouvez l'opportunité qui vous correspond.</p>
      </main>

      <section id="about" className="scroll-mt-24 border-t border-violet-100 bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Pourquoi nous choisir ?</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Pourquoi Khadma Plus ?</h2>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Khadma Plus simplifie la rencontre entre les candidats et les recruteurs. Notre plateforme vous aide à trouver rapidement des offres pertinentes, à envoyer votre candidature en toute sécurité et à suivre chaque étape de votre parcours professionnel.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-violet-100 bg-violet-50/50 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/60">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200"><Building2 size={23} /></span>
              <h3 className="mt-5 text-xl font-bold text-slate-950">Des offres pertinentes</h3>
              <p className="mt-3 leading-7 text-slate-600">Accédez à des opportunités publiées par des entreprises et filtrez-les selon vos compétences, votre ville et vos ambitions.</p>
            </article>

            <article className="rounded-3xl border border-violet-100 bg-violet-50/50 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/60">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200"><Clock3 size={23} /></span>
              <h3 className="mt-5 text-xl font-bold text-slate-950">Un parcours rapide</h3>
              <p className="mt-3 leading-7 text-slate-600">Recherchez, consultez et postulez depuis une interface simple. Vos démarches restent claires et accessibles à tout moment.</p>
            </article>

            <article className="rounded-3xl border border-violet-100 bg-violet-50/50 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/60">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200"><ShieldCheck size={23} /></span>
              <h3 className="mt-5 text-xl font-bold text-slate-950">Une candidature sécurisée</h3>
              <p className="mt-3 leading-7 text-slate-600">Votre compte est protégé par une authentification sécurisée et vos documents sont transmis uniquement pour vos candidatures.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
