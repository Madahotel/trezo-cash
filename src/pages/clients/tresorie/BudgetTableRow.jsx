import React from 'react';
import { Edit, Trash2, Lock } from 'lucide-react';
import CommentButton from './CommentButton.jsx';

const BudgetTableRow = ({
    entry,
    periods,
    columnWidths,
    visibleColumns,
    currencySettings,
    isEntree,
    supplierColLeft,
    descriptionColLeft,
    periodCellStyle,
    numVisibleCols,
    handleEditBudget,
    handleDeleteEntry,
    handleActualClick,
    calculateEntryBudgetForPeriod,
    calculateActualAmountForPeriod,
    getEntryDescription,
    getFrequencyTitle,
    getResteColor,
    formatCurrency,
    criticalityConfig,
    realBudgetData,
    finalActualTransactions,
    // NOUVELLE PROP: Fonction pour vérifier si l'entrée doit être affichée
    shouldDisplayForPeriod,
}) => { // ✅ Tsy mila periodStart sy periodEnd ho props
    const subCat = entry.category && entry.mainCategory?.subCategories?.find((sc) => sc.name === entry.category);
    const criticality = subCat?.criticality;
    const critConfig = criticalityConfig[criticality];

    return (
        <tr className={`border-b border-gray-100 hover:bg-gray-50 group ${entry.is_vat_child ? 'bg-gray-50/50' : entry.is_vat_payment || entry.is_tax_payment ? 'bg-blue-50/50' : ''}`}>
            <td className={`px-4 py-1 font-normal text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 z-20 ${entry.is_vat_child ? 'pl-8' : ''}`} style={{ width: columnWidths.category }}>
                <div className="flex items-center gap-2">
                    {critConfig && (
                        <span className={`w-2 h-2 rounded-full ${critConfig.color}`} title={`Criticité: ${critConfig.label}`}></span>
                    )}
                    {entry.isProvision && <Lock className="w-3 h-3 text-indigo-500 shrink-0" />}
                    <span>{entry.category}</span>
                </div>
            </td>
            <td className="sticky z-10 px-4 py-1 text-gray-700 bg-white group-hover:bg-gray-50" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate" title={getFrequencyTitle(entry)}>
                        <span className="truncate">{entry.supplier}</span>
                    </div>
                    <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                        <button onClick={(event) => handleEditBudget(entry, 'entry', event)} className="p-1 text-blue-500 hover:text-blue-700">
                            <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteEntry(entry)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </td>
            {visibleColumns.description !== false && (
                <td className="sticky z-10 px-4 py-1 text-xs text-gray-500 truncate bg-white group-hover:bg-gray-50" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }} title={getEntryDescription(entry)}>
                    {getEntryDescription(entry) !== 'Aucune description disponible' ? (
                        <span className="truncate">{getEntryDescription(entry)}</span>
                    ) : (
                        <span className="italic text-gray-400">-</span>
                    )}
                </td>
            )}
            <td className="bg-surface"></td>
            {periods.map((period, periodIndex) => {
                // Vérifier si cette entrée doit être affichée pour cette période
                const shouldDisplay = shouldDisplayForPeriod ? 
                    shouldDisplayForPeriod(entry.startDate, period.startDate, period.endDate, entry.frequency, period.displayMode) : 
                    true; // ✅ Fanitsiana eto: entry.startDate no voalohany

                if (!shouldDisplay) {
                    return (
                        <React.Fragment key={periodIndex}>
                            <td className="px-1 py-1" style={periodCellStyle}>
                                {numVisibleCols > 0 && (
                                    <div className="grid grid-cols-3 gap-1 text-xs opacity-40">
                                        {visibleColumns.budget && (
                                            <div className="relative text-center text-gray-300 group/subcell">
                                                -
                                                <CommentButton
                                                    rowId={entry.id}
                                                    columnId={`${period.startDate.toISOString()}_budget`}
                                                    rowName={entry.supplier}
                                                    columnName={`${period.label} (Prév.)`}
                                                />
                                            </div>
                                        )}
                                        {visibleColumns.actual && (
                                            <div className="relative text-center text-gray-300 group/subcell">
                                                -
                                                <CommentButton
                                                    rowId={entry.id}
                                                    columnId={`${period.startDate.toISOString()}_actual`}
                                                    rowName={entry.supplier}
                                                    columnName={`${period.label} (Réel)`}
                                                />
                                            </div>
                                        )}
                                        <div className="relative text-center text-gray-300">
                                            -
                                            <CommentButton
                                                rowId={entry.id}
                                                columnId={`${period.startDate.toISOString()}_reste`}
                                                rowName={entry.supplier}
                                                columnName={`${period.label} (Reste)`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </td>
                            <td className="bg-surface"></td>
                        </React.Fragment>
                    );
                }

                const budget = calculateEntryBudgetForPeriod(entry, period.startDate, period.endDate, periodIndex, period);
                const actual = calculateActualAmountForPeriod(entry, finalActualTransactions, period.startDate, period.endDate, realBudgetData);
                const reste = budget - actual;
                const columnIdBase = period.startDate.toISOString();
                
                return (
                    <React.Fragment key={periodIndex}>
                        <td className="px-1 py-1" style={periodCellStyle}>
                            {numVisibleCols > 0 && (
                                <div className="grid grid-cols-3 gap-1 text-xs">
                                    {visibleColumns.budget && (
                                        <div className="relative text-center text-gray-500 group/subcell">
                                            {formatCurrency(budget, currencySettings)}
                                            <CommentButton
                                                rowId={entry.id}
                                                columnId={`${columnIdBase}_budget`}
                                                rowName={entry.supplier}
                                                columnName={`${period.label} (Prév.)`}
                                            />
                                        </div>
                                    )}
                                    {visibleColumns.actual && (
                                        <div className="relative text-center group/subcell">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleActualClick({ entry, period, source: 'entry' });
                                                }}
                                                disabled={actual === 0 && budget === 0}
                                                className={`hover:underline disabled:cursor-not-allowed disabled:text-gray-400 ${
                                                    realBudgetData?.real_budget_items?.data && 
                                                    realBudgetData.real_budget_items.data.some(
                                                        (rb) => (rb.budget_id === entry.budget_id || rb.project_id === entry.project_id) &&
                                                                rb.collection_date &&
                                                                new Date(rb.collection_date) >= period.startDate &&
                                                                new Date(rb.collection_date) <= period.endDate
                                                    ) ? 'font-semibold text-green-600' :
                                                    entry.collectionData?.collection?.length > 0 ? 'font-semibold text-blue-600' : 'text-blue-600'
                                                }`}
                                                title={
                                                    realBudgetData?.real_budget_items?.data &&
                                                    realBudgetData.real_budget_items.data.some(
                                                        (rb) => (rb.budget_id === entry.budget_id || rb.project_id === entry.project_id) &&
                                                                rb.collection_date &&
                                                                new Date(rb.collection_date) >= period.startDate &&
                                                                new Date(rb.collection_date) <= period.endDate
                                                    ) ? 'Montant provenant des données real_budget API' :
                                                    entry.collectionData?.collection?.length > 0 ? 'Montant provenant des collections' : 'Montant provenant des paiements'
                                                }
                                            >
                                                {formatCurrency(actual, currencySettings)}
                                            </button>
                                            <CommentButton
                                                rowId={entry.id}
                                                columnId={`${columnIdBase}_actual`}
                                                rowName={entry.supplier}
                                                columnName={`${period.label} (Réel)`}
                                            />
                                        </div>
                                    )}
                                    <div className={`relative text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                        {formatCurrency(reste, currencySettings)}
                                        <CommentButton
                                            rowId={entry.id}
                                            columnId={`${columnIdBase}_reste`}
                                            rowName={entry.supplier}
                                            columnName={`${period.label} (Reste)`}
                                        />
                                    </div>
                                </div>
                            )}
                        </td>
                        <td className="bg-surface"></td>
                    </React.Fragment>
                );
            })}
        </tr>
    );
};

export default BudgetTableRow;