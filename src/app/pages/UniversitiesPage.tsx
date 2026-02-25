import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Heart,
  MapPin,
  Star,
  GitCompareArrows,
  Edit2,
  Trash2,
  Copy,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp, calcMonthlyTotal, calcSixMonthTotal } from '../context/AppContext';
import { University, Status, Priority } from '../types';

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  interested: { label: 'Interessado', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  candidate: { label: 'Candidato', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  approved: { label: 'Aprovado', color: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  discarded: { label: 'Descartado', color: 'bg-slate-100 text-slate-400', dot: 'bg-slate-300' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  A: { label: 'Sonho', color: 'bg-amber-100 text-amber-700' },
  B: { label: 'Forte', color: 'bg-blue-100 text-blue-700' },
  C: { label: 'Backup', color: 'bg-slate-100 text-slate-500' },
};

function ScoreRing({ value }: { value: number }) {
  const pct = value / 10;
  const r = 18;
  const c = 2 * Math.PI * r;
  const dashOffset = c - pct * c;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={value >= 7 ? '#10b981' : value >= 5 ? '#14b8a6' : '#f59e0b'}
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="26" textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="700">
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

export function UniversitiesPage() {
  const { state, dispatch, getRankedUniversities, getBadges, calcScoreBreakdown } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'cost' | 'status'>('score');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const ranked = getRankedUniversities();

  const filtered = ranked
    .filter(({ university: u }) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.city.toLowerCase().includes(search.toLowerCase()) ||
        u.country.toLowerCase().includes(search.toLowerCase()) ||
        u.acronym.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || u.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.breakdown.finalScore - a.breakdown.finalScore;
      if (sortBy === 'cost') return calcMonthlyTotal(a.university) - calcMonthlyTotal(b.university);
      if (sortBy === 'name') return a.university.acronym.localeCompare(b.university.acronym);
      return 0;
    });

  // include discarded too if statusFilter is 'all' or 'discarded'
  const allItems = [...filtered];
  if (statusFilter === 'discarded' || statusFilter === 'all') {
    const discarded = state.universities
      .filter((u) => u.status === 'discarded')
      .filter((u) => {
        const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.acronym.toLowerCase().includes(search.toLowerCase());
        const matchPriority = priorityFilter === 'all' || u.priority === priorityFilter;
        return matchSearch && matchPriority;
      })
      .map((u) => ({ university: u, breakdown: calcScoreBreakdown(u) }));
    // Add discarded that aren't already in filtered
    const filteredIds = filtered.map(f => f.university.id);
    discarded.forEach(d => {
      if (!filteredIds.includes(d.university.id)) allItems.push(d);
    });
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_UNIVERSITY', payload: id });
    setConfirmDelete(null);
  }

  function handleDuplicate(id: string) {
    dispatch({ type: 'DUPLICATE_UNIVERSITY', payload: id });
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>
            Minhas Opções
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {state.universities.length} opções cadastradas
          </p>
        </div>
        <button
          onClick={() => navigate('/universidades/nova')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Nova opção
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar universidade, cidade, país..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
            className="px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-400 text-slate-600"
          >
            <option value="all">Todos os status</option>
            <option value="interested">Interessado</option>
            <option value="candidate">Candidato</option>
            <option value="approved">Aprovado</option>
            <option value="discarded">Descartado</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
            className="px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-400 text-slate-600"
          >
            <option value="all">Todas as prioridades</option>
            <option value="A">A – Sonho</option>
            <option value="B">B – Forte candidata</option>
            <option value="C">C – Backup</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-400 text-slate-600"
          >
            <option value="score">Ordenar: Score</option>
            <option value="cost">Ordenar: Custo</option>
            <option value="name">Ordenar: Nome</option>
          </select>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}
            >
              ▦
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${view === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      {allItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="text-4xl mb-3">🎓</div>
          <div className="text-slate-600 mb-2" style={{ fontWeight: 600 }}>Nenhuma opção encontrada</div>
          <div className="text-slate-400 text-sm mb-4">
            {search ? 'Tente outro termo de busca' : 'Comece adicionando sua primeira opção'}
          </div>
          <button
            onClick={() => navigate('/universidades/nova')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700"
          >
            + Adicionar opção
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allItems.map(({ university: u, breakdown }, idx) => {
            const monthly = calcMonthlyTotal(u);
            const badges = getBadges(u);
            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ${
                  u.status === 'discarded' ? 'opacity-60 border-slate-100' : 'border-slate-100 hover:border-emerald-200'
                }`}
              >
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">
                        {u.flag}
                      </div>
                      <div>
                        <div className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>{u.acronym}</div>
                        <div className="text-slate-400 text-xs">{u.city}, {u.country}</div>
                      </div>
                    </div>
                    <ScoreRing value={breakdown.finalScore} />
                  </div>

                  {/* Badges */}
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {badges.map((b) => (
                        <span key={b} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[u.status].color}`}>
                      {STATUS_CONFIG[u.status].label}
                    </span>
                    {u.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[u.priority].color}`}>
                        {u.priority} – {PRIORITY_CONFIG[u.priority].label}
                      </span>
                    )}
                    {u.isFavorite && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                  </div>

                  {/* Scores mini */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {[
                      { label: 'STEM', val: breakdown.stemScore },
                      { label: 'Trabalho', val: breakdown.workScore },
                      { label: 'Custo', val: breakdown.costScore },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-2">
                        <div className="text-xs text-slate-400">{s.label}</div>
                        <div
                          className="text-sm text-slate-700"
                          style={{ fontWeight: 600 }}
                        >
                          {s.val.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-emerald-600 text-sm" style={{ fontWeight: 700 }}>
                        €{monthly.toLocaleString()}/mês
                      </div>
                      <div className="text-slate-400 text-xs">
                        €{Math.round(calcSixMonthTotal(u) / 1000)}k em 6 meses
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{u.language}</div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center gap-1 px-4 py-3 border-t border-slate-50 bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => navigate(`/universidades/${u.id}`)}
                    className="flex-1 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => navigate(`/universidades/${u.id}/editar`)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: u.id })}
                    className="p-1.5 rounded-lg transition-colors hover:bg-rose-50"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${u.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-300 hover:text-rose-400'}`}
                    />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_COMPARE', payload: u.id })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      state.compareIds.includes(u.id)
                        ? 'text-teal-600 bg-teal-50'
                        : 'text-slate-300 hover:text-teal-500 hover:bg-teal-50'
                    }`}
                  >
                    <GitCompareArrows className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(u.id)}
                    className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50 text-xs text-slate-500 border-b border-slate-100">
            <div className="col-span-4">Universidade</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-2 text-center">STEM</div>
            <div className="col-span-2 text-center">Mensal</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
          <div className="divide-y divide-slate-50">
            {allItems.map(({ university: u, breakdown }) => {
              const monthly = calcMonthlyTotal(u);
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-12 gap-2 px-6 py-4 hover:bg-emerald-50 transition-colors items-center"
                >
                  <div
                    className="col-span-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/universidades/${u.id}`)}
                  >
                    <span className="text-xl">{u.flag}</span>
                    <div>
                      <div className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                        {u.acronym}
                      </div>
                      <div className="text-xs text-slate-400">{u.city}</div>
                    </div>
                    {u.isFavorite && <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-emerald-600" style={{ fontWeight: 700 }}>
                      {breakdown.finalScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-teal-600">{breakdown.stemScore.toFixed(1)}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-emerald-600" style={{ fontWeight: 600 }}>
                      €{monthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[u.status].color}`}>
                      {STATUS_CONFIG[u.status].label}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button onClick={() => navigate(`/universidades/${u.id}/editar`)} className="p-1 text-slate-300 hover:text-emerald-600 rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: u.id })} className="p-1 rounded">
                      <Heart className={`w-3.5 h-3.5 ${u.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`} />
                    </button>
                    <button onClick={() => setConfirmDelete(u.id)} className="p-1 text-slate-300 hover:text-red-500 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compare bar */}
      {state.compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl">
          <GitCompareArrows className="w-5 h-5" />
          <span className="text-sm">{state.compareIds.length} selecionadas para comparar</span>
          <button
            onClick={() => navigate('/comparador')}
            className="px-4 py-1.5 bg-white text-emerald-700 rounded-xl text-sm hover:bg-emerald-50"
            style={{ fontWeight: 600 }}
          >
            Comparar
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_COMPARE_IDS', payload: [] })}
            className="text-emerald-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-lg text-slate-800 mb-2" style={{ fontWeight: 700 }}>
              Excluir opção?
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Esta ação não pode ser desfeita. Todos os dados desta opção serão perdidos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
