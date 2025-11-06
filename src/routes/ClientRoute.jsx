import ProjetLayoutClient from '../layouts/clients/projet/ProjetLayoutAdmin';
import DashboardView from '../pages/clients/dashboard/DashboardView';
import CashflowView from '../pages/clients/flux/CashflowView';
import ScheduleView from '../pages/clients/echeance/ScheduleView';
import ProjetClient from '../pages/clients/projets/ProjetClient';
import ScenarioView from '../pages/clients/scenario/ScenarioView';
import BudgetTracker from '../pages/clients/tresorie/BudgetTracker';
import TrezoPage from '../pages/clients/tresorie/TrezoPage';
import ExpenseAnalysisView from '../pages/clients/analyse/ExpenseAnalysisView';
import MyTemplatesPage from '../pages/clients/models/MyTemplatesPage';
import ProjectSettingsPage from '../pages/clients/projets/ProjectSettingsPage';
import ProvisionsPage from '../pages/clients/suiviProvision/ProvisionsPage';
import CategoryManagementPage from '../pages/clients/categories/CategoryManagementPage';
import TiersManagementPage from '../pages/clients/tiers/TiersManagementPage';
import CashAccountsPage from '../pages/clients/account/CashAccountsPage';
import TimezoneSettingsPage from '../pages/clients/timeZone/TimezoneSettingsPage';
import ArchivesPage from '../pages/clients/archives/ArchivesPage';
import ProfilePage from '../pages/clients/profil/ProfilePage';
import SecurityPage from '../pages/clients/security/SecurityPage';
import UnderConstructionView from '../pages/clients/facture/UnderConstructionView';
import { path } from 'framer-motion/client';
import Aide from '../pages/clients/aide/Aide';
import SubscriptionPage from '../pages/clients/abonnement/SubscriptionPage';
import OnboardingView from '../pages/clients/onboarding/OnboardingView';
import BudgetPage from '../pages/clients/budget/Budget';
import ReferralPage from '../pages/clients/ambassador/ReferralPage';

import ProtectedRoute from '../routes/ProtectedRoute'; // Ataovy araka ny làlana marina
import ProjectsPage from '../pages/clients/projets/ProjectsPage';
import { SettingsProvider } from '../contexts/SettingsContext';
import DashboardProject from '../pages/clients/dashboard/DashboardProject';
import CategoriesPage from '../pages/clients/categories/CategoriesView';
const ClientRoute = {
  path: '/client',
  element: (
    <ProtectedRoute>
      <SettingsProvider>
        <ProjetLayoutClient />
      </SettingsProvider>
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <div>HomePage client</div> },
    { path: 'projet', element: <ProjetClient /> },
    { path: 'dashboard', element: <DashboardView /> },
    { path: 'trezo', element: <TrezoPage /> },
    { path: 'budget', element: <BudgetPage /> },
    { path: 'scenarios', element: <ScenarioView /> },
    { path: 'flux', element: <CashflowView /> },
    { path: 'echeancier', element: <ScheduleView /> },
    { path: 'analyse', element: <ExpenseAnalysisView /> },
    { path: 'templates', element: <MyTemplatesPage /> },
    { path: 'parametres-projet', element: <ProjectSettingsPage /> },
    { path: 'provisions', element: <ProvisionsPage /> },
    { path: 'categories', element: <CategoriesPage /> },
    { path: 'tiers', element: <TiersManagementPage /> },
    { path: 'comptes', element: <CashAccountsPage /> },
    { path: 'timezoneSettings', element: <TimezoneSettingsPage /> },
    { path: 'archives', element: <ArchivesPage /> },
    { path: 'profil', element: <ProfilePage /> },
    { path: 'securite', element: <SecurityPage /> },
    { path: 'factures', element: <UnderConstructionView /> },
    { path: 'aide', element: <Aide title="Centre d'aide" /> },
    { path: 'abonnement', element: <SubscriptionPage /> },
    { path: 'onboarding', element: <OnboardingView /> },
    { path: 'parrainage', element: <ReferralPage /> },
    { path: 'projets', element: <ProjectsPage /> },
    { path: 'project/:projectId/dashboard', element: <DashboardProject /> },
  ],
};

export default ClientRoute;
