import React, { useMemo } from 'react';
import BudgetTableConsolidated from './BudgetTableConsolidated.jsx';
import BudgetTableSimple from './BudgetTableSimple.jsx';

const BudgetTableView = (props) => {
  const {
    isConsolidated = false,
    isCustomConsolidated = false,
    visibleColumns = { // Valeurs par défaut explicites
      description: true,
      project: true,
      budget: true,
      actual: true
    },
    ...otherProps
  } = props;

  console.log('BudgetTableView - Props:', {
    isConsolidated,
    isCustomConsolidated,
    visibleColumns,
    hasVisibleColumns: !!visibleColumns
  });

  // Déterminer si on affiche la version consolidée ou simple
  const shouldShowConsolidated = isConsolidated || isCustomConsolidated;

  // Créer un nouvel objet props avec les valeurs par défaut garanties
  const enhancedProps = {
    ...props,
    visibleColumns: {
      description: visibleColumns.description !== false,
      project: visibleColumns.project !== false,
      budget: visibleColumns.budget !== false,
      actual: visibleColumns.actual !== false
    }
  };

  return useMemo(() => {
    console.log('Rendering:', shouldShowConsolidated ? 'Consolidated' : 'Simple');
    if (shouldShowConsolidated) {
      return <BudgetTableConsolidated {...enhancedProps} />;
    }
    return <BudgetTableSimple {...enhancedProps} />;
  }, [shouldShowConsolidated, enhancedProps]);
};

export default BudgetTableView;