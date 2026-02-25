import React from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  MapPin,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  Briefcase,
  Heart,
} from 'lucide-react';
import { useApp, calcMonthlyTotal, calcSixMonthTotal } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Cell,
} from 'recharts';
import { University } from '../types';

const STATUS_CONFIG = {
  interested: { label: 'Interessado', color: 'bg-blue-100 text-blue-700' },
  candidate: { label: 'Candidato', color: 'bg-emerald-100 text-emerald-700' },
  approved: { label: 'Aprovado', color: 'bg-teal-100 text-teal-700' },
  discarded: { label: 'Descartado', color: 'bg-slate-100 text-slate-500' },
};

const PRIORITY_CONFIG = {
  A: { label: 'A', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  B: { label: 'B', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  C: { label: 'C', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-teal-400' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function DeadlineBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft < 0)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Vencido</span>;
  if (daysLeft <= 14)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠️ {daysLeft}d</span>;
  if (daysLeft <= 30)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{daysLeft}d</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{daysLeft}d</span>;
}

export function Dashboard() {
  const { state, getRankedUniversities, getUpcomingDeadlines, getBadges } = useApp();
  const navigate = useNavigate();
  const ranked = getRankedUniversities().slice(0, 3);
  const deadlines = getUpcomingDeadlines().slice(0, 6);
  const all = state.universities;

  const avgMonthly =
    all.length > 0
      ? Math.round(all.reduce((s, u) => s + calcMonthlyTotal(u), 0) / all.length)
      : 0;

  const favorites = all.filter((u) => u.isFavorite);
  const candidates = all.filter((u) => u.status === 'candidate' || u.status === 'approved');

  const costChartData = all
    .filter((u) => u.status !== 'discarded')
    .map((u) => ({
      name: u.acronym,
      mensal: calcMonthlyTotal(u),
      semestre: Math.round(calcSixMonthTotal(u) / 1000),
    }))
    .sort((a, b) => a.mensal - b.mensal);

  const topRanked = ranked[0];
  const radarData = topRanked
    ? [
        { subject: 'STEM', A: topRanked.breakdown.stemScore },
        { subject: 'Carreira', A: topRanked.breakdown.workScore },
        { subject: 'Custo', A: topRanked.breakdown.costScore },
        { subject: 'QdV', A: topRanked.breakdown.qualityScore },
        { subject: 'Clima', A: topRanked.breakdown.climateScoreVal },
        { subject: 'Fit', A: topRanked.breakdown.emotionalScoreVal },
      ]
    : [];

  const statCards = [
    {
      label: 'Opções cadastradas',
      value: all.length,
      sub: `${candidates.length} candidaturas ativas`,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Custo médio/mês',
      value: `€${avgMonthly.toLocaleString()}`,
      sub: `€${Math.round(avgMonthly * 6).toLocaleString()} em 6 meses`,
      icon: DollarSign,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'Favoritas',
      value: favorites.length,
      sub: 'na sua shortlist',
      icon: Heart,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      label: 'Prazos próximos',
      value: deadlines.filter((d) => d.daysLeft <= 30).length,
      sub: 'nos próximos 30 dias',
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>
            Olá! 👋 Bem-vindo ao MobiMap STEM
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Planeje sua mobilidade acadêmica internacional com clareza e dados.
          </p>
        </div>
        <button
          onClick={() => navigate('/universidades/nova')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova opção
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-2xl text-slate-800 mb-0.5" style={{ fontWeight: 700 }}>
              {card.value}
            </div>
            <div className="text-xs text-slate-400">{card.label}</div>
            <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Ranking */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-slate-800 flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Ranking Atual
            </h2>
            <button
              onClick={() => navigate('/ranking')}
              className="text-emerald-600 text-sm flex items-center gap-1 hover:text-emerald-700"
            >
              Ver ranking <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {ranked.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhuma opção cadastrada ainda.{' '}
                <button
                  onClick={() => navigate('/universidades/nova')}
                  className="text-emerald-600 underline"
                >
                  Adicionar
                </button>
              </div>
            )}
            {ranked.map(({ university: u, breakdown }, idx) => (
              <div
                key={u.id}
                onClick={() => navigate(`/universidades/${u.id}`)}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors border border-transparent hover:border-emerald-100"
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
                    ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}
                  `}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-800 text-sm truncate" style={{ fontWeight: 600 }}>
                      {u.flag} {u.acronym}
                    </span>
                    {u.priority && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-md border ${PRIORITY_CONFIG[u.priority].color}`}
                      >
                        {u.priority}
                      </span>
                    )}
                    {getBadges(u).slice(0, 1).map((b) => (
                      <span key={b} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {u.city}, {u.country} · €{calcMonthlyTotal(u).toLocaleString()}/mês
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">STEM</div>
                      <ScoreBar value={breakdown.stemScore} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Custo</div>
                      <ScoreBar value={breakdown.costScore} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Score</div>
                      <ScoreBar value={breakdown.finalScore} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl text-emerald-700"
                    style={{ fontWeight: 700 }}
                  >
                    {breakdown.finalScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-400">/10</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar top option */}
        {topRanked && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-50">
              <h2 className="text-slate-800 text-base">
                🥇 {topRanked.university.flag} {topRanked.university.acronym}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Perfil da opção líder</p>
            </div>
            <div className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="px-5 pb-5 space-y-2">
              {[
                { label: 'Score final', val: topRanked.breakdown.finalScore },
                { label: 'STEM', val: topRanked.breakdown.stemScore },
                { label: 'Custo', val: topRanked.breakdown.costScore },
                { label: 'Fit pessoal', val: topRanked.breakdown.emotionalScoreVal },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-20">{item.label}</span>
                  <ScoreBar value={item.val} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-slate-800 text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Custo Mensal por Opção (€)
            </h2>
          </div>
          <div className="p-4">
            {costChartData.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Nenhuma opção</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={costChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: number) => [`€${v.toLocaleString()}`, 'Mensal']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="mensal" radius={[6, 6, 0, 0]}>
                    {costChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#10b981' : index === 1 ? '#34d399' : '#6ee7b7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-slate-800 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Próximos Prazos
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {deadlines.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhum prazo cadastrado
              </div>
            )}
            {deadlines.map((d, i) => (
              <div
                key={i}
                onClick={() => navigate(`/universidades/${d.university.id}`)}
                className="flex items-center gap-3 px-6 py-3 hover:bg-emerald-50 cursor-pointer"
              >
                <span className="text-lg">{d.university.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700 truncate">
                    <span style={{ fontWeight: 600 }}>{d.type}</span> — {d.university.acronym}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(d.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <DeadlineBadge daysLeft={d.daysLeft} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All universities quick view */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <h2 className="text-slate-800 text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Todas as Opções
          </h2>
          <button
            onClick={() => navigate('/universidades')}
            className="text-emerald-600 text-sm flex items-center gap-1 hover:text-emerald-700"
          >
            Gerenciar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {all.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/universidades/${u.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">
                {u.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800 truncate" style={{ fontWeight: 600 }}>
                  {u.acronym}
                </div>
                <div className="text-xs text-slate-400 truncate">{u.city}</div>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[u.status].color}`}
                >
                  {STATUS_CONFIG[u.status].label}
                </span>
              </div>
            </div>
          ))}
          <div
            onClick={() => navigate('/universidades/nova')}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-sm text-emerald-500">Adicionar opção</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function GraduationCap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
