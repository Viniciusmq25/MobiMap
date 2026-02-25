import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp, calcMonthlyTotal, calcScoreBreakdown } from '../context/AppContext';
import { Weights, DEFAULT_WEIGHTS, WeightPreset } from '../types';
import {
  Trophy,
  Save,
  RotateCcw,
  Info,
  ChevronRight,
  Heart,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
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

const WEIGHT_LABELS: Record<keyof Weights, { label: string; description: string; icon: string }> = {
  totalCost: { label: 'Custo Total', description: 'Peso para custo mensal de vida', icon: '💰' },
  housing: { label: 'Moradia', description: 'Peso para custo de aluguel', icon: '🏠' },
  stemStrength: { label: 'Força STEM', description: 'Reputação e qualidade acadêmica', icon: '🔬' },
  workOpportunities: { label: 'Trabalho', description: 'Estágio, networking, carreira', icon: '💼' },
  languageAdaptation: { label: 'Idioma/Adaptação', description: 'Facilidade de adaptação e idioma', icon: '🌍' },
  qualityOfLife: { label: 'Qualidade de Vida', description: 'Segurança, bem-estar, conforto', icon: '⭐' },
  climate: { label: 'Clima', description: 'Adequação do clima ao seu perfil', icon: '☀️' },
  studentLife: { label: 'Vida Estudantil', description: 'Comunidade, transporte, lazer', icon: '🎓' },
  bureaucracyEase: { label: 'Burocracia', description: 'Facilidade de visto e documentação', icon: '📋' },
  emotionalFit: { label: 'Fit Pessoal', description: '"Me vejo vivendo lá"', icon: '❤️' },
};

function WeightSlider({
  weightKey,
  value,
  onChange,
}: {
  weightKey: keyof Weights;
  value: number;
  onChange: (v: number) => void;
}) {
  const info = WEIGHT_LABELS[weightKey];
  const pct = (value / 10) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{info.icon}</span>
          <div>
            <div className="text-sm text-slate-700">{info.label}</div>
            <div className="text-xs text-slate-400">{info.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-sm w-6 text-right text-emerald-600"
            style={{ fontWeight: 700 }}
          >
            {value}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
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

export function Ranking() {
  const { state, dispatch, getRankedUniversities, getBadges } = useApp();
  const navigate = useNavigate();
  const [weights, setWeights] = useState<Weights>({ ...state.weights });
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Calculate ranked with current (possibly unsaved) weights
  const ranked = state.universities
    .filter((u) => u.status !== 'discarded')
    .map((u) => ({
      university: u,
      breakdown: calcScoreBreakdown(u, state.universities, weights),
    }))
    .sort((a, b) => b.breakdown.finalScore - a.breakdown.finalScore);

  function applyWeights() {
    dispatch({ type: 'SET_WEIGHTS', payload: weights });
  }

  function resetWeights() {
    setWeights({ ...DEFAULT_WEIGHTS });
    dispatch({ type: 'SET_WEIGHTS', payload: DEFAULT_WEIGHTS });
  }

  function savePreset() {
    if (!presetName.trim()) return;
    const preset: WeightPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      weights: { ...weights },
    };
    dispatch({ type: 'SAVE_PRESET', payload: preset });
    setPresetName('');
    setShowSavePreset(false);
  }

  function loadPreset(preset: WeightPreset) {
    setWeights({ ...preset.weights });
    dispatch({ type: 'SET_WEIGHTS', payload: preset.weights });
  }

  const topUni = ranked[0]?.university;
  const topBreakdown = ranked[0]?.breakdown;

  const radarData = topBreakdown && topUni
    ? [
        { subject: 'Custo', A: topBreakdown.costScore },
        { subject: 'STEM', A: topBreakdown.stemScore },
        { subject: 'Trabalho', A: topBreakdown.workScore },
        { subject: 'Adaptação', A: topBreakdown.adaptationScore },
        { subject: 'QdV', A: topBreakdown.qualityScore },
        { subject: 'Fit', A: topBreakdown.emotionalScoreVal },
      ]
    : [];

  const barData = ranked.map((r) => ({
    name: r.university.acronym,
    score: r.breakdown.finalScore,
    flag: r.university.flag,
  }));

  const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

  function generateExplanation(idx: number, u: typeof ranked[0]) {
    if (!u) return '';
    const br = u.breakdown;
    const strong = [];
    const weak = [];
    if (br.stemScore >= 8) strong.push('excelência em STEM');
    if (br.costScore >= 7) strong.push('custo competitivo');
    if (br.workScore >= 7) strong.push('boas oportunidades de trabalho');
    if (br.emotionalScoreVal >= 8) strong.push('alto fit pessoal');
    if (br.adaptationScore >= 7) strong.push('fácil adaptação');
    if (br.stemScore <= 5) weak.push('STEM menos forte');
    if (br.costScore <= 4) weak.push('custo elevado');
    if (br.adaptationScore <= 5) weak.push('desafios de adaptação');

    if (idx === 0) {
      return `Lidera o ranking por: ${strong.slice(0, 2).join(' e ') || 'equilíbrio geral nos critérios'}.`;
    }
    return `${strong.length > 0 ? `Pontos fortes: ${strong.slice(0, 1).join(', ')}.` : ''} ${weak.length > 0 ? `Limita score por: ${weak.slice(0, 1).join(', ')}.` : ''}`.trim();
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>
            Ranking Personalizado
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ajuste os pesos para cada critério e veja o ranking atualizar em tempo real
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Weight sliders */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-700 text-base" style={{ fontWeight: 600 }}>Pesos dos Critérios</h2>
              <div className="flex gap-2">
                <button
                  onClick={resetWeights}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  title="Resetar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSavePreset(!showSavePreset)}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  title="Salvar preset"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showSavePreset && (
              <div className="mb-4 flex gap-2">
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nome do preset..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={savePreset}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700"
                >
                  Salvar
                </button>
              </div>
            )}

            <div className="space-y-4">
              {(Object.keys(weights) as (keyof Weights)[]).map((key) => (
                <WeightSlider
                  key={key}
                  weightKey={key}
                  value={weights[key]}
                  onChange={(v) => {
                    const newW = { ...weights, [key]: v };
                    setWeights(newW);
                    dispatch({ type: 'SET_WEIGHTS', payload: newW });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-slate-700 mb-3 text-sm" style={{ fontWeight: 600 }}>Presets</h3>
            <div className="space-y-2">
              {state.weightPresets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between">
                  <button
                    onClick={() => loadPreset(preset)}
                    className="flex-1 text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-sm text-slate-700 hover:text-emerald-700 transition-colors"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_PRESET', payload: preset.id })}
                    className="text-slate-300 hover:text-red-400 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Ranking + charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-slate-700 mb-4 text-base" style={{ fontWeight: 600 }}>Score por Opção</h2>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(2), 'Score']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={COLORS[Math.min(i, COLORS.length - 1)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">Nenhuma opção</div>
            )}
          </div>

          {/* Ranked list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-slate-700 text-base" style={{ fontWeight: 600 }}>Ranking Atual</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {ranked.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Nenhuma opção ativa. <button onClick={() => navigate('/universidades/nova')} className="text-emerald-600 underline">Adicionar</button>
                </div>
              )}
              {ranked.map(({ university: u, breakdown }, idx) => {
                const isSelected = selectedId === u.id;
                const explanation = generateExplanation(idx, { university: u, breakdown });
                return (
                  <div key={u.id}>
                    <div
                      onClick={() => setSelectedId(isSelected ? null : u.id)}
                      className={`flex items-start gap-4 p-5 cursor-pointer transition-all hover:bg-emerald-50 ${
                        isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                      }`}
                    >
                      {/* Position badge */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base
                          ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}
                        `}
                        style={{ fontWeight: 700 }}
                      >
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
                            {u.flag} {u.acronym}
                          </span>
                          {u.isFavorite && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                          {getBadges(u).slice(0, 2).map((b) => (
                            <span key={b} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                              {b}
                            </span>
                          ))}
                          {idx === 0 && (
                            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                              🏆 Recomendado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mb-2">{u.city}, {u.country} · {u.language || '—'}</div>
                        {explanation && (
                          <div className="text-xs text-slate-500 italic">{explanation}</div>
                        )}

                        {/* Mini score breakdown */}
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[
                            { label: 'Custo', val: breakdown.costScore, color: '#10b981' },
                            { label: 'STEM', val: breakdown.stemScore, color: '#0d9488' },
                            { label: 'Trabalho', val: breakdown.workScore, color: '#3b82f6' },
                            { label: 'Fit', val: breakdown.emotionalScoreVal, color: '#ec4899' },
                          ].map((s) => (
                            <div key={s.label} className="text-center">
                              <div className="text-xs text-slate-400 mb-0.5">{s.label}</div>
                              <div className="text-xs" style={{ fontWeight: 600, color: s.color }}>
                                {s.val.toFixed(1)}
                              </div>
                              <div className="mt-0.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${s.val * 10}%`, background: s.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div
                          className="text-3xl text-emerald-700"
                          style={{ fontWeight: 800 }}
                        >
                          {breakdown.finalScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-400">/10</div>
                        <div className="text-xs text-emerald-600 mt-1">
                          €{calcMonthlyTotal(u).toLocaleString()}/mês
                        </div>
                      </div>
                    </div>

                    {/* Expanded breakdown */}
                    {isSelected && (
                      <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-slate-600 mb-3" style={{ fontWeight: 600 }}>
                              Score Breakdown Detalhado
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: 'Custo total', val: breakdown.costScore, weight: weights.totalCost },
                                { label: 'Moradia', val: breakdown.housingScore, weight: weights.housing },
                                { label: 'STEM', val: breakdown.stemScore, weight: weights.stemStrength },
                                { label: 'Trabalho', val: breakdown.workScore, weight: weights.workOpportunities },
                                { label: 'Adaptação', val: breakdown.adaptationScore, weight: weights.languageAdaptation },
                                { label: 'Qualidade de vida', val: breakdown.qualityScore, weight: weights.qualityOfLife },
                                { label: 'Clima', val: breakdown.climateScoreVal, weight: weights.climate },
                                { label: 'Fit pessoal', val: breakdown.emotionalScoreVal, weight: weights.emotionalFit },
                              ].map((s) => (
                                <div key={s.label} className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 w-28">{s.label}</span>
                                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${s.val * 10}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-6">{s.val.toFixed(1)}</span>
                                  <span className="text-xs text-slate-400 w-12">(×{s.weight})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <ResponsiveContainer width="100%" height={200}>
                              <RadarChart
                                data={[
                                  { subject: 'Custo', A: breakdown.costScore },
                                  { subject: 'STEM', A: breakdown.stemScore },
                                  { subject: 'Trabalho', A: breakdown.workScore },
                                  { subject: 'Adaptação', A: breakdown.adaptationScore },
                                  { subject: 'QdV', A: breakdown.qualityScore },
                                  { subject: 'Fit', A: breakdown.emotionalScoreVal },
                                ]}
                              >
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                <Radar dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => navigate(`/universidades/${u.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs hover:bg-emerald-700"
                          >
                            Ver detalhes <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => navigate('/cenarios')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs hover:bg-teal-100"
                          >
                            Simular orçamento <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
