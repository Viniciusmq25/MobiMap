import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Layers, MapPin, Star, Plus, X } from 'lucide-react';
import { useApp, calcMonthlyTotal } from '../context/AppContext';
import { University, Status } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const STATUS_CONFIG: Record<Status, { label: string; color: string; markerColor: string }> = {
  interested: { label: 'Interessado', color: 'bg-blue-100 text-blue-700', markerColor: '#3b82f6' },
  candidate: { label: 'Candidato', color: 'bg-emerald-100 text-emerald-700', markerColor: '#10b981' },
  approved: { label: 'Aprovado', color: 'bg-teal-100 text-teal-700', markerColor: '#0d9488' },
  discarded: { label: 'Descartado', color: 'bg-slate-100 text-slate-500', markerColor: '#94a3b8' },
};

const PRIORITY_CONFIG = {
  A: 'bg-amber-400',
  B: 'bg-blue-400',
  C: 'bg-slate-300',
};

function createCustomIcon(uni: University) {
  const cfg = STATUS_CONFIG[uni.status];
  const priorityDot = uni.priority
    ? `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;background:${
        uni.priority === 'A' ? '#f59e0b' : uni.priority === 'B' ? '#3b82f6' : '#94a3b8'
      };border-radius:50%;border:1.5px solid white;"></div>`
    : '';

  const html = `
    <div style="position:relative;width:36px;height:44px;">
      <div style="
        width:36px;height:36px;
        background:${cfg.markerColor};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1;">${uni.flag}</span>
      </div>
      ${uni.isFavorite ? '<div style="position:absolute;top:-5px;left:-5px;width:14px;height:14px;background:#f43f5e;border-radius:50%;border:2px solid white;font-size:8px;display:flex;align-items:center;justify-content:center;">♥</div>' : ''}
      ${priorityDot}
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

export function MapPage() {
  const { state, getRankedUniversities, calcScoreBreakdown, dispatch } = useApp();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [showPanel, setShowPanel] = useState(true);

  const ranked = getRankedUniversities();

  const filtered = state.universities.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase()) ||
      u.country.toLowerCase().includes(search.toLowerCase()) ||
      u.acronym.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [46, 10],
        zoom: 5,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    state.universities.forEach((uni) => {
      const icon = createCustomIcon(uni);
      const monthly = calcMonthlyTotal(uni);
      const breakdown = calcScoreBreakdown(uni);

      const popupContent = `
        <div style="min-width:220px;font-family:sans-serif;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:20px;">${uni.flag}</span>
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:14px;">${uni.acronym}</div>
              <div style="color:#64748b;font-size:11px;">${uni.city}, ${uni.country}</div>
            </div>
          </div>
          <div style="background:#f0fdf4;border-radius:8px;padding:8px;margin-bottom:8px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
              <div style="font-size:11px;color:#64748b;">Mensal</div>
              <div style="font-size:11px;color:#10b981;font-weight:600;">€${monthly.toLocaleString()}</div>
              <div style="font-size:11px;color:#64748b;">STEM</div>
              <div style="font-size:11px;color:#0d9488;font-weight:600;">${breakdown.stemScore.toFixed(1)}/10</div>
              <div style="font-size:11px;color:#64748b;">Score</div>
              <div style="font-size:11px;color:#059669;font-weight:600;">${breakdown.finalScore.toFixed(1)}/10</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <span style="font-size:10px;padding:2px 8px;border-radius:999px;background:${STATUS_CONFIG[uni.status].markerColor}22;color:${STATUS_CONFIG[uni.status].markerColor};">${STATUS_CONFIG[uni.status].label}</span>
            ${uni.stemFocus.slice(0, 1).map((f) => `<span style="font-size:10px;padding:2px 8px;border-radius:999px;background:#e0f2fe;color:#0284c7;">${f}</span>`).join('')}
          </div>
        </div>
      `;

      const marker = L.marker([uni.lat, uni.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, {
          maxWidth: 280,
          className: 'custom-leaflet-popup',
        });

      marker.on('click', () => {
        setSelectedId(uni.id);
      });

      markersRef.current[uni.id] = marker;
    });
  }, [state.universities, calcScoreBreakdown]);

  // Fly to selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const uni = state.universities.find((u) => u.id === selectedId);
    if (!uni) return;
    map.flyTo([uni.lat, uni.lng], 8, { duration: 1.2 });
    markersRef.current[selectedId]?.openPopup();
  }, [selectedId, state.universities]);

  const selectedUni = selectedId ? state.universities.find((u) => u.id === selectedId) : null;
  const selectedBreakdown = selectedUni ? calcScoreBreakdown(selectedUni) : null;

  return (
    <div className="relative flex h-full overflow-hidden" style={{ minHeight: 'calc(100vh - 60px)' }}>
      {/* Leaflet map container */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#e0f2f1' }} />
      </div>

      {/* Left panel toggle */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="absolute top-4 left-4 z-20 bg-white shadow-md rounded-xl p-2 hover:bg-emerald-50 transition-colors"
        style={{ zIndex: 999 }}
      >
        <Filter className="w-4 h-4 text-slate-600" />
      </button>

      {/* Left panel */}
      {showPanel && (
        <div
          className="absolute top-4 left-14 bottom-4 z-20 w-72 flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ zIndex: 998 }}
        >
          <div className="p-4 border-b border-slate-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all', 'interested', 'candidate', 'approved', 'discarded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    statusFilter === s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  {s === 'all'
                    ? 'Todos'
                    : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Nenhuma opção encontrada
              </div>
            )}
            {filtered.map((u) => {
              const breakdown = calcScoreBreakdown(u);
              const monthly = calcMonthlyTotal(u);
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedId === u.id
                      ? 'bg-emerald-50 border-2 border-emerald-400'
                      : 'border border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{u.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-800 truncate" style={{ fontWeight: 600 }}>
                          {u.acronym}
                        </span>
                        <span className="text-xs text-emerald-600 ml-1 flex-shrink-0" style={{ fontWeight: 700 }}>
                          {breakdown.finalScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{u.city}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[u.status].color}`}
                        >
                          {STATUS_CONFIG[u.status].label}
                        </span>
                        <span className="text-xs text-emerald-600">€{monthly.toLocaleString()}/mês</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/universidades/nova')}
              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova opção
            </button>
          </div>
        </div>
      )}

      {/* Selected detail panel */}
      {selectedUni && selectedBreakdown && (
        <div
          className="absolute top-4 right-4 bottom-4 z-20 w-72 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
          style={{ zIndex: 998 }}
        >
          <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedUni.flag}</span>
                <div>
                  <div className="text-sm" style={{ fontWeight: 700 }}>{selectedUni.acronym}</div>
                  <div className="text-xs text-emerald-100">{selectedUni.city}, {selectedUni.country}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full bg-white/20 text-white`}
              >
                {STATUS_CONFIG[selectedUni.status].label}
              </span>
              {selectedUni.priority && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Prioridade {selectedUni.priority}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Score breakdown */}
            <div>
              <div className="text-xs text-slate-400 mb-2">Score Final</div>
              <div className="flex items-center gap-3">
                <div className="text-3xl text-emerald-600" style={{ fontWeight: 800 }}>
                  {selectedBreakdown.finalScore.toFixed(1)}
                </div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${selectedBreakdown.finalScore * 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Custo', val: selectedBreakdown.costScore, color: '#10b981' },
                { label: 'STEM', val: selectedBreakdown.stemScore, color: '#0d9488' },
                { label: 'Trabalho', val: selectedBreakdown.workScore, color: '#3b82f6' },
                { label: 'Adaptação', val: selectedBreakdown.adaptationScore, color: '#8b5cf6' },
                { label: 'Qualidade', val: selectedBreakdown.qualityScore, color: '#f59e0b' },
                { label: 'Fit', val: selectedBreakdown.emotionalScoreVal, color: '#ec4899' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">{item.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.val * 10}%`, background: item.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-6 text-right">{item.val.toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Custo estimado</div>
              <div className="text-lg text-emerald-700" style={{ fontWeight: 700 }}>
                €{calcMonthlyTotal(selectedUni).toLocaleString()}/mês
              </div>
              <div className="text-xs text-slate-400">
                €{Math.round(calcMonthlyTotal(selectedUni) * 6 + selectedUni.flightCost + selectedUni.visaCost + selectedUni.housingDeposit + selectedUni.setupCost + selectedUni.insuranceCost).toLocaleString()} total 6 meses
              </div>
            </div>

            {selectedUni.stemFocus.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-2">Foco STEM</div>
                <div className="flex flex-wrap gap-1">
                  {selectedUni.stemFocus.map((f) => (
                    <span key={f} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedUni.pros.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Prós</div>
                <ul className="space-y-0.5">
                  {selectedUni.pros.slice(0, 3).map((p, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => navigate(`/universidades/${selectedUni.id}`)}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700"
            >
              Ver detalhes
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'TOGGLE_COMPARE', payload: selectedUni.id });
              }}
              className={`flex-1 py-2 rounded-xl text-sm border ${
                state.compareIds.includes(selectedUni.id)
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {state.compareIds.includes(selectedUni.id) ? '✓ Comparar' : '+ Comparar'}
            </button>
          </div>
        </div>
      )}

      {/* Compare badge */}
      {state.compareIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => navigate('/comparador')}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 transition-colors"
          >
            <Layers className="w-4 h-4" />
            Comparar {state.compareIds.length} opções selecionadas
          </button>
        </div>
      )}
    </div>
  );
}