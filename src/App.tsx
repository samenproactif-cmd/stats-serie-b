import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TrendingUp, TrendingDown, ClipboardCheck, CheckCircle, Mail, X, HelpCircle, ShieldCheck } from 'lucide-react';

const ScanProject = () => {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState([]);
  const [depotRefs, setDepotRefs] = useState({});
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedMois, setSelectedMois] = useState('');
  const [scans, setScans] = useState('');
  const [jours, setJours] = useState('');
  
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: ags } = await supabase.from('agents_serie_b').select('*').order('nom_agent');
    const { data: sts } = await supabase.from('stats_scans_anonymes').select('*');
    const { data: refs } = await supabase.from('parametres_depot').select('*');
    setAgents(ags || []);
    setStats(sts || []);
    const refObj = {};
    refs?.forEach(r => refObj[r.mois_annee] = r.moyenne_depot_fixe);
    setDepotRefs(refObj);
  };

  const agentsRestants = agents.filter(a => !(a.a_rempli_decembre && a.a_rempli_janvier && a.a_rempli_fevrier));
  const currentAgent = agents.find(a => a.id === selectedAgentId);
  
  const getMoisDisponibles = (agent) => {
    const liste = [];
    if (!agent) return []; 
    if (!agent.a_rempli_decembre) liste.push('Décembre 2025');
    if (!agent.a_rempli_janvier) liste.push('Janvier 2026');
    if (!agent.a_rempli_fevrier) liste.push('Février 2026');
    return liste;
  };

  const moisDisponibles = getMoisDisponibles(currentAgent);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentId || !selectedMois || !scans || !jours) return alert("Remplis tout !");
    const moisBrut = selectedMois.split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const moisKey = `a_rempli_${moisBrut}`;
    const isLastMonth = moisDisponibles.length === 1;

    try {
      await supabase.from('agents_serie_b').update({ [moisKey]: true }).eq('id', selectedAgentId);
      await supabase.from('stats_scans_anonymes').insert([{ 
        mois_annee: selectedMois, 
        nb_scans: parseInt(scans), 
        nb_jours_travailles: parseInt(jours) 
      }]);
      await fetchData();
      if (isLastMonth) {
        setShowEmailPopup(true);
      } else {
        setScans(''); setJours(''); setSelectedMois('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmailSubmit = async (accept) => {
    if (accept && userEmail) {
      await supabase.from('agents_serie_b').update({ email_contact: userEmail }).eq('id', selectedAgentId);
    }
    setShowEmailPopup(false);
    setSelectedAgentId('');
    setUserEmail('');
    alert("Merci !");
  };

  const calculateMoyenneSerie = (mois) => {
    const moisStats = stats.filter(s => s.mois_annee === mois);
    if (moisStats.length === 0) return 0;
    const sumMoyennes = moisStats.reduce((acc, curr) => acc + (curr.nb_scans / curr.nb_jours_travailles), 0);
    return (sumMoyennes / moisStats.length).toFixed(2);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-900 relative">
      
      {/* POPUP AIDE (DITA) */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
            <div className="text-blue-600 mb-4 font-black flex items-center gap-2">
                <HelpCircle size={28} />
                <span className="text-xl">Où trouver les chiffres ?</span>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
                <p>Pour trouver facilement vos nombres de scans mensuels et vos jours travaillés, reportez-vous dans l'onglet <strong>Rapports mensuels</strong> de votre Self-Service dans <strong>DITA</strong>, rubrique <strong>contrôle</strong>.</p>
                <p>Vous y trouverez votre <strong>Bonus de scan</strong> pour chaque mois (choisir <em>Bonus</em> et non <em>Total</em>), ainsi que votre nombre de jours travaillés.</p>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-slate-100 text-slate-800 p-4 rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all">J'ai compris</button>
          </div>
        </div>
      )}

      {/* POPUP CONFIDENTIALITÉ / RGPD */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowPrivacy(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
            <div className="text-red-500 mb-4 font-black flex items-center gap-2">
                <ShieldCheck size={28} />
                <span className="text-xl">Mentions Légales & RGPD</span>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
                <p>Conformément au <strong>RGPD</strong>, vos données sont traitées selon les standards de sécurité en vigueurs.</p>
                <p>Vos chiffres et votre nom sont <strong>dissociés</strong> dans la base de données : votre nom sert uniquement à valider votre participation, tandis que vos chiffres sont associés à un <strong>ID fictif</strong> pour le calcul des moyennes globales.</p>
                <p>Ni les viewers ni l'admin ne pourront rapprocher votre identité de vos statistiques. L'objectif est strictement l'analyse de groupe et le bien-être au travail.</p>
                <p className="pt-2">Contact : <strong>samen.pro.actif@gmail.com</strong></p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="w-full mt-8 bg-red-50 text-red-700 p-4 rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all">Fermer</button>
          </div>
        </div>
      )}

      {/* POPUP EMAIL */}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => {setShowEmailPopup(false); setSelectedAgentId('');}} className="absolute top-6 right-6 text-slate-300"><X size={24}/></button>
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
              <Mail size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-4">Bravo, tu as fini !</h3>
            <p className="text-slate-500 font-medium mb-6 text-sm">Souhaites-tu être tenu au courant des résultats finaux par mail ?</p>
            <input type="email" placeholder="ton-email@exemple.com" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 mb-4 outline-none focus:border-blue-500 font-semibold" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleEmailSubmit(false)} className="p-4 rounded-2xl font-black text-slate-400 uppercase text-sm">Non</button>
              <button onClick={() => handleEmailSubmit(true)} className="p-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg uppercase text-sm">Oui !</button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 text-center pt-6">
        <h1 className="text-4xl font-black text-blue-900 tracking-tighter italic">SÉRIE B</h1>
        <div className="flex flex-col gap-1">
          <p className="text-blue-500 font-bold uppercase tracking-widest text-sm">Observatoire Scans</p>
          <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Campagne Décembre 2025 à Février 2026</p>
        </div>
      </header>

      {/* FORMULAIRE */}
      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-100/50 mb-10 border border-white relative">
        <button 
            type="button"
            onClick={() => setShowHelp(true)}
            className="absolute top-6 right-6 text-slate-300 hover:text-blue-500 transition-colors"
        >
            <HelpCircle size={24} />
        </button>

        <h2 className="font-bold flex items-center gap-2 mb-4 text-slate-600 px-2"><ClipboardCheck size={20}/> Nouveau relevé</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <select className={`p-4 rounded-2xl border-2 font-semibold outline-none transition-all ${selectedAgentId ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-50 text-slate-700'}`} value={selectedAgentId} onChange={(e) => { setSelectedAgentId(e.target.value); setSelectedMois(''); }}>
            <option value="">Sélectionne ton nom</option>
            {agentsRestants.map(a => <option key={a.id} value={a.id}>{a.nom_agent}</option>)}
          </select>

          {selectedAgentId && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <select className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-semibold outline-none focus:border-blue-500 transition-all text-slate-700" value={selectedMois} onChange={(e) => setSelectedMois(e.target.value)}>
                <option value="">Quel mois ?</option>
                {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex flex-col">
                   <p className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 tracking-tight">Nb total scans</p>
                   <input type="number" placeholder="0" className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-xl text-slate-700" value={scans} onChange={(e) => setScans(e.target.value)} />
                </div>
                <div className="flex flex-col">
                   <p className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 tracking-tight">Jours prestés</p>
                   <input type="number" placeholder="0" className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-xl text-slate-700" value={jours} onChange={(e) => setJours(e.target.value)} />
                </div>
              </div>
              <button className="bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all mt-2 uppercase tracking-tighter">
                {moisDisponibles.length > 1 ? `Valider et continuer` : `Terminer ma saisie`}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* DASHBOARD */}
      <div className="space-y-6">
        {['Décembre 2025', 'Janvier 2026', 'Février 2026'].map(mois => {
          const moySerie = calculateMoyenneSerie(mois);
          const moyDepot = depotRefs[mois] || 0;
          const ecart = moyDepot > 0 ? (((moySerie - moyDepot) / moyDepot) * 100).toFixed(1) : 0;
          return (
            <div key={mois} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-50 flex justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{mois}</p>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200 my-auto"></div>
              </div>
              <div className="p-6 grid grid-cols-3 items-end gap-2 text-center">
                <div className="flex flex-col text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Moy. Série B</p>
                  <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{moySerie}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">scans / jour</p>
                </div>
                <div className="flex flex-col border-x border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tight">Moy.  Dépôt</p>
                  <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{moyDepot}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">scans / jour</p>
                </div>
                <div className="flex flex-col items-center justify-center pb-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2 text-slate-300 italic">Différentiel</p>
                  <div className={`inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-full font-black text-sm ${Number(ecart) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {Number(ecart) >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                    {ecart}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-10 p-5 bg-blue-900 rounded-[2rem] text-white flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-blue-300" size={20} />
          <span className="text-xs font-bold tracking-widest uppercase text-left leading-tight">Participation <br/>complète</span>
        </div>
        <div className="bg-blue-800 px-5 py-2 rounded-2xl font-black text-xl tabular-nums border border-blue-700">
          {agents.length - agentsRestants.length} / {agents.length}
        </div>
      </div>

      {/* FOOTER PROFESSIONNEL */}
      <footer className="mt-16 pb-12 flex flex-col items-center gap-6 border-t border-slate-200 pt-10 text-center">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 px-4">
          <button 
            onClick={() => window.location.href = 'mailto:samen.pro.actif@gmail.com'}
            className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <Mail size={14} /> Contact & Support
          </button>
          <button 
            onClick={() => setShowPrivacy(true)}
            className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <ShieldCheck size={14} /> Mentions Légales & RGPD
          </button>
        </div>

        <p className="max-w-xs text-[10px] leading-relaxed text-slate-400 font-medium px-6 italic">
          Plateforme indépendante conforme aux normes européennes de protection des données. 
          L'anonymisation est garantie par un traitement de dissociation des identités.
        </p>

        <div className="flex flex-col items-center border-t border-slate-100 pt-6 w-32">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">proACTif</p>
          <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Version 1.0.2</p>
        </div>
      </footer>
    </div>
  );
};

export default ScanProject;