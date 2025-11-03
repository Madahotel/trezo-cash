import React, { useState, useEffect } from 'react';
import CommercialTiersManagement from './CommercialTiersManagement';
import FinancialTiersManagement from './FinancialTiersManagement';

const TiersManagementView = ({ onOpenPaymentTerms }) => {
  // États principaux
  const [tiers, setTiers] = useState([]);
  const [financialTiers, setFinancialTiers] = useState([]);
  const [settings] = useState({ currency: 'EUR', locale: 'fr-FR' });

  // Initialisation des données
  useEffect(() => {
    const staticTiers = [
      {
        id: '1',
        name: 'Abonnement Internet',
        type: 'fournisseur',
        payment_terms: 60,
      },
      {
        id: '2',
        name: 'Assurance Habitation',
        type: 'fournisseur',
        payment_terms: 90,
      },
      {
        id: '3',
        name: 'Salaire Principal',
        type: 'fournisseur',
        payment_terms: 45,
      },
      { id: '4', name: 'Formation', type: 'client', payment_terms: 30 },
      { id: '5', name: 'Ventes', type: 'client', payment_terms: 45 },
    ];
    setTiers(staticTiers);

    const staticFinancialTiers = [
      { id: 'f1', name: 'BNI Madagascar', type: 'preteur', unpaid: 523000 },
      { id: 'f2', name: 'BRED', type: 'preteur', unpaid: 245600 },
      { id: 'f3', name: 'BOA', type: 'preteur', unpaid: 378900 },
    ];
    setFinancialTiers(staticFinancialTiers);
  }, []);

  // Handlers pour les tiers commerciaux
  const handleAddTier = (tierData) => {
    const newTier = {
      id: Date.now().toString(),
      name: tierData.name,
      type: tierData.type,
      payment_terms: 30,
    };
    setTiers((prev) => [...prev, newTier]);
  };

  const handleEditTier = (tierId, updates) => {
    setTiers((prev) =>
      prev.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier))
    );
  };

  const handleDeleteTier = (tierId) => {
    setTiers((prev) => prev.filter((tier) => tier.id !== tierId));
  };

  const handleTierClick = (tier) => {
    console.log('Tier commercial cliqué:', tier.name);
    const targetView = tier.type === 'fournisseur' ? 'payables' : 'receivables';
    console.log('Navigation vers:', targetView);
  };

  // Handlers pour les tiers financiers
  const handleAddFinancialTier = (tierData) => {
    const newFinancialTier = {
      id: `f${Date.now()}`,
      name: tierData.name,
      type: tierData.type,
      unpaid: 0,
    };
    setFinancialTiers((prev) => [...prev, newFinancialTier]);
  };

  const handleEditFinancialTier = (tierId, updates) => {
    setFinancialTiers((prev) =>
      prev.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier))
    );
  };

  const handleDeleteFinancialTier = (tierId) => {
    setFinancialTiers((prev) => prev.filter((tier) => tier.id !== tierId));
  };

  const handleFinancialTierClick = (tier) => {
    console.log('Tier financier cliqué:', tier.name);
    console.log('Navigation vers les prêts/emprunts');
  };

  return (
    <div className="space-y-8">
      {/* Section Tiers Commerciaux */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Tiers Commerciaux
        </h2>
        <CommercialTiersManagement
          tiers={tiers}
          settings={settings}
          onOpenPaymentTerms={onOpenPaymentTerms}
          onTierClick={handleTierClick}
          onAddTier={handleAddTier}
          onEditTier={handleEditTier}
          onDeleteTier={handleDeleteTier}
        />
      </section>

      {/* Section Prêteurs/Emprunteurs */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Prêteurs & Emprunteurs
        </h2>
        <FinancialTiersManagement
          financialTiers={financialTiers}
          settings={settings}
          onFinancialTierClick={handleFinancialTierClick}
          onAddFinancialTier={handleAddFinancialTier}
          onEditFinancialTier={handleEditFinancialTier}
          onDeleteFinancialTier={handleDeleteFinancialTier}
        />
      </section>
    </div>
  );
};

export default TiersManagementView;
