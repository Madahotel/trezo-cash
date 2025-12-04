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
import CollaboratorsPage from '../pages/clients/collaborator/CollaboratorsPage';
import CategoryView from '../pages/clients/categories/CategoryView';
import ReferralsPage from '../pages/clients/ambassador/ReferralPage';
import AmbassadorPage from '../pages/clients/ambassador/AmbassadorPage';
import AmbassadorLayout from '../layouts/clients/ambassador/AmbassadorLayout';
import ReferralDashboard from '../pages/clients/ambassador/ReferralDashboard';
import AmbassadorGate from '../pages/clients/ambassador/AmbassadorGate';
import PaymentHistoryPage from '../pages/clients/ambassador/PaymentHistoryPage';
import ProgramInfoPage from '../pages/clients/ambassador/ProgramInfoPage';
import BecomeAmbassadorPage from '../pages/clients/ambassador/BecomeAmbassadorPage';
import ConsolidatedViewPage from '../pages/clients/consolidate/ConsolidatedViewPage';
import ConsolidationDetailsPage from '../pages/clients/consolidate/ConsolidationDetailsPage';
import ConsolidatedAllViewPage from '../pages/clients/consolidate/ConsolidatedViewPage';
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
    { path: 'categories', element: <CategoryView /> },
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
    { path: 'consolidations/:id', element: <ConsolidationDetailsPage /> },
    { path: 'consolidations', element: <ConsolidatedAllViewPage /> },
    
    // { path: "parrainage", element: <AmbassadorPage /> },
    // { path: "parrainage/refferals", element: <ReferralsPage /> },
    
    {
      path: 'parrainage',
      element: <AmbassadorGate />, // 🔹 Vérifie le statut
      children: [
        {
          path: '',
          element: <AmbassadorLayout />,
          children: [
            { index: true, element: <ReferralDashboard /> },
            { path: 'refferals', element: <ReferralsPage /> },
            { path: 'history', element: <PaymentHistoryPage /> },
            { path: 'program-info', element: <ProgramInfoPage /> },
          ],
        },
        // 🔹 Page affichée si l’utilisateur n’est PAS ambassadeur
        { path: 'devenir', element: <BecomeAmbassadorPage /> },
      ],
    },
    { path: 'projets', element: <ProjectsPage /> },
    { path: 'project/:projectId/dashboard', element: <DashboardProject /> },
    { path: 'collaborators', element: <CollaboratorsPage /> },
  ],
};

export default ClientRoute;
