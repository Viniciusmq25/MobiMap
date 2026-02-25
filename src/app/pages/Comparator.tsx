import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp, calcMonthlyTotal, calcSixMonthTotal } from '../context/AppContext';
import { University } from '../types';
import { Plus, X, ChevronRight, CheckCircle, XCircle, Minus } from 'lucide-react';

const STATUS_CONFIG = {
  interested: { label: 'Interessado', color: 'bg-blue-100 text-blue-700' },
  candidate: { label: 'Candidato', color: 'bg-emerald-100 text-emerald-700' },
  approved: { label: 'Aprovado', color: 'bg-teal-100 text-teal-700' },
  discarded: { label: 'Descartado', color: 'bg-slate-100 text-slate-500' },
};

type CriteriaRow = {
  label: string;
  category: string;
  getValue: (u: University) => number | string;
  type: 'score' | 'currency' | 'text' | 'badge';
  higherIsBetter?: boolean;
  format?: (v: number | string) => string;
};

const CRITERIA: CriteriaRow[] = [
  // General
  { label: 'Cidade', category: 'Geral', getValue: (u) => u.city, type: 'text' },
  { label: 'País', category: 'Geral', getValue: (u) => u.country, type: 'text' },
  { label: 'Idioma', category: 'Geral', getValue: (u) => u.language || '—', type: 'text' },
  { label: 'Status', category: 'Geral', getValue: (u) => u.status, type: 'badge' },
  // Costs
  { label: 'Aluguel/mês', category: 'Custos', getValue: (u) => u.monthlyRent, type: 'currency', higherIsBetter: false },
  { label: 'Alimentação/mês', category: 'Custos', getValue: (u) => u.monthlyFood, type: 'currency', higherIsBetter: false },
  { label: 'Transporte/mês', category: 'Custos', getValue: (u) => u.monthlyTransport, type: 'currency', higherIsBetter: false },
  { label: 'Total mensal', category: 'Custos', getValue: (u) => calcMonthlyTotal(u), type: 'currency', higherIsBetter: false },
  { label: 'Custos chegada', category: 'Custos', getValue: (u) => u.flightCost + u.visaCost + u.housingDeposit + u.setupCost + u.insuranceCost, type: 'currency', higherIsBetter: false },
  { label: 'Total 6 meses', category: 'Custos', getValue: (u) => calcSixMonthTotal(u), type: 'currency', higherIsBetter: false },
  { label: 'Bolsa/mês', category: 'Custos', getValue: (u) => u.scholarship, type: 'currency', higherIsBetter: true },
  // Academic
  { label: 'Reputação STEM', category: 'Acadêmico', getValue: (u) => u.stemReputation, type: 'score', higherIsBetter: true },
  { label: 'Pesquisa', category: 'Acadêmico', getValue: (u) => u.researchOpportunities, type: 'score', higherIsBetter: true },
  { label: 'Disciplinas inglês', category: 'Acadêmico', getValue: (u) => u.englishCourses, type: 'score', higherIsBetter: true },
  { label: 'Compatib. créditos', category: 'Acadêmico', getValue: (u) => u.creditCompatibility, type: 'score', higherIsBetter: true },
  { label: 'Acesso labs', category: 'Acadêmico', getValue: (u) => u.labAccess, type: 'score', higherIsBetter: true },
  // Work
  { label: 'Chance de estágio', category: 'Trabalho', getValue: (u) => u.internshipChance, type: 'score', higherIsBetter: true },
  { label: 'Networking', category: 'Trabalho', getValue: (u) => u.networkingQuality, type: 'score', higherIsBetter: true },
  { label: 'Ecossistema startups', category: 'Trabalho', getValue: (u) => u.startupEcosystem, type: 'score', higherIsBetter: true },
  // Adaptation
  { label: 'Facilidade idioma', category: 'Adaptação', getValue: (u) => u.languageDifficulty, type: 'score', higherIsBetter: true },
  { label: 'Clima (fit)', category: 'Adaptação', getValue: (u) => u.climateScore, type: 'score', higherIsBetter: true },
  { label: 'Segurança', category: 'Adaptação', getValue: (u) => u.safety, type: 'score', higherIsBetter: true },
  { label: 'Qualidade de vida', category: 'Adaptação', getValue: (u) => u.qualityOfLife, type: 'score', higherIsBetter: true },
  { label: 'Comunidade int.', category: 'Adaptação', getValue: (u) => u.internationalCommunity, type: 'score', higherIsBetter: true },
  { label: 'Transporte público', category: 'Adaptação', getValue: (u) => u.publicTransport, type: 'score', higherIsBetter: true },
  // Personal
  { label: 'Fit emocional', category: 'Pessoal', getValue: (u) => u.emotionalScore, type: 'score', higherIsBetter: true },
];

function getBestWorst(rows: { value: number | string; uniId: string }[], higherIsBetter?: boolean) {
  if (higherIsBetter === undefined) return { best: [], worst: [] };
  const numericRows = rows.filter((r) => typeof r.value === 'number') as { value: number; uniId: string }[];
  if (numericRows.length === 0) return { best: [], worst: [] };

  const sorted = [...numericRows].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  const best = sorted[0].value;
  const worst = sorted[sorted.length - 1].value;

  return {
    best: numericRows.filter((r) => r.value === best).map((r) => r.uniId),
    worst: numericRows.filter((r) => r.value === worst && sorted.length > 1).map((r) => r.uniId),
  };
}

export function Comparator() {
  const { state, dispatch, calcScoreBreakdown } = useApp();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    state.compareIds.length > 0 ? state.compareIds : state.universities.slice(0, 3).map((u) => u.id)
  );
  const [showSelector, setShowSelector] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const universities = selectedIds
    .map((id) => state.universities.find((u) => u.id === id))
    .filter(Boolean) as University[];

  const categories = ['all', ...Array.from(new Set(CRITERIA.map((c) => c.category)))];

  const filteredCriteria = filterCategory === 'all'
    ? CRITERIA
    : CRITERIA.filter((c) => c.category === filterCategory);

  const groupedCriteria = filteredCriteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) acc[criterion.category] = [];
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, CriteriaRow[]>);

  function addUni(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= 5) return;
    setSelectedIds([...selectedIds, id]);
  }

  function removeUni(id: string) {
    setSelectedIds(selectedIds.filter((s) => s !== id));
  }

  const available = state.universities.filter((u) => !selectedIds.includes(u.id));

  return (
    <div className="p-4 lg:p-8 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>Comparador</h1>
          <p className="text-sm text-slate-500 mt-1">Compare até 5 opções lado a lado</p>
        </div>
        <button
          onClick={() => {
            dispatch({ type: 'SET_COMPARE_IDS', payload: selectedIds });
            navigate('/ranking');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm"
        >
          Ver ranking <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
              filterCategory === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-sm text-slate-500 w-40 bg-slate-50 sticky left-0 z-10">
                  Critério
                </th>
                {universities.map((u) => (
                  <th key={u.id} className="p-4 text-center min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl">{u.flag}</div>
                      <div className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                        {u.acronym}
                      </div>
                      <div className="text-xs text-slate-400">{u.city}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[u.status].color}`}>
                          {STATUS_CONFIG[u.status].label}
                        </span>
                        <button
                          onClick={() => removeUni(u.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                {universities.length < 5 && (
                  <th className="p-4 min-w-[120px]">
                    <button
                      onClick={() => setShowSelector(!showSelector)}
                      className="flex flex-col items-center gap-1 w-full text-emerald-600 hover:text-emerald-700"
                    >
                      <div className="w-10 h-10 rounded-xl border-2 border-dashed border-emerald-300 flex items-center justify-center hover:border-emerald-500 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs">Adicionar</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            {/* Score row */}
            <tbody>
              <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                <td className="p-4 text-sm text-emerald-700 sticky left-0 bg-emerald-50 z-10" style={{ fontWeight: 600 }}>
                  🏆 Score Final
                </td>
                {universities.map((u) => {
                  const breakdown = calcScoreBreakdown(u);
                  return (
                    <td key={u.id} className="p-4 text-center">
                      <div className="text-2xl text-emerald-700" style={{ fontWeight: 800 }}>
                        {breakdown.finalScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-400">/10</div>
                    </td>
                  );
                })}
                {universities.length < 5 && <td />}
              </tr>

              {Object.entries(groupedCriteria).map(([category, criteria]) => (
                <React.Fragment key={category}>
                  <tr className="bg-slate-50">
                    <td
                      colSpan={universities.length + 2}
                      className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wider sticky left-0"
                      style={{ fontWeight: 600 }}
                    >
                      {category}
                    </td>
                  </tr>
                  {criteria.map((criterion) => {
                    const values = universities.map((u) => ({
                      uniId: u.id,
                      value: criterion.getValue(u),
                    }));

                    const { best, worst } = getBestWorst(values, criterion.higherIsBetter);

                    return (
                      <tr key={criterion.label} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3 px-4 text-sm text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-50">
                          {criterion.label}
                        </td>
                        {universities.map((u) => {
                          const raw = criterion.getValue(u);
                          const isBest = best.includes(u.id);
                          const isWorst = worst.includes(u.id);

                          let content: React.ReactNode = null;

                          if (criterion.type === 'text') {
                            content = <span className="text-sm text-slate-600">{raw}</span>;
                          } else if (criterion.type === 'badge') {
                            const s = raw as keyof typeof STATUS_CONFIG;
                            content = (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[s]?.color || ''}`}>
                                {STATUS_CONFIG[s]?.label || raw}
                              </span>
                            );
                          } else if (criterion.type === 'currency') {
                            content = (
                              <span
                                className={`text-sm ${isBest ? 'text-emerald-600' : isWorst ? 'text-red-500' : 'text-slate-700'}`}
                                style={{ fontWeight: isBest ? 700 : 400 }}
                              >
                                €{(raw as number).toLocaleString()}
                              </span>
                            );
                          } else if (criterion.type === 'score') {
                            const val = raw as number;
                            content = (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`text-sm ${isBest ? 'text-emerald-600' : isWorst ? 'text-red-400' : 'text-slate-700'}`}
                                  style={{ fontWeight: isBest ? 700 : 400 }}
                                >
                                  {val}
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isBest ? 'bg-emerald-500' : isWorst ? 'bg-red-400' : 'bg-slate-300'}`}
                                    style={{ width: `${val * 10}%` }}
                                  />
                                </div>
                              </div>
                            );
                          }

                          return (
                            <td
                              key={u.id}
                              className={`p-3 text-center transition-colors ${
                                isBest ? 'bg-emerald-50' : isWorst ? 'bg-red-50/30' : ''
                              }`}
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                {content}
                                {isBest && criterion.type !== 'text' && criterion.type !== 'badge' && (
                                  <span className="text-xs text-emerald-600">✓ melhor</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        {universities.length < 5 && <td />}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add selector dropdown */}
      {showSelector && available.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
          <div className="text-sm text-slate-600 mb-3" style={{ fontWeight: 600 }}>
            Adicionar ao comparador:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {available.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  addUni(u.id);
                  setShowSelector(false);
                }}
                className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left"
              >
                <span className="text-xl">{u.flag}</span>
                <div>
                  <div className="text-sm text-slate-700" style={{ fontWeight: 600 }}>{u.acronym}</div>
                  <div className="text-xs text-slate-400">{u.city}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {universities.length < 2 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 mt-4">
          <div className="text-4xl mb-3">⚖️</div>
          <div className="text-slate-600 mb-2" style={{ fontWeight: 600 }}>Selecione ao menos 2 opções para comparar</div>
          <div className="text-slate-400 text-sm mb-4">Vá para a lista de universidades e clique em comparar</div>
          <button
            onClick={() => navigate('/universidades')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700"
          >
            Ver universidades
          </button>
        </div>
      )}
    </div>
  );
}
