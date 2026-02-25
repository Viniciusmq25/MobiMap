import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { UniversitiesPage } from './pages/UniversitiesPage';
import { UniversityForm } from './pages/UniversityForm';
import { UniversityDetail } from './pages/UniversityDetail';
import { Comparator } from './pages/Comparator';
import { Ranking } from './pages/Ranking';
import { BudgetSimulator } from './pages/BudgetSimulator';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'mapa', Component: MapPage },
      { path: 'universidades', Component: UniversitiesPage },
      { path: 'universidades/nova', Component: UniversityForm },
      { path: 'universidades/:id', Component: UniversityDetail },
      { path: 'universidades/:id/editar', Component: UniversityForm },
      { path: 'comparador', Component: Comparator },
      { path: 'ranking', Component: Ranking },
      { path: 'cenarios', Component: BudgetSimulator },
    ],
  },
]);
