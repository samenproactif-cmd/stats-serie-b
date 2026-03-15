import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TrendingUp, TrendingDown, ClipboardCheck, Mail, X, HelpCircle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

// Composant défini en dehors pour éviter de perdre le focus
const MoisBlock = ({ label, data, setData }) => (
  <div className="mb-6 last:mb-0">
    <p className="text-[10px] font-black text-blue-500 uppercase ml-2 mb-2 tracking-widest">{label}</p>
    <div className="grid grid-cols-2 gap-4">
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div className="flex flex-col">
        <p className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 tracking-tight">NB TOTAL SCANS</p>
        <input 
          type="number" 
          placeholder="0" 
          className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 font-black text-xl text-slate-700 outline-none focus:border-blue-200" 
          value={data.scans} 
          onChange={(e) => setData({...data, scans: e.target.value})} 
        />
      </div>
      <div className="flex flex-col">
        <p className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-1 tracking-tight">JOURS PRESTÉS</p>
        <input 
          type="number" 
          placeholder="0" 
          className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 font-black text-xl text-slate-700 outline-none focus:border-blue-200" 
          value={data.jours} 
          onChange={(e) => setData({...data, jours: e.target.value})} 
        />
      </div>
    </div>
  </div>
);

const ScanProject = () => {
  const [stats, setStats] = useState([]);
  const [depotRefs, setDepotRefs] = useState({});
  const [agentsEmarges, setAgentsEmarges] = useState(0);
  const [listeNoms, setListeNoms] = useState([]);
  
  const [nomAgent, setNomAgent] = useState('');
  const [prenomAgent, setPrenomAgent] = useState('');
  const [errors, setErrors] = useState({ nom: false, prenom: false });
  const [lastInsertedId, setLastInsertedId] = useState(null);
  
  const [dataDec, setDataDec] = useState({ scans: '', jours: '' });
  const [dataJan, setDataJan] = useState({ scans: '', jours: '' });
  const [dataFev, setDataFev] = useState({ scans: '', jours: '' });
  
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAgentsList, setShowAgentsList] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: sts } = await supabase.from('stats_scans_anonymes').select('*');
    const { data: refs } = await supabase.from('parametres_depot').select('*');
    const { data: agents, count } = await supabase
      .from('agents_serie_b')
      .select('prenom_agent, nom_agent', { count: 'exact' });
    
    setStats(sts || []);
    setAgentsEmarges(count || 0);
    setListeNoms(agents || []);

    const refObj = {};
    refs?.forEach(r => refObj[r.mois_annee] = r.moyenne_depot_fixe);
    setDepotRefs(refObj);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setErrors({ nom: !nomAgent.trim(), prenom: !prenomAgent.trim() });

    if (!nomAgent.trim() || !prenomAgent.trim()) {
      alert("Tu dois impérativement renseigner ton Nom et ton Prénom.");
      return;
    }

    if (!dataDec.scans || !dataDec.jours || !dataJan.scans || !dataJan.jours || !dataFev.scans || !dataFev.jours) {
      alert("Tu dois remplir les données de scans et jours pour les 3 mois !");
      return;
    }

    const checkDecS = parseInt(dataDec.scans);
    const checkJanS = parseInt(dataJan.scans);
    const checkFevS = parseInt(dataFev.scans);
    const checkDecJ = parseInt(dataDec.jours);
    const checkJanJ = parseInt(dataJan.jours);
    const checkFevJ = parseInt(dataFev.jours);

    const alertes = [];
    if (checkDecS < 1000 || checkDecS > 5000) alertes.push(`Décembre : ${checkDecS} scans`);
    if (checkJanS < 1000 || checkJanS > 5000) alertes.push(`Janvier : ${checkJanS} scans`);
    if (checkFevS < 1000 || checkFevS > 5000) alertes.push(`Février : ${checkFevS} scans`);
    if (checkDecJ <= 0 || checkDecJ > 25) alertes.push(`Décembre : ${checkDecJ} jours`);
    if (checkJanJ <= 0 || checkJanJ > 25) alertes.push(`Janvier : ${checkJanJ} jours`);
    if (checkFevJ <= 0 || checkFevJ > 25) alertes.push(`Février : ${checkFevJ} jours`);

    if (alertes.length > 0) {
      const message = alertes.join("\n- ");
      const confirmation = window.confirm(`Attention, les valeurs suivantes semblent atypiques :\n\n- ${message}\n\nEs-tu sûr de vouloir continuer ?`);
      if (!confirmation) return;
    }

    try {
      const { data: agentData, error: agentError } = await supabase.from('agents_serie_b').insert([{ 
        nom_agent: nomAgent.toUpperCase(), 
        prenom_agent: prenomAgent,
        a_rempli_tout: true 
      }]).select();

      if (agentError) {
        if (agentError.code === '23505') {
            alert("Un relevé existe déjà pour ce nom.");
            return;
        }
        throw agentError;
      }
      
      if (agentData && agentData[0]) setLastInsertedId(agentData[0].id);

      const payloads = [
        { mois_annee: 'Décembre 2025', nb_scans: checkDecS, nb_jours_travailles: checkDecJ },
        { mois_annee: 'Janvier 2026', nb_scans: checkJanS, nb_jours_travailles: checkJanJ },
        { mois_annee: 'Février 2026', nb_scans: checkFevS, nb_jours_travailles: checkFevJ }
      ];

      await supabase.from('stats_scans_anonymes').insert(payloads);
      
      await fetchData();
      setShowEmailPopup(true);
      setDataDec({ scans: '', jours: '' }); 
      setDataJan({ scans: '', jours: '' }); 
      setDataFev({ scans: '', jours: '' });
      setErrors({ nom: false, prenom: false });
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'envoi.");
    }
  };

  const handleEmailSubmit = async () => {
    if (userEmail && lastInsertedId) {
      try {
        await supabase.from('agents_serie_b').update({ email_contact: userEmail }).eq('id', lastInsertedId);
      } catch (err) {
        console.error("Erreur mail:", err);
      }
    }
    setShowEmailPopup(false);
    setNomAgent(''); setPrenomAgent(''); setUserEmail(''); setLastInsertedId(null);
  };

  const calculateMoyenneSerie = (mois) => {
    const moisStats = stats.filter(s => s.mois_annee === mois);
    if (moisStats.length === 0) return 0;
    const sumMoyennes = moisStats.reduce((acc, curr) => acc + (curr.nb_scans / curr.nb_jours_travailles), 0);
    return (sumMoyennes / moisStats.length).toFixed(2);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-900 relative">
      
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
            <div className="text-blue-600 mb-4 font-black flex items-center gap-2">
                <HelpCircle size={28} />
                <span className="text-xl italic uppercase">Où trouver les chiffres ?</span>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
                <p>Pour trouver facilement vos nombres de scans mensuels et vos jours travaillés, reportez-vous dans l'onglet <strong>Rapports mensuels</strong> de votre Self-Service dans <strong>DITA</strong>, rubrique <strong>contrôle</strong>.</p>
                <p>Vous y trouverez votre <strong>Bonus de scan</strong> pour chaque mois (choisir <em>Bonus</em> et non <em>Total</em>), ainsi que votre nombre de jours travaillés.</p>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-slate-100 text-slate-800 p-4 rounded-2xl font-black uppercase tracking-widest text-sm text-center">J'ai compris</button>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowPrivacy(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"><X size={24}/></button>
            <div className="text-red-500 mb-6 font-black flex items-center gap-2">
                <ShieldCheck size={28} />
                <span className="text-xl italic uppercase font-black">Mentions Légales & RGPD</span>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm text-left">
                <p>Conformément au <strong>RGPD</strong>, vos données sont traitées selon les standards de sécurité en vigueurs.</p>
                <p>Vos chiffres et votre nom sont <strong>dissociés</strong> dans la base de données : votre nom sert uniquement à valider votre participation, tandis que vos chiffres sont associés à un <strong>ID fictif</strong> pour le calcul des moyennes globales.</p>
                <p>Ni les viewers ni l'admin ne pourront rapprocher votre identité de vos statistiques. L'objectif est strictement l'analyse de groupe et le bien-être au travail.</p>
                <p className="pt-2">Contact : <strong>samen.pro.actif@gmail.com</strong></p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="w-full mt-8 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm">FERMER</button>
          </div>
        </div>
      )}

      {showEmailPopup && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-sm w-full shadow-2xl relative">
            <button onClick={() => {setShowEmailPopup(false); setNomAgent(''); setPrenomAgent('');}} className="absolute top-6 right-6 text-slate-300"><X size={24}/></button>
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-blue-600"><Mail size={32} /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-4 text-center">C'est envoyé !</h3>
            <p className="text-slate-500 font-medium mb-6 text-sm text-center">Souhaites-tu laisser ton mail pour les résultats ?</p>
            <input type="email" placeholder="ton-email@exemple.com" className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 mb-4 outline-none font-semibold text-center" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => {setShowEmailPopup(false); setNomAgent(''); setPrenomAgent('');}} className="p-4 font-black text-slate-400 uppercase text-sm">Non</button>
                <button onClick={handleEmailSubmit} className="p-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-sm">Oui !</button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 text-center pt-6">
        <h1 className="text-4xl font-black text-blue-900 tracking-tighter italic uppercase">SÉRIE B</h1>
        <div className="flex flex-col gap-1">
          <p className="text-blue-500 font-bold uppercase tracking-widest text-sm">Observatoire Scans</p>
          <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider italic">Campagne Décembre 2025 à Février 2026</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-100/50 mb-6 border border-white relative">
        <button type="button" onClick={() => setShowHelp(true)} className="absolute top-6 right-6 text-slate-300 hover:text-blue-500 transition-colors"><HelpCircle size={24} /></button>
        <h2 className="font-bold flex items-center gap-2 mb-6 text-slate-600 px-2 uppercase text-sm tracking-tighter"><ClipboardCheck size={20}/> Nouveau relevé</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <input 
                type="text" 
                placeholder="NOM" 
                className={`p-4 rounded-2xl bg-slate-50 border-2 font-semibold outline-none transition-all text-slate-700 uppercase ${errors.nom ? 'border-red-500 bg-red-50' : 'border-slate-50 focus:border-blue-100'}`} 
                value={nomAgent} 
                onChange={(e) => {setNomAgent(e.target.value); if(errors.nom) setErrors({...errors, nom: false});}} 
            />
            <input 
                type="text" 
                placeholder="Prénom" 
                className={`p-4 rounded-2xl bg-slate-50 border-2 font-semibold outline-none transition-all text-slate-700 ${errors.prenom ? 'border-red-500 bg-red-50' : 'border-slate-50 focus:border-blue-100'}`} 
                value={prenomAgent} 
                onChange={(e) => {setPrenomAgent(e.target.value); if(errors.prenom) setErrors({...errors, prenom: false});}} 
            />
          </div>
          <div className="h-px bg-slate-50 w-full" />
          <MoisBlock label="Décembre 2025" data={dataDec} setData={setDataDec} />
          <MoisBlock label="Janvier 2026" data={dataJan} setData={setDataJan} />
          <MoisBlock label="Février 2026" data={dataFev} setData={setDataFev} />
          <button type="submit" className="bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg mt-2 uppercase tracking-tighter active:scale-95 transition-all">Valider ma saisie</button>
        </form>
      </div>

      <div className="space-y-6 mb-10">
        {['Décembre 2025', 'Janvier 2026', 'Février 2026'].map(mois => {
          const moySerie = calculateMoyenneSerie(mois);
          const moyDepot = depotRefs[mois] || 0;
          const ecart = moyDepot > 0 ? (((moySerie - moyDepot) / moyDepot) * 100).toFixed(1) : 0;
          return (
            <div key={mois} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-50 flex justify-between uppercase"><p className="text-xs font-black text-slate-400 tracking-[0.2em]">{mois}</p><div className="h-1.5 w-1.5 rounded-full bg-blue-200 my-auto"></div></div>
              <div className="p-6 grid grid-cols-3 items-end gap-2 text-center">
                <div className="flex flex-col text-left"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Moy. Série B</p><p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{moySerie}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-2">scans / jour</p></div>
                <div className="flex flex-col border-x border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tight">Moy. Dépôt</p><p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{moyDepot}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-2">scans / jour</p></div>
                <div className="flex flex-col items-center justify-center pb-1"><p className="text-[10px] font-black text-slate-400 uppercase mb-2 text-slate-300 italic">Différentiel</p><div className={`inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-full font-black text-sm ${Number(ecart) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{Number(ecart) >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}{ecart}%</div></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPTEUR PARTICIPATION DÉPLIABLE */}
      <div className="bg-blue-900 rounded-[2rem] p-6 mb-16 shadow-xl shadow-blue-900/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-blue-800 p-3 rounded-2xl text-blue-300"><ClipboardCheck size={24}/></div>
                <p className="text-white font-black text-xs uppercase leading-tight tracking-widest">Participation<br/>Complète</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-blue-800/50 px-6 py-3 rounded-2xl border border-blue-700/50">
                    <p className="text-2xl font-black text-white tracking-widest">{agentsEmarges}/39</p>
                </div>
                <button 
                  onClick={() => setShowAgentsList(!showAgentsList)} 
                  className="bg-blue-800 p-2 rounded-full text-white hover:bg-blue-700 transition-colors"
                >
                  {showAgentsList ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>
            </div>
          </div>
          
          {showAgentsList && (
            <div className="mt-6 pt-6 border-t border-blue-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listeNoms.length > 0 ? (
                  listeNoms.map((agent, idx) => (
                    <div key={idx} className="bg-blue-800/30 px-4 py-2 rounded-xl text-blue-100 text-[11px] font-bold uppercase tracking-tight border border-blue-700/30">
                      {agent.prenom_agent} {agent.nom_agent?.charAt(0)}.
                    </div>
                  ))
                ) : (
                  <p className="text-blue-400 text-[10px] italic font-medium uppercase tracking-widest col-span-full text-center">Aucun agent pour le moment</p>
                )}
              </div>
            </div>
          )}
      </div>

      <footer className="mt-16 pb-12 flex flex-col items-center gap-6 border-t border-slate-200 pt-10 text-center">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 px-4">
          <button onClick={() => window.location.href = 'mailto:samen.pro.actif@gmail.com'} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-2 transition-colors"><Mail size={14} /> Contact & Support</button>
          <button onClick={() => setShowPrivacy(true)} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 flex items-center gap-2 transition-colors"><ShieldCheck size={14} /> Mentions Légales & RGPD</button>
        </div>
        <div className="max-w-xs space-y-1">
            <p className="text-[10px] leading-relaxed text-slate-400 font-medium px-6 italic text-center">Plateforme indépendante conforme aux normes européennes de protection des données.</p>
            <p className="text-[10px] leading-relaxed text-slate-400 font-medium px-6 italic text-blue-400/60 text-center">L'anonymisation est garantie par un traitement de dissociation des identités.</p>
        </div>
        <div className="flex flex-col items-center border-t border-slate-100 pt-6 w-32">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">samen-proACTif</p>
          <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase text-blue-300/40 tracking-widest">Version 1.0.2</p>
        </div>
      </footer>
    </div>
  );
};

export default ScanProject;