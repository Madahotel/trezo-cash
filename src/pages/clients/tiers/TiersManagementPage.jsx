import React from 'react';
import TiersManagementView from './TiersManagementView';
import { useOutletContext } from 'react-router-dom';

const TiersManagementPage = () => {
  const context = useOutletContext();
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TiersManagementView onOpenPaymentTerms={context.onOpenPaymentTerms} />
    </div>
  );
};

export default TiersManagementPage;
