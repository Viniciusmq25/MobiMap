import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp, calcMonthlyTotal, calcOneTimeTotal } from '../context/AppContext';
import { University } from '../types';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Home,
  Bus,
  Phone,
  Coffee,
  Plane,
  Heart,
  AlertCircle,
  DollarSign,
  Plus,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

type Profile = 'economico' | 'realista' | 'confortavel';

const PROFILES: Record<Profile, { label: string; icon: string; multiplier: Record<string, number>; color: string }> = {
  economico: {
    label: 'Super Econômico',
    icon: '🟢',
    multiplier: {
      rent: 0.75,
      food: 0.7,
      transport: 0.8,
      phone: 0.9,
      academic: 0.7,
      leisure: 0.5,
      travel: 0.5,
      health: 0.9,
      misc: 0.6,
    },
    color: '#10b981',
  },
  realista: {
    label: 'Realista',
    icon: '🔵',
    multiplier: {
      rent: 1.0,
      food: 1.0,
      transport: 1.0,
      phone: 1.0,
      academic: 1.0,
      leisure: 1.0,
      travel: 1.0,
      health: 1.0,
      misc: 1.0,
    },
    color: '#3b82f6',
  },
  confortavel: {
    label: 'Confortável',
    icon: '🟡',
    multiplier: {
      rent: 1.4,
      food: 1.3,
      transport: 1.2,
      phone: 1.1,
      academic: 1.3,
      leisure: 1.8,
      travel: 1.6,
      health: 1.2,
      misc: 1.4,
    },
    color: '#f59e0b',
  },
};

type ScenarioKey =
  | 'dormitory'
  | 'sharedRoom'
  | 'scholarship'
  | 'partTime'
  | 'euroBrl'
  | 'betterCity';

const SCENARIOS: {
  key: ScenarioKey;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: 'dormitory',
    label: 'Residência universitária',
    description: 'Se eu conseguir moradia na universidade (−30% aluguel)',
    icon: '🏛️',
  },
  {
    key: 'sharedRoom',
    label: 'Dividir quarto',
    description: 'Se eu dividir quarto com colega (−20% aluguel)',
    icon: '🛏️',
  },
  {
    key: 'scholarship',
    label: 'Receber bolsa extra +€200',
    description: 'Com bolsa adicional de €200/mês',
    icon: '🎓',
  },
  {
    key: 'partTime',
    label: 'Trabalho part-time +€400',
    description: 'Com trabalho part-time de ~€400/mês',
    icon: '💼',
  },
  {
    key: 'euroBrl',
    label: 'Euro sobe 15%',
    description: 'Impacto se a taxa EUR/BRL subir 15%',
    icon: '📈',
  },
  {
    key: 'betterCity',
    label: 'Cidade mais barata',
    description: 'Morando em cidade vizinha (−15% custos totais)',
    icon: '🏙️',
  },
];

function applyProfile(
  uni: University,
  profile: Profile
): {
  rent: number;
  food: number;
  transport: number;
  phone: number;
  academic: number;
  leisure: number;
  travel: number;
  health: number;
  misc: number;
} {
  const m = PROFILES[profile].multiplier;
  return {
    rent: Math.round(uni.monthlyRent * m.rent),
    food: Math.round(uni.monthlyFood * m.food),
    transport: Math.round(uni.monthlyTransport * m.transport),
    phone: Math.round(uni.monthlyPhone * m.phone),
    academic: Math.round(uni.monthlyAcademic * m.academic),
    leisure: Math.round(uni.monthlyLeisure * m.leisure),
    travel: Math.round(uni.monthlyTravel * m.travel),
    health: Math.round(uni.monthlyHealth * m.health),
    misc: Math.round(uni.monthlyMisc * m.misc),
  };
}

function applyScenarios(
  base: ReturnType<typeof applyProfile>,
  scholarship: number,
  scenarios: Set<ScenarioKey>,
  eurRate: number
): { costs: ReturnType<typeof applyProfile>; income: number; totalMonthly: number } {
  let costs = { ...base };
  let income = scholarship;

  if (scenarios.has('dormitory')) {
    costs.rent = Math.round(costs.rent * 0.7);
  }
  if (scenarios.has('sharedRoom')) {
    costs.rent = Math.round(costs.rent * 0.8);
  }
  if (scenarios.has('scholarship')) {
    income += 200;
  }
  if (scenarios.has('partTime')) {
    income += 400;
  }
  if (scenarios.has('betterCity')) {
    costs.rent = Math.round(costs.rent * 0.85);
    costs.food = Math.round(costs.food * 0.85);
    costs.leisure = Math.round(costs.leisure * 0.85);
  }

  const rawTotal =
    costs.rent +
    costs.food +
    costs.transport +
    costs.phone +
    costs.academic +
    costs.leisure +
    costs.travel +
    costs.health +
    costs.misc -
    income;

  let totalMonthly = rawTotal;
  if (scenarios.has('euroBrl')) {
    totalMonthly = Math.round(totalMonthly * (1 + eurRate / 100));
  }

  return { costs, income, totalMonthly };
}

const COST_ITEMS: { key: keyof ReturnType<typeof applyProfile>; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'rent', label: 'Aluguel', icon: Home, color: '#10b981' },
  { key: 'food', label: 'Alimentação', icon: Coffee, color: '#14b8a6' },
  { key: 'transport', label: 'Transporte', icon: Bus, color: '#3b82f6' },
  { key: 'phone', label: 'Celular/Internet', icon: Phone, color: '#8b5cf6' },
  { key: 'academic', label: 'Material', icon: BookOpen, color: '#f59e0b' },
  { key: 'leisure', label: 'Lazer', icon: Zap, color: '#ec4899' },
  { key: 'travel', label: 'Viagens', icon: Plane, color: '#06b6d4' },
  { key: 'health', label: 'Saúde', icon: Heart, color: '#22c55e' },
  { key: 'misc', label: 'Imprevistos', icon: AlertCircle, color: '#94a3b8' },
];

export function BudgetSimulator() {
  const { state } = useApp();
  const navigate = useNavigate();
  const unis = state.universities.filter((u) => u.status !== 'discarded');

  const [selectedId, setSelectedId] = useState<string>(unis[0]?.id || '');
  const [profile, setProfile] = useState<Profile>('realista');
  const [activeScenarios, setActiveScenarios] = useState<Set<ScenarioKey>>(new Set());
  const [eurBrlRate, setEurBrlRate] = useState(15);
  const [months, setMonths] = useState(6);
  const [extraReserve, setExtraReserve] = useState(500);
  const [showDetails, setShowDetails] = useState(false);

  const uni = unis.find((u) => u.id === selectedId);

  const baseProfile = useMemo(() => {
    if (!uni) return null;
    return applyProfile(uni, profile);
  }, [uni, profile]);

  const result = useMemo(() => {
    if (!uni || !baseProfile) return null;
    return applyScenarios(baseProfile, uni.scholarship, activeScenarios, eurBrlRate);
  }, [uni, baseProfile, activeScenarios, eurBrlRate]);

  const baselineResult = useMemo(() => {
    if (!uni || !baseProfile) return null;
    return applyScenarios(baseProfile, uni.scholarship, new Set(), 0);
  }, [uni, baseProfile]);

  const oneTime = uni ? calcOneTimeTotal(uni) : 0;
  const totalEstimate = result ? result.totalMonthly * months + oneTime + extraReserve : 0;
  const baselineTotal = baselineResult ? baselineResult.totalMonthly * months + oneTime + extraReserve : 0;
  const savingsVsBaseline = baselineTotal - totalEstimate;

  function toggleScenario(key: ScenarioKey) {
    setActiveScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const pieData = result && baseProfile
    ? COST_ITEMS.map((item) => ({
        name: item.label,
        value: result.costs[item.key],
        color: item.color,
      })).filter((d) => d.value > 0)
    : [];

  const comparisonData = unis.slice(0, 5).map((u) => {
    const base = applyProfile(u, profile);
    const r = applyScenarios(base, u.scholarship, activeScenarios, eurBrlRate);
    return {
      name: u.acronym,
      mensal: r.totalMonthly,
      total: r.totalMonthly * months + calcOneTimeTotal(u) + extraReserve,
      flag: u.flag,
    };
  });

  if (unis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl text-slate-700 mb-2" style={{ fontWeight: 600 }}>
          Nenhuma opção cadastrada
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Adicione universidades para usar o simulador de orçamento.
        </p>
        <button
          onClick={() => navigate('/universidades/nova')}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700"
        >
          Adicionar opção
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>
            Simulador de Cenários
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Calcule e compare orçamentos com diferentes perfis e cenários financeiros.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* University selector */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-slate-700 text-sm mb-3" style={{ fontWeight: 600 }}>
              Opção Selecionada
            </h2>
            <div className="space-y-2">
              {unis.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedId === u.id
                      ? 'bg-emerald-50 border-2 border-emerald-400'
                      : 'border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <span className="text-xl">{u.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-700 truncate" style={{ fontWeight: 600 }}>
                      {u.acronym}
                    </div>
                    <div className="text-xs text-slate-400">{u.city}</div>
                  </div>
                  <div className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>
                    €{calcMonthlyTotal(u).toLocaleString()}/mês
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Profile selector */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-slate-700 text-sm mb-3" style={{ fontWeight: 600 }}>
              Perfil de Gastos
            </h2>
            <div className="space-y-2">
              {(Object.entries(PROFILES) as [Profile, (typeof PROFILES)[Profile]][]).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setProfile(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    profile === key
                      ? 'border-2 text-white'
                      : 'border border-slate-100 hover:border-slate-200'
                  }`}
                  style={
                    profile === key
                      ? { background: p.color, borderColor: p.color }
                      : {}
                  }
                >
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>
                      {p.label}
                    </div>
                    <div className={`text-xs ${profile === key ? 'text-white/80' : 'text-slate-400'}`}>
                      {key === 'economico'
                        ? 'Cortar ao máximo, foco em custo'
                        : key === 'realista'
                        ? 'Baseado nos dados cadastrados'
                        : 'Conforto e qualidade de vida'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Reserve */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="text-slate-700 text-sm mb-1" style={{ fontWeight: 600 }}>
              Parâmetros
            </h2>
            <div>
              <label className="text-xs text-slate-500 block mb-2">
                Duração da estadia: <span className="text-emerald-600" style={{ fontWeight: 700 }}>{months} meses</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${(months / 12) * 100}%, #e2e8f0 ${(months / 12) * 100}%, #e2e8f0 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 mês</span>
                <span>12 meses</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-2">
                Reserva de emergência: <span className="text-emerald-600" style={{ fontWeight: 700 }}>€{extraReserve.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={0}
                max={3000}
                step={100}
                value={extraReserve}
                onChange={(e) => setExtraReserve(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${(extraReserve / 3000) * 100}%, #e2e8f0 ${(extraReserve / 3000) * 100}%, #e2e8f0 100%)`,
                }}
              />
            </div>
          </div>

          {/* Scenarios */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                Cenários "E se...?"
              </h2>
              {activeScenarios.size > 0 && (
                <button
                  onClick={() => setActiveScenarios(new Set())}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
            <div className="space-y-2">
              {SCENARIOS.map((s) => {
                const isActive = activeScenarios.has(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleScenario(s.key)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                      isActive
                        ? 'bg-teal-50 border-teal-300'
                        : 'border-slate-100 hover:border-teal-200 hover:bg-teal-50/50'
                    }`}
                  >
                    <span className="text-base mt-0.5">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs ${isActive ? 'text-teal-700' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                        {s.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.description}</div>
                    </div>
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive ? 'bg-teal-500 border-teal-500' : 'border-slate-300'
                      }`}
                    >
                      {isActive && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {activeScenarios.has('euroBrl') && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl">
                <label className="text-xs text-amber-700 block mb-2" style={{ fontWeight: 600 }}>
                  Variação EUR/BRL: +{eurBrlRate}%
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={eurBrlRate}
                  onChange={(e) => setEurBrlRate(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((eurBrlRate - 5) / 45) * 100}%, #fef3c7 ${((eurBrlRate - 5) / 45) * 100}%, #fef3c7 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel: results */}
        <div className="lg:col-span-2 space-y-4">
          {uni && result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-4 text-white col-span-2">
                  <div className="text-emerald-200 text-xs mb-1">Total Estimado ({months} meses)</div>
                  <div className="text-3xl" style={{ fontWeight: 800 }}>
                    €{totalEstimate.toLocaleString()}
                  </div>
                  {savingsVsBaseline !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${savingsVsBaseline > 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                      {savingsVsBaseline > 0 ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          Economia de €{Math.abs(savingsVsBaseline).toLocaleString()} vs. sem cenários
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          Aumento de €{Math.abs(savingsVsBaseline).toLocaleString()} vs. sem cenários
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-slate-400 text-xs mb-1">Mensal líquido</div>
                  <div className="text-xl text-emerald-700" style={{ fontWeight: 700 }}>
                    €{result.totalMonthly.toLocaleString()}
                  </div>
                  {result.income > 0 && (
                    <div className="text-xs text-slate-400 mt-1">
                      Renda: €{result.income}/mês
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-slate-400 text-xs mb-1">Chegada (único)</div>
                  <div className="text-xl text-teal-700" style={{ fontWeight: 700 }}>
                    €{oneTime.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">+€{extraReserve} reserva</div>
                </div>
              </div>

              {/* Cost breakdown table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-slate-700 text-sm" style={{ fontWeight: 600 }}>
                    Detalhamento Mensal — {uni.flag} {uni.acronym} · {PROFILES[profile].icon} {PROFILES[profile].label}
                  </h2>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    {showDetails ? (
                      <>Ocultar <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Expandir <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  {COST_ITEMS.map((item) => {
                    const base = applyProfile(uni, 'realista');
                    const current = result.costs[item.key];
                    const diff = current - base[item.key];
                    const pct = (current / (result.totalMonthly + result.income)) * 100;

                    return (
                      <div key={item.key} className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: item.color + '20' }}
                        >
                          <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        </div>
                        <span className="text-xs text-slate-500 w-24 flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(pct * 2, 100)}%`, background: item.color }}
                          />
                        </div>
                        <span className="text-xs text-slate-700 w-12 text-right" style={{ fontWeight: 600 }}>
                          €{current.toLocaleString()}
                        </span>
                        {showDetails && diff !== 0 && (
                          <span className={`text-xs w-14 text-right ${diff < 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                            {diff < 0 ? '−' : '+'}€{Math.abs(diff)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 mt-4 pt-3 space-y-1">
                  {result.income > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-600">− Bolsa/Renda</span>
                      <span className="text-emerald-600" style={{ fontWeight: 600 }}>
                        −€{result.income.toLocaleString()}/mês
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm" style={{ fontWeight: 700 }}>
                    <span className="text-slate-700">Total mensal líquido</span>
                    <span className="text-emerald-700">€{result.totalMonthly.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Pie + 6 months breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-slate-700 text-sm mb-3" style={{ fontWeight: 600 }}>
                    Distribuição dos Gastos
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`€${v}`, '']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {pieData.slice(0, 6).map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-slate-500 truncate">{d.name}</span>
                        <span className="text-xs text-slate-600 ml-auto" style={{ fontWeight: 500 }}>€{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-slate-700 text-sm mb-3" style={{ fontWeight: 600 }}>
                    Resumo Total ({months} meses)
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">Mensal × {months} meses</div>
                      <div className="text-lg text-emerald-700" style={{ fontWeight: 700 }}>
                        €{(result.totalMonthly * months).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Custos de chegada</span>
                      <span className="text-slate-700">€{oneTime.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Reserva de emergência</span>
                      <span className="text-slate-700">€{extraReserve.toLocaleString()}</span>
                    </div>
                    <div
                      className="flex justify-between text-base border-t border-slate-100 pt-2"
                      style={{ fontWeight: 700 }}
                    >
                      <span className="text-slate-800">TOTAL ESTIMADO</span>
                      <span className="text-emerald-700">€{totalEstimate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Em BRL (câmbio ~6,0)</span>
                      <span>R$ {Math.round(totalEstimate * 6).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profiles comparison */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-slate-700 text-sm mb-4" style={{ fontWeight: 600 }}>
                  Comparação entre Perfis — {uni.flag} {uni.acronym}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(PROFILES) as [Profile, (typeof PROFILES)[Profile]][]).map(([key, p]) => {
                    const base = applyProfile(uni, key);
                    const r = applyScenarios(base, uni.scholarship, activeScenarios, eurBrlRate);
                    const total = r.totalMonthly * months + oneTime + extraReserve;
                    const isActive = profile === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setProfile(key)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-2 border-emerald-500 bg-emerald-50'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="text-lg mb-1">{p.icon}</div>
                        <div className="text-xs text-slate-500 mb-2">{p.label}</div>
                        <div
                          className="text-base"
                          style={{ fontWeight: 700, color: p.color }}
                        >
                          €{r.totalMonthly.toLocaleString()}/mês
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          €{total.toLocaleString()} total
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All universities comparison */}
              {comparisonData.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-slate-700 text-sm mb-4" style={{ fontWeight: 600 }}>
                    Comparação entre Opções — {PROFILES[profile].label} · {months} meses
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        formatter={(v: number, name: string) => [
                          `€${v.toLocaleString()}`,
                          name === 'mensal' ? 'Por mês' : `Total ${months} meses`,
                        ]}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                      <Bar dataKey="mensal" name="mensal" radius={[6, 6, 0, 0]}>
                        {comparisonData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.name === uni.acronym ? '#10b981' : '#e2e8f0'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                    {comparisonData.map((d) => (
                      <div
                        key={d.name}
                        className={`text-center p-2 rounded-xl ${
                          d.name === uni.acronym ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                        }`}
                      >
                        <div className="text-base">{d.flag}</div>
                        <div className="text-xs text-slate-600 truncate" style={{ fontWeight: 600 }}>
                          {d.name}
                        </div>
                        <div className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>
                          €{d.mensal.toLocaleString()}/mês
                        </div>
                        <div className="text-xs text-slate-400">
                          €{(d.total / 1000).toFixed(1)}k total
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active scenarios summary */}
              {activeScenarios.size > 0 && (
                <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
                  <h3 className="text-teal-800 text-sm mb-3" style={{ fontWeight: 600 }}>
                    🎯 Cenários Ativos — Impacto no Orçamento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SCENARIOS.filter((s) => activeScenarios.has(s.key)).map((s) => (
                      <div key={s.key} className="flex items-center gap-2 bg-white rounded-xl p-3">
                        <span className="text-base">{s.icon}</span>
                        <div className="flex-1">
                          <div className="text-xs text-teal-700" style={{ fontWeight: 600 }}>
                            {s.label}
                          </div>
                          <div className="text-xs text-slate-400">{s.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-teal-200 flex items-center justify-between">
                    <span className="text-sm text-teal-700">
                      Impacto total vs. sem cenários:
                    </span>
                    <span
                      className={`text-sm ${savingsVsBaseline > 0 ? 'text-emerald-600' : 'text-red-500'}`}
                      style={{ fontWeight: 700 }}
                    >
                      {savingsVsBaseline > 0 ? '−' : '+'}€{Math.abs(savingsVsBaseline).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}