import React, { useMemo } from 'react';
import BudgetTableConsolidated from './BudgetTableConsolidated.jsx';
import BudgetTableSimple from './BudgetTableSimple.jsx';

const BudgetTableView = (props) => {
  const {
    isConsolidated = false, // Ajouter une valeur par défaut
    isCustomConsolidated = false, // Ajouter une valeur par défaut
    ...otherProps
  } = props;
  console.log('HEADER RENDERED');



  // Déterminer si on affiche la version consolidée ou simple
  const shouldShowConsolidated = isConsolidated || isCustomConsolidated;

  return useMemo(() => {
    if (shouldShowConsolidated) {
      return <BudgetTableConsolidated {...props} />;
    }
    return <BudgetTableSimple {...props} />;
  }, [shouldShowConsolidated, props]);
};

export default BudgetTableView;