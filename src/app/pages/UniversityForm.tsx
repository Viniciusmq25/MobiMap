import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../context/AppContext';
import { University, Status, Priority, RegretRisk, DEFAULT_CHECKLIST } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  X,
  Info,
} from 'lucide-react';

const STEPS = [
  { id: 'identity', label: 'Identificação' },
  { id: 'costs', label: 'Custos' },
  { id: 'academic', label: 'Acadêmico' },
  { id: 'work', label: 'Trabalho' },
  { id: 'adaptation', label: 'Adaptação' },
  { id: 'personal', label: 'Pessoal & Notas' },
  { id: 'timeline', label: 'Prazos' },
];

const EMPTY: University = {
  id: '',
  name: '',
  acronym: '',
  city: '',
  country: '',
  flag: '🏳️',
  lat: 0,
  lng: 0,
  website: '',
  stemFocus: [],
  status: 'interested',
  priority: null,
  isFavorite: false,
  monthlyRent: 500,
  monthlyFood: 200,
  monthlyTransport: 50,
  monthlyPhone: 20,
  monthlyAcademic: 50,
  monthlyLeisure: 150,
  monthlyTravel: 100,
  monthlyHealth: 30,
  monthlyMisc: 80,
  flightCost: 400,
  visaCost: 0,
  housingDeposit: 1000,
  setupCost: 300,
  insuranceCost: 200,
  scholarship: 0,
  stemReputation: 7,
  researchOpportunities: 6,
  englishCourses: 7,
  creditCompatibility: 7,
  labAccess: 7,
  academicIntensity: 6,
  internshipChance: 6,
  networkingQuality: 6,
  startupEcosystem: 6,
  universityJobs: 5,
  languageDifficulty: 7,
  climateScore: 7,
  safety: 7,
  qualityOfLife: 7,
  internationalCommunity: 6,
  publicTransport: 7,
  emotionalScore: 7,
  regretRisk: 'medium',
  language: '',
  climate: '',
  professorOfInterest: '',
  pros: [],
  cons: [],
  redFlags: [],
  notes: '',
  links: [],
  applicationDeadline: '',
  visaDeadline: '',
  housingDeadline: '',
  semesterStart: '',
  semesterEnd: '',
  checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
  diary: [],
  createdAt: '',
  updatedAt: '',
};

function SliderField({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color =
    pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-teal-600' : 'text-amber-600';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-slate-700">{label}</label>
          {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
        </div>
        <span className={`text-sm ${color}`} style={{ fontWeight: 700 }}>
          {value}/{max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
        }}
      />
    </div>
  );
}

function EuroField({
  label,
  value,
  onChange,
  sublabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  sublabel?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-700 block mb-1">{label}</label>
      {sublabel && <div className="text-xs text-slate-400 mb-1">{sublabel}</div>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full pl-7 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
        />
      </div>
    </div>
  );
}

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    if (!input.trim()) return;
    onChange([...values, input.trim()]);
    setInput('');
  }
  return (
    <div>
      <label className="text-sm text-slate-700 block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs"
          >
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
        />
        <button
          onClick={add}
          className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function UniversityForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const isEdit = id && id !== 'nova';
  const existing = isEdit ? state.universities.find((u) => u.id === id) : undefined;

  const [form, setForm] = useState<University>(existing || { ...EMPTY });
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const monthly =
    form.monthlyRent +
    form.monthlyFood +
    form.monthlyTransport +
    form.monthlyPhone +
    form.monthlyAcademic +
    form.monthlyLeisure +
    form.monthlyTravel +
    form.monthlyHealth +
    form.monthlyMisc -
    form.scholarship;

  const oneTime =
    form.flightCost + form.visaCost + form.housingDeposit + form.setupCost + form.insuranceCost;

  function set<K extends keyof University>(key: K, value: University[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const now = new Date().toISOString();
    if (isEdit && existing) {
      dispatch({ type: 'UPDATE_UNIVERSITY', payload: { ...form, updatedAt: now } });
    } else {
      const newId = `uni-${Date.now()}`;
      dispatch({
        type: 'ADD_UNIVERSITY',
        payload: {
          ...form,
          id: newId,
          checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
          diary: [],
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    setSaved(true);
    setTimeout(() => navigate(isEdit ? `/universidades/${id}` : '/universidades'), 600);
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700 block mb-1">Nome completo *</label>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ex: Università di Trento"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Sigla/Acrônimo *</label>
                <input
                  value={form.acronym}
                  onChange={(e) => set('acronym', e.target.value)}
                  placeholder="Ex: UniTN"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Cidade *</label>
                <input
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Ex: Trento"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">País *</label>
                <input
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  placeholder="Ex: Itália"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Bandeira (emoji)</label>
                <input
                  value={form.flag}
                  onChange={(e) => set('flag', e.target.value)}
                  placeholder="🇮🇹"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Site da universidade</label>
                <input
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Latitude</label>
                <input
                  type="number"
                  value={form.lat}
                  onChange={(e) => set('lat', Number(e.target.value))}
                  placeholder="Ex: 46.0677"
                  step="0.0001"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Longitude</label>
                <input
                  type="number"
                  value={form.lng}
                  onChange={(e) => set('lng', Number(e.target.value))}
                  placeholder="Ex: 11.1501"
                  step="0.0001"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700 block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as Status)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="interested">Interessado</option>
                  <option value="candidate">Candidato</option>
                  <option value="approved">Aprovado</option>
                  <option value="discarded">Descartado</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Prioridade</label>
                <select
                  value={form.priority || ''}
                  onChange={(e) => set('priority', (e.target.value as Priority) || null)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="">Sem prioridade</option>
                  <option value="A">A – Sonho</option>
                  <option value="B">B – Forte candidata</option>
                  <option value="C">C – Backup</option>
                </select>
              </div>
            </div>

            <TagInput
              label="Áreas STEM / Foco"
              values={form.stemFocus}
              onChange={(v) => set('stemFocus', v)}
              placeholder="Ex: Engenharia Informática"
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Custo Mensal Estimado</div>
                <div className="text-2xl text-emerald-700" style={{ fontWeight: 700 }}>
                  €{monthly.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">6 Meses (total)</div>
                <div className="text-xl text-teal-700" style={{ fontWeight: 700 }}>
                  €{(monthly * 6 + oneTime).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-3 uppercase tracking-wide">Custos mensais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EuroField label="Aluguel / Alojamento" value={form.monthlyRent} onChange={(v) => set('monthlyRent', v)} sublabel="Quarto individual ou partilhado" />
                <EuroField label="Alimentação" value={form.monthlyFood} onChange={(v) => set('monthlyFood', v)} />
                <EuroField label="Transporte" value={form.monthlyTransport} onChange={(v) => set('monthlyTransport', v)} sublabel="Passe + ocasional" />
                <EuroField label="Celular / Internet" value={form.monthlyPhone} onChange={(v) => set('monthlyPhone', v)} />
                <EuroField label="Material acadêmico" value={form.monthlyAcademic} onChange={(v) => set('monthlyAcademic', v)} />
                <EuroField label="Lazer / Social" value={form.monthlyLeisure} onChange={(v) => set('monthlyLeisure', v)} />
                <EuroField label="Viagens" value={form.monthlyTravel} onChange={(v) => set('monthlyTravel', v)} sublabel="Viagens internas e finais de semana" />
                <EuroField label="Saúde / Seguro" value={form.monthlyHealth} onChange={(v) => set('monthlyHealth', v)} />
                <EuroField label="Imprevistos" value={form.monthlyMisc} onChange={(v) => set('monthlyMisc', v)} />
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-3 uppercase tracking-wide">Custos únicos (chegada)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EuroField label="Passagem aérea" value={form.flightCost} onChange={(v) => set('flightCost', v)} sublabel="Ida ou ida+volta" />
                <EuroField label="Visto" value={form.visaCost} onChange={(v) => set('visaCost', v)} sublabel="0 se não precisar" />
                <EuroField label="Caução / Depósito" value={form.housingDeposit} onChange={(v) => set('housingDeposit', v)} sublabel="Depósito de aluguel" />
                <EuroField label="Setup inicial" value={form.setupCost} onChange={(v) => set('setupCost', v)} sublabel="Roupa de cama, utensílios, etc." />
                <EuroField label="Seguro viagem/saúde" value={form.insuranceCost} onChange={(v) => set('insuranceCost', v)} sublabel="Para 6 meses" />
              </div>
            </div>

            <div>
              <h3 className="text-sm text-slate-500 mb-3 uppercase tracking-wide">Renda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EuroField label="Bolsa mensal" value={form.scholarship} onChange={(v) => set('scholarship', v)} sublabel="Bolsa, monitoria, trabalho estimado" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Avalie de 0 a 10 cada aspecto acadêmico desta universidade.</p>
            <SliderField label="Reputação em STEM" sublabel="Ranking e reconhecimento na área" value={form.stemReputation} onChange={(v) => set('stemReputation', v)} />
            <SliderField label="Oportunidades de pesquisa" sublabel="Chance de entrar em projetos/lab" value={form.researchOpportunities} onChange={(v) => set('researchOpportunities', v)} />
            <SliderField label="Disciplinas em inglês" sublabel="Disponibilidade de cursos em inglês" value={form.englishCourses} onChange={(v) => set('englishCourses', v)} />
            <SliderField label="Compatibilidade de créditos" sublabel="Aproveitamento real no seu curso" value={form.creditCompatibility} onChange={(v) => set('creditCompatibility', v)} />
            <SliderField label="Acesso a laboratórios" sublabel="Disponibilidade de labs para intercambistas" value={form.labAccess} onChange={(v) => set('labAccess', v)} />
            <SliderField label="Intensidade acadêmica" sublabel="0=muito aplicado, 10=muito teórico" value={form.academicIntensity} onChange={(v) => set('academicIntensity', v)} />
            <div>
              <label className="text-sm text-slate-700 block mb-1">Professor/Lab de interesse</label>
              <input
                value={form.professorOfInterest}
                onChange={(e) => set('professorOfInterest', e.target.value)}
                placeholder="Ex: Prof. Maria Silva - Lab de IA"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Avalie as oportunidades de trabalho e carreira desta cidade/universidade.</p>
            <SliderField label="Chance de estágio em 6 meses" sublabel="Chance realista de conseguir estágio" value={form.internshipChance} onChange={(v) => set('internshipChance', v)} />
            <SliderField label="Qualidade de networking" sublabel="Conexões técnicas e profissionais" value={form.networkingQuality} onChange={(v) => set('networkingQuality', v)} />
            <SliderField label="Ecossistema de startups" sublabel="Presença de startups e indústria tech" value={form.startupEcosystem} onChange={(v) => set('startupEcosystem', v)} />
            <SliderField label="Oportunidades dentro da universidade" sublabel="Monitoria, bolsas, projetos internos" value={form.universityJobs} onChange={(v) => set('universityJobs', v)} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700 block mb-1">Idioma principal</label>
                <input
                  value={form.language}
                  onChange={(e) => set('language', e.target.value)}
                  placeholder="Ex: Italiano / Inglês parcial"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Clima</label>
                <input
                  value={form.climate}
                  onChange={(e) => set('climate', e.target.value)}
                  placeholder="Ex: Mediterrâneo, invernos amenos"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            <SliderField label="Facilidade de idioma" sublabel="10 = idioma muito fácil (ex: português)" value={form.languageDifficulty} onChange={(v) => set('languageDifficulty', v)} />
            <SliderField label="Clima (adequação pessoal)" sublabel="10 = clima ideal para você" value={form.climateScore} onChange={(v) => set('climateScore', v)} />
            <SliderField label="Segurança" sublabel="Segurança geral da cidade" value={form.safety} onChange={(v) => set('safety', v)} />
            <SliderField label="Qualidade de vida" sublabel="Bem-estar, lazer, conforto" value={form.qualityOfLife} onChange={(v) => set('qualityOfLife', v)} />
            <SliderField label="Comunidade internacional" sublabel="Diversidade e suporte para estrangeiros" value={form.internationalCommunity} onChange={(v) => set('internationalCommunity', v)} />
            <SliderField label="Transporte público" sublabel="Qualidade e acessibilidade" value={form.publicTransport} onChange={(v) => set('publicTransport', v)} />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-700 block mb-1">
                  Quanto me vejo vivendo aqui por 6 meses? (0–10)
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400">0 – Nada</span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={form.emotionalScore}
                    onChange={(e) => set('emotionalScore', Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${form.emotionalScore * 10}%, #e2e8f0 ${form.emotionalScore * 10}%, #e2e8f0 100%)`,
                    }}
                  />
                  <span className="text-xs text-slate-400">10 – Totalmente</span>
                  <span className="text-sm text-emerald-600 w-6" style={{ fontWeight: 700 }}>
                    {form.emotionalScore}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-700 block mb-2">
                  Risco de arrependimento se não escolher?
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as RegretRisk[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => set('regretRisk', r)}
                      className={`flex-1 py-2 rounded-xl text-sm transition-colors ${
                        form.regretRisk === r
                          ? r === 'high'
                            ? 'bg-amber-500 text-white'
                            : r === 'medium'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-400 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {r === 'low' ? 'Baixo' : r === 'medium' ? 'Médio' : 'Alto'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <TagInput label="Prós" values={form.pros} onChange={(v) => set('pros', v)} placeholder="Ex: Custo de vida baixo" />
            <TagInput label="Contras" values={form.cons} onChange={(v) => set('cons', v)} placeholder="Ex: Idioma difícil" />
            <TagInput label="Red Flags ⚠️" values={form.redFlags} onChange={(v) => set('redFlags', v)} placeholder="Ex: Aluguel muito competitivo" />
            <TagInput label="Links úteis" values={form.links} onChange={(v) => set('links', v)} placeholder="https://..." />

            <div>
              <label className="text-sm text-slate-700 block mb-1">Notas pessoais</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                placeholder="Observações gerais, impressões, informações coletadas..."
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-700 block mb-1">Prazo de candidatura</label>
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => set('applicationDeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Prazo de visto</label>
                <input
                  type="date"
                  value={form.visaDeadline}
                  onChange={(e) => set('visaDeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Prazo de alojamento</label>
                <input
                  type="date"
                  value={form.housingDeadline}
                  onChange={(e) => set('housingDeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Início do semestre</label>
                <input
                  type="date"
                  value={form.semesterStart}
                  onChange={(e) => set('semesterStart', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-sm text-slate-700 block mb-1">Fim do semestre</label>
                <input
                  type="date"
                  value={form.semesterEnd}
                  onChange={(e) => set('semesterEnd', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl text-slate-800" style={{ fontWeight: 700 }}>
            {isEdit ? `Editar: ${form.acronym || form.name}` : 'Nova Opção de Mobilidade'}
          </h1>
          <p className="text-sm text-slate-500">Preencha as informações da universidade/cidade</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors ${
                step === i
                  ? 'bg-emerald-600 text-white'
                  : i < step
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  step === i ? 'bg-white text-emerald-600' : i < step ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200'
                }`}
                style={{ fontWeight: 700 }}
              >
                {i < step ? '✓' : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <div className="w-3 h-px bg-slate-200 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Form content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-slate-800 mb-6" style={{ fontWeight: 600 }}>
          {STEPS[step].label}
        </h2>
        {renderStep()}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm text-white transition-colors ${
              saved ? 'bg-teal-500' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Salvo! ✓' : 'Salvar'}
          </button>

          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 hover:bg-slate-200"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
