import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronLeft,
  Edit2,
  Heart,
  ExternalLink,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  AlertTriangle,
  Copy,
  GitCompareArrows,
} from 'lucide-react';
import { useApp, calcMonthlyTotal, calcSixMonthTotal, calcOneTimeTotal } from '../context/AppContext';
import { DiaryEntry, ChecklistItem } from '../types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

const STATUS_CONFIG = {
  interested: { label: 'Interessado', color: 'bg-blue-100 text-blue-700' },
  candidate: { label: 'Candidato', color: 'bg-emerald-100 text-emerald-700' },
  approved: { label: 'Aprovado', color: 'bg-teal-100 text-teal-700' },
  discarded: { label: 'Descartado', color: 'bg-slate-100 text-slate-500' },
};

const REGRET_CONFIG = {
  low: { label: 'Baixo', color: 'text-slate-500 bg-slate-100' },
  medium: { label: 'Médio', color: 'text-blue-600 bg-blue-100' },
  high: { label: 'Alto', color: 'text-amber-600 bg-amber-100' },
};

function ScoreBar({ label, value, color = '#10b981' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
      <span className="text-xs text-slate-600 w-8 text-right" style={{ fontWeight: 600 }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch, calcScoreBreakdown, getBadges } = useApp();
  const uni = state.universities.find((u) => u.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'academic' | 'notes' | 'checklist' | 'diary'>('overview');
  const [newDiaryEntry, setNewDiaryEntry] = useState('');
  const [showDiaryInput, setShowDiaryInput] = useState(false);

  if (!uni) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl text-slate-700 mb-2" style={{ fontWeight: 600 }}>Opção não encontrada</h2>
        <button onClick={() => navigate('/universidades')} className="text-emerald-600 hover:underline text-sm">
          Voltar para lista
        </button>
      </div>
    );
  }

  const breakdown = calcScoreBreakdown(uni);
  const badges = getBadges(uni);
  const monthly = calcMonthlyTotal(uni);
  const oneTime = calcOneTimeTotal(uni);
  const sixMonths = calcSixMonthTotal(uni);

  const radarData = [
    { subject: 'STEM', A: breakdown.stemScore },
    { subject: 'Trabalho', A: breakdown.workScore },
    { subject: 'Custo', A: breakdown.costScore },
    { subject: 'Moradia', A: breakdown.housingScore },
    { subject: 'QdV', A: breakdown.qualityScore },
    { subject: 'Clima', A: breakdown.climateScoreVal },
    { subject: 'Adaptação', A: breakdown.adaptationScore },
    { subject: 'Fit', A: breakdown.emotionalScoreVal },
  ];

  const costBreakdown = [
    { name: 'Aluguel', value: uni.monthlyRent },
    { name: 'Alimentação', value: uni.monthlyFood },
    { name: 'Transporte', value: uni.monthlyTransport },
    { name: 'Lazer', value: uni.monthlyLeisure },
    { name: 'Viagens', value: uni.monthlyTravel },
    { name: 'Outros', value: uni.monthlyPhone + uni.monthlyAcademic + uni.monthlyHealth + uni.monthlyMisc },
  ];

  const COLORS = ['#10b981', '#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#94a3b8'];

  function toggleChecklist(itemId: string) {
    const updatedChecklist = uni.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    dispatch({ type: 'UPDATE_UNIVERSITY', payload: { ...uni, checklist: updatedChecklist, updatedAt: new Date().toISOString() } });
  }

  function addDiaryEntry() {
    if (!newDiaryEntry.trim()) return;
    const entry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      text: newDiaryEntry.trim(),
    };
    dispatch({
      type: 'UPDATE_UNIVERSITY',
      payload: { ...uni, diary: [...uni.diary, entry], updatedAt: new Date().toISOString() },
    });
    setNewDiaryEntry('');
    setShowDiaryInput(false);
  }

  function deleteDiaryEntry(entryId: string) {
    dispatch({
      type: 'UPDATE_UNIVERSITY',
      payload: { ...uni, diary: uni.diary.filter((e) => e.id !== entryId), updatedAt: new Date().toISOString() },
    });
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'costs', label: 'Custos' },
    { id: 'academic', label: 'Acadêmico' },
    { id: 'notes', label: 'Notas' },
    { id: 'checklist', label: `Checklist (${uni.checklist.filter((i) => i.completed).length}/${uni.checklist.length})` },
    { id: 'diary', label: 'Diário' },
  ] as const;

  const completedItems = uni.checklist.filter((i) => i.completed).length;
  const checklistPct = Math.round((completedItems / uni.checklist.length) * 100);

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              {uni.flag}
            </div>
            <div>
              <h1 className="text-xl text-slate-800 leading-tight" style={{ fontWeight: 700 }}>
                {uni.name}
              </h1>
              <div className="text-sm text-slate-500">{uni.city}, {uni.country}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: uni.id })}
            className={`p-2 rounded-xl transition-colors ${uni.isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-400'}`}
          >
            <Heart className={`w-5 h-5 ${uni.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_COMPARE', payload: uni.id })}
            className={`p-2 rounded-xl transition-colors ${state.compareIds.includes(uni.id) ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:bg-teal-50 hover:text-teal-600'}`}
          >
            <GitCompareArrows className="w-5 h-5" />
          </button>
          <button
            onClick={() => dispatch({ type: 'DUPLICATE_UNIVERSITY', payload: uni.id })}
            className="p-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-blue-500"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/universidades/${uni.id}/editar`)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm"
          >
            <Edit2 className="w-4 h-4" /> Editar
          </button>
        </div>
      </div>

      {/* Score banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-emerald-200 text-xs mb-1">Score Final</div>
            <div className="text-4xl" style={{ fontWeight: 800 }}>{breakdown.finalScore.toFixed(1)}</div>
            <div className="text-emerald-200 text-xs">/10.0</div>
          </div>
          <div>
            <div className="text-emerald-200 text-xs mb-1">Custo Mensal</div>
            <div className="text-2xl" style={{ fontWeight: 700 }}>€{monthly.toLocaleString()}</div>
            <div className="text-emerald-200 text-xs">por mês</div>
          </div>
          <div>
            <div className="text-emerald-200 text-xs mb-1">6 Meses (total)</div>
            <div className="text-2xl" style={{ fontWeight: 700 }}>€{sixMonths.toLocaleString()}</div>
            <div className="text-emerald-200 text-xs">incluindo chegada</div>
          </div>
          <div>
            <div className="text-emerald-200 text-xs mb-1">Checklist</div>
            <div className="text-2xl" style={{ fontWeight: 700 }}>{checklistPct}%</div>
            <div className="text-emerald-200 text-xs">{completedItems}/{uni.checklist.length} itens</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className={`text-xs px-2 py-1 rounded-full bg-white/20`}>
            {STATUS_CONFIG[uni.status].label}
          </span>
          {uni.priority && (
            <span className="text-xs px-2 py-1 rounded-full bg-white/20">
              Prioridade {uni.priority}
            </span>
          )}
          {badges.map((b) => (
            <span key={b} className="text-xs px-2 py-1 rounded-full bg-white/20">{b}</span>
          ))}
          {uni.stemFocus.slice(0, 2).map((f) => (
            <span key={f} className="text-xs px-2 py-1 rounded-full bg-white/10">{f}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Perfil de Scores</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Breakdown de Scores</h3>
            <div className="space-y-3">
              <ScoreBar label="STEM" value={breakdown.stemScore} color="#0d9488" />
              <ScoreBar label="Trabalho" value={breakdown.workScore} color="#3b82f6" />
              <ScoreBar label="Custo" value={breakdown.costScore} color="#10b981" />
              <ScoreBar label="Moradia" value={breakdown.housingScore} color="#22c55e" />
              <ScoreBar label="Adaptação" value={breakdown.adaptationScore} color="#8b5cf6" />
              <ScoreBar label="Qualidade" value={breakdown.qualityScore} color="#f59e0b" />
              <ScoreBar label="Clima" value={breakdown.climateScoreVal} color="#06b6d4" />
              <ScoreBar label="Fit Pessoal" value={breakdown.emotionalScoreVal} color="#ec4899" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Informações</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Idioma</span>
                <span className="text-slate-700">{uni.language || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Clima</span>
                <span className="text-slate-700 text-right max-w-[60%]">{uni.climate || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Risco arrependimento</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${REGRET_CONFIG[uni.regretRisk].color}`}>
                  {REGRET_CONFIG[uni.regretRisk].label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Início semestre</span>
                <span className="text-slate-700">
                  {uni.semesterStart ? new Date(uni.semesterStart).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Candidatura até</span>
                <span className="text-slate-700">
                  {uni.applicationDeadline
                    ? new Date(uni.applicationDeadline).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
              </div>
              {uni.professorOfInterest && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Prof. interesse</span>
                  <span className="text-slate-700 text-right max-w-[60%]">{uni.professorOfInterest}</span>
                </div>
              )}
              {uni.website && (
                <a
                  href={uni.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Site oficial <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Prós & Contras</h3>
            {uni.pros.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-emerald-600 mb-2" style={{ fontWeight: 600 }}>Prós</div>
                <ul className="space-y-1">
                  {uni.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uni.cons.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-red-500 mb-2" style={{ fontWeight: 600 }}>Contras</div>
                <ul className="space-y-1">
                  {uni.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uni.redFlags.length > 0 && (
              <div>
                <div className="text-xs text-amber-600 mb-2" style={{ fontWeight: 600 }}>⚠️ Red Flags</div>
                <ul className="space-y-1">
                  {uni.redFlags.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uni.pros.length === 0 && uni.cons.length === 0 && uni.redFlags.length === 0 && (
              <div className="text-sm text-slate-400 text-center py-4">
                Nenhuma anotação. <button onClick={() => navigate(`/universidades/${id}/editar`)} className="text-emerald-600 underline">Editar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Distribuição Mensal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={costBreakdown} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v: number) => [`€${v}`, '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {costBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Resumo Financeiro</h3>
            <div className="space-y-3">
              {[
                { label: 'Aluguel', value: uni.monthlyRent, monthly: true },
                { label: 'Alimentação', value: uni.monthlyFood, monthly: true },
                { label: 'Transporte', value: uni.monthlyTransport, monthly: true },
                { label: 'Celular/Internet', value: uni.monthlyPhone, monthly: true },
                { label: 'Material acadêmico', value: uni.monthlyAcademic, monthly: true },
                { label: 'Lazer', value: uni.monthlyLeisure, monthly: true },
                { label: 'Viagens', value: uni.monthlyTravel, monthly: true },
                { label: 'Saúde', value: uni.monthlyHealth, monthly: true },
                { label: 'Imprevistos', value: uni.monthlyMisc, monthly: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-700" style={{ fontWeight: 500 }}>€{item.value}/mês</span>
                </div>
              ))}
              {uni.scholarship > 0 && (
                <div className="flex items-center justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-emerald-600">− Bolsa</span>
                  <span className="text-emerald-600" style={{ fontWeight: 500 }}>−€{uni.scholarship}/mês</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm" style={{ fontWeight: 700 }}>
                <span className="text-slate-700">Total mensal líquido</span>
                <span className="text-emerald-700 text-base">€{monthly.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Custos de Chegada</h3>
            <div className="space-y-2">
              {[
                { label: 'Passagem aérea', value: uni.flightCost },
                { label: 'Visto', value: uni.visaCost },
                { label: 'Caução/Depósito', value: uni.housingDeposit },
                { label: 'Setup inicial', value: uni.setupCost },
                { label: 'Seguro', value: uni.insuranceCost },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-700">€{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm" style={{ fontWeight: 700 }}>
                <span className="text-slate-700">Total chegada</span>
                <span className="text-teal-700">€{oneTime.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
            <h3 className="text-emerald-800 mb-4" style={{ fontWeight: 600 }}>Total 6 Meses</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">6 × €{monthly.toLocaleString()}/mês</span>
                <span className="text-slate-700">€{(monthly * 6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Custos chegada</span>
                <span className="text-slate-700">€{oneTime.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base border-t border-emerald-200 pt-2 mt-2" style={{ fontWeight: 700 }}>
                <span className="text-emerald-800">TOTAL ESTIMADO</span>
                <span className="text-emerald-700">€{sixMonths.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Critérios Acadêmicos</h3>
            <div className="space-y-3">
              <ScoreBar label="Reputação STEM" value={uni.stemReputation} color="#0d9488" />
              <ScoreBar label="Pesquisa" value={uni.researchOpportunities} color="#10b981" />
              <ScoreBar label="Inglês" value={uni.englishCourses} color="#3b82f6" />
              <ScoreBar label="Créditos" value={uni.creditCompatibility} color="#8b5cf6" />
              <ScoreBar label="Labs" value={uni.labAccess} color="#06b6d4" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Trabalho & Carreira</h3>
            <div className="space-y-3">
              <ScoreBar label="Estágio" value={uni.internshipChance} color="#3b82f6" />
              <ScoreBar label="Networking" value={uni.networkingQuality} color="#8b5cf6" />
              <ScoreBar label="Startups" value={uni.startupEcosystem} color="#f59e0b" />
              <ScoreBar label="Univ. jobs" value={uni.universityJobs} color="#10b981" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Adaptação</h3>
            <div className="space-y-3">
              <ScoreBar label="Idioma" value={uni.languageDifficulty} color="#10b981" />
              <ScoreBar label="Clima" value={uni.climateScore} color="#06b6d4" />
              <ScoreBar label="Segurança" value={uni.safety} color="#22c55e" />
              <ScoreBar label="Qualidade vida" value={uni.qualityOfLife} color="#f59e0b" />
              <ScoreBar label="Comunidade int." value={uni.internationalCommunity} color="#8b5cf6" />
              <ScoreBar label="Transporte" value={uni.publicTransport} color="#3b82f6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>Fit Pessoal</h3>
            <ScoreBar label="Me vejo lá" value={uni.emotionalScore} color="#ec4899" />
            <div className="mt-4 p-3 rounded-xl bg-amber-50">
              <div className="text-xs text-amber-600 mb-1" style={{ fontWeight: 600 }}>Risco de arrependimento</div>
              <div className={`text-sm px-3 py-1 rounded-full inline-block ${REGRET_CONFIG[uni.regretRisk].color}`}>
                {REGRET_CONFIG[uni.regretRisk].label}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6">
          {uni.notes && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-slate-700 mb-3" style={{ fontWeight: 600 }}>Notas Pessoais</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{uni.notes}</p>
            </div>
          )}
          {uni.links.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-slate-700 mb-3" style={{ fontWeight: 600 }}>Links Úteis</h3>
              <div className="space-y-2">
                {uni.links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {!uni.notes && uni.links.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <div className="text-3xl mb-3">📝</div>
              <div className="text-slate-500 text-sm mb-3">Nenhuma nota cadastrada</div>
              <button onClick={() => navigate(`/universidades/${id}/editar`)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700">
                Adicionar notas
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700" style={{ fontWeight: 600 }}>Checklist de Mobilidade</h3>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
              <span className="text-sm text-emerald-600" style={{ fontWeight: 600 }}>{checklistPct}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {uni.checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  item.completed ? 'bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${item.completed ? 'text-emerald-700 line-through' : 'text-slate-700'}`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'diary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-700" style={{ fontWeight: 600 }}>Diário de Decisão</h3>
            <button
              onClick={() => setShowDiaryInput(!showDiaryInput)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" /> Nova entrada
            </button>
          </div>

          {showDiaryInput && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
              <div className="text-xs text-slate-400 mb-2">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <textarea
                value={newDiaryEntry}
                onChange={(e) => setNewDiaryEntry(e.target.value)}
                rows={3}
                placeholder="O que você descobriu hoje? Conversa com aluno, resposta da universidade, nova informação..."
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button onClick={addDiaryEntry} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700">
                  Salvar
                </button>
                <button onClick={() => { setShowDiaryInput(false); setNewDiaryEntry(''); }} className="py-2 px-4 border border-slate-200 rounded-xl text-sm text-slate-600">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {uni.diary.length === 0 && !showDiaryInput ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <div className="text-3xl mb-3">📔</div>
              <div className="text-slate-500 text-sm">Nenhuma entrada no diário</div>
            </div>
          ) : (
            <div className="space-y-3">
              {[...uni.diary].reverse().map((entry) => (
                <div key={entry.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>
                      {new Date(entry.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <button
                      onClick={() => deleteDiaryEntry(entry.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
