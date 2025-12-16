import React from 'react';
import ResizableTh from './ResizableTh.jsx';
import BudgetTableRow from './BudgetTableRow.jsx';
import CommentButton from './CommentButton.jsx';
import { Edit, Search, ChevronDown, TrendingUp, TrendingDown, XCircle, Trash2, ArrowRightLeft, Lock, ChevronUp } from 'lucide-react';

const BudgetTableContent = ({
    topScrollRef,
    mainScrollRef,
    drawerData,
    periods,
    groupedData,
    columnWidths,
    visibleColumns,
    currencySettings,
    filteredExpandedAndVatEntries,
    finalActualTransactions,
    hasOffBudgetRevenues,
    hasOffBudgetExpenses,
    effectiveCashAccounts,
    periodPositions,
    isTierSearchOpen,
    setIsTierSearchOpen,
    tierSearchRef,
    searchTerm,
    setSearchTerm,
    collapsedItems,
    isEntreesCollapsed,
    setIsEntreesCollapsed,
    isSortiesCollapsed,
    setIsSortiesCollapsed,
    toggleCollapse,
    handleResize,
    handleEditBudget,
    handleDeleteEntry,
    handleActualClick,
    handleDrillUp,
    handleDrillDown,
    criticalityConfig,
    realBudgetData,
    today,
    isDateToday,
    calculateGeneralTotals,
    calculateMainCategoryTotals,
    calculateEntryBudgetForPeriod,
    calculateActualAmountForPeriod,
    getEntryDescription,
    getFrequencyTitle,
    getResteColor,
    formatCurrency,
}) => {
    const numVisibleCols = (visibleColumns.budget ? 1 : 0) + (visibleColumns.actual ? 1 : 0) + 1;
    const periodColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
    const separatorWidth = 4;
    const fixedColsWidth = columnWidths.category + columnWidths.supplier + (visibleColumns.description ? columnWidths.description : 0);
    const totalTableWidth = fixedColsWidth + separatorWidth + periods.length * (periodColumnWidth + separatorWidth);
    const totalCols = 4 + periods.length * 2;
    const supplierColLeft = columnWidths.category;
    const descriptionColLeft = supplierColLeft + columnWidths.supplier;

    const periodCellStyle = {
        minWidth: `${periodColumnWidth}px`,
        width: `${periodColumnWidth}px`,
    };

    const renderBudgetRows = (type) => {
        const isEntree = type === 'entree';
        const mainCategories = groupedData[type] || [];
        const isCollapsed = type === 'entree' ? isEntreesCollapsed : isSortiesCollapsed;
        const toggleMainCollapse = type === 'entree' ? () => setIsEntreesCollapsed((p) => !p) : () => setIsSortiesCollapsed((p) => !p);
        const Icon = type === 'entree' ? TrendingUp : TrendingDown;
        const colorClass = type === 'entree' ? 'text-success-600' : 'text-danger-600';

        return (
            <>
                <tr className="bg-gray-200 border-gray-300 cursor-pointer border-y-2" onClick={toggleMainCollapse}>
                    <td className="sticky left-0 z-20 px-4 py-1 bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                        <div className="flex items-center gap-2 font-bold">
                            <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                            <Icon className={`w-4 h-4 ${colorClass}`} />
                            {isEntree ? 'Total Entrées' : 'Total Sorties'}
                        </div>
                    </td>
                    <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                    {visibleColumns.description && (
                        <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                    )}
                    <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                    {periods.map((period, periodIndex) => {
                        const totals = calculateGeneralTotals(mainCategories, period, type, filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                        const reste = totals.budget - totals.actual;
                        const columnIdBase = period.startDate.toISOString();
                        const rowId = `total_${type}`;

                        return (
                            <React.Fragment key={periodIndex}>
                                <td className="px-1 py-1" style={periodCellStyle}>
                                    {numVisibleCols > 0 && (
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                            {visibleColumns.budget && (
                                                <div className="relative text-center text-gray-500 group/subcell">
                                                    {formatCurrency(totals.budget, currencySettings)}
                                                    <CommentButton
                                                        rowId={rowId}
                                                        columnId={`${columnIdBase}_budget`}
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
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
                                                            if (totals.actual !== 0) {
                                                                handleActualClick({ type, period, source: isEntree ? 'totalEntrees' : 'totalSorties' });
                                                            }
                                                        }}
                                                        disabled={totals.actual === 0}
                                                        className="font-normal text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {formatCurrency(totals.actual, currencySettings)}
                                                    </button>
                                                    <CommentButton
                                                        rowId={rowId}
                                                        columnId={`${columnIdBase}_actual`}
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
                                                        columnName={`${period.label} (Réel)`}
                                                    />
                                                </div>
                                            )}
                                            <div className={`relative text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                {formatCurrency(reste, currencySettings)}
                                                <CommentButton
                                                    rowId={rowId}
                                                    columnId={`${columnIdBase}_reste`}
                                                    rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
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

                {!isCollapsed && mainCategories.length > 0 && mainCategories.map((mainCategory) => {
                    const isMainCollapsed = collapsedItems[mainCategory.id];

                    return (
                        <React.Fragment key={mainCategory.id}>
                            <tr onClick={() => toggleCollapse(mainCategory.id)} className="text-gray-700 bg-gray-100 cursor-pointer hover:bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-1 bg-gray-100" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                                        {mainCategory.name}
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((period, periodIndex) => {
                                    const totals = calculateMainCategoryTotals(mainCategory.entries, period, finalActualTransactions);
                                    const reste = totals.budget - totals.actual;
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = `main_cat_${mainCategory.id}`;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-1 py-1" style={periodCellStyle}>
                                                {numVisibleCols > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                                        {visibleColumns.budget && (
                                                            <div className="relative text-center text-gray-500 group/subcell">
                                                                {formatCurrency(totals.budget, currencySettings)}
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_budget`}
                                                                    rowName={mainCategory.name}
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
                                                                        if (totals.actual !== 0) {
                                                                            handleActualClick({ mainCategory, period, source: 'mainCategory' });
                                                                        }
                                                                    }}
                                                                    disabled={totals.actual === 0}
                                                                    className="hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {formatCurrency(totals.actual, currencySettings)}
                                                                </button>
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_actual`}
                                                                    rowName={mainCategory.name}
                                                                    columnName={`${period.label} (Réel)`}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={`relative text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                            {formatCurrency(reste, currencySettings)}
                                                            <CommentButton
                                                                rowId={rowId}
                                                                columnId={`${columnIdBase}_reste`}
                                                                rowName={mainCategory.name}
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

                            {!isMainCollapsed && mainCategory.entries && mainCategory.entries.map((entry) => (
                                <BudgetTableRow
                                    key={entry.id}
                                    entry={entry}
                                    periods={periods}
                                    columnWidths={columnWidths}
                                    visibleColumns={visibleColumns}
                                    currencySettings={currencySettings}
                                    isEntree={isEntree}
                                    supplierColLeft={supplierColLeft}
                                    descriptionColLeft={descriptionColLeft}
                                    periodCellStyle={periodCellStyle}
                                    numVisibleCols={numVisibleCols}
                                    handleEditBudget={handleEditBudget}
                                    handleDeleteEntry={handleDeleteEntry}
                                    handleActualClick={handleActualClick}
                                    calculateEntryBudgetForPeriod={calculateEntryBudgetForPeriod}
                                    calculateActualAmountForPeriod={calculateActualAmountForPeriod}
                                    getEntryDescription={getEntryDescription}
                                    getFrequencyTitle={getFrequencyTitle}
                                    getResteColor={getResteColor}
                                    formatCurrency={formatCurrency}
                                    criticalityConfig={criticalityConfig}
                                    realBudgetData={realBudgetData}
                                    finalActualTransactions={finalActualTransactions}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    return (
        <div className={`relative mb-6 transition-opacity duration-300 ${drawerData.isOpen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="relative z-10 overflow-hidden rounded-lg shadow-lg bg-surface">
                <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div style={{ width: `${totalTableWidth}px`, height: '1px' }}></div>
                </div>
                <div ref={mainScrollRef} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-30">
                            <tr>
                                <ResizableTh
                                    id="category"
                                    width={columnWidths.category}
                                    onResize={handleResize}
                                    className="sticky left-0 z-40 bg-gray-100"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>Catégorie</span>
                                        <div className="flex items-center">
                                            <button onClick={handleDrillUp} className="p-1 text-gray-500 hover:text-gray-800" title="Réduire tout">
                                                <ChevronUp size={16} />
                                            </button>
                                            <button onClick={handleDrillDown} className="p-1 text-gray-500 hover:text-gray-800" title="Développer tout">
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </ResizableTh>
                                <ResizableTh
                                    id="supplier"
                                    width={columnWidths.supplier}
                                    onResize={handleResize}
                                    className="sticky z-30 bg-gray-100"
                                    style={{ left: `${supplierColLeft}px` }}
                                >
                                    {isTierSearchOpen ? (
                                        <div ref={tierSearchRef} className="flex items-center w-full gap-1">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Rechercher..."
                                                className="w-full px-2 py-1 text-sm bg-white border rounded-md"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button onClick={() => setSearchTerm('')} className="p-1 text-gray-500 hover:text-gray-800" title="Effacer">
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span>Tiers</span>
                                            <button onClick={() => setIsTierSearchOpen(true)} className="p-1 text-gray-500 hover:text-gray-800" title="Rechercher par tiers">
                                                <Search size={14} />
                                            </button>
                                        </div>
                                    )}
                                </ResizableTh>
                                {visibleColumns.description && (
                                    <ResizableTh
                                        id="description"
                                        width={columnWidths.description}
                                        onResize={handleResize}
                                        className="sticky z-30 bg-gray-100"
                                        style={{ left: `${descriptionColLeft}px` }}
                                    >
                                        Description
                                    </ResizableTh>
                                )}
                                <th className="border-b-2 bg-surface" style={{ width: `${separatorWidth}px` }}></th>
                                {periods.map((period, periodIndex) => {
                                    const isPast = period.endDate <= today;
                                    const isTodayPeriod = period.isToday || isDateToday(period.startDate);
                                    const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const netBudget = revenueTotals.budget - expenseTotals.budget;
                                    const isNegativeFlow = netBudget < 0;
                                    
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <th
                                                className={`px-2 py-2 text-center font-medium border-b-2 ${isPast ? 'bg-gray-50' : 'bg-surface'} ${isNegativeFlow && !isPast ? 'bg-red-50' : ''} ${isTodayPeriod ? 'bg-blue-50 border-blue-200' : ''}`}
                                                style={{ minWidth: `${periodColumnWidth}px` }}
                                            >
                                                <div className={`text-base mb-1 ${isTodayPeriod ? 'text-blue-700 font-semibold' : isNegativeFlow && !isPast ? 'text-red-700' : 'text-gray-600'}`}>
                                                    {period.label}
                                                    {isTodayPeriod && (
                                                        <span className="ml-1 text-xs font-normal text-blue-500">(Aujourd'hui)</span>
                                                    )}
                                                </div>
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-xs font-medium text-gray-600">
                                                        {visibleColumns.budget && <div className="flex-1">Prév.</div>}
                                                        {visibleColumns.actual && <div className="flex-1">Réel</div>}
                                                        <div className="flex-1">Reste</div>
                                                    </div>
                                                )}
                                            </th>
                                            <th className="border-b-2 bg-surface" style={{ width: `${separatorWidth}px` }}></th>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-gray-800 bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200" style={{ width: columnWidths.category }}>
                                    Trésorerie début de période
                                    <div className="mt-1 text-xs font-normal text-gray-500">
                                        {effectiveCashAccounts.length} compte(s) - Solde initial
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((_, periodIndex) => {
                                    const position = periodPositions[periodIndex];
                                    const initialAmount = position?.initial || 0;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-2 font-normal text-center" colSpan={numVisibleCols}>
                                                {formatCurrency(initialAmount, currencySettings)}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                            {renderBudgetRows('entree')}
                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                            {renderBudgetRows('sortie')}
                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            <tr className="bg-gray-200 border-t-2 border-gray-300">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Flux de trésorerie
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                                {periods.map((period, periodIndex) => {
                                    const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const netBudget = revenueTotals.budget - expenseTotals.budget;
                                    const netActual = revenueTotals.actual - expenseTotals.actual;
                                    const netReste = netBudget - netActual;
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = 'net_flow';
                                    
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-2">
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-sm">
                                                        {visibleColumns.budget && (
                                                            <div className={`relative group/subcell flex-1 text-center font-normal ${netBudget < 0 ? 'text-red-600' : 'text-text-primary'}`}>
                                                                {formatCurrency(netBudget, currencySettings)}
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_budget`}
                                                                    rowName="Flux de trésorerie"
                                                                    columnName={`${period.label} (Prév.)`}
                                                                />
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className="relative flex-1 font-normal text-center group/subcell">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        if (netActual !== 0) {
                                                                            handleActualClick({ type: 'net', period, source: 'netFlow' });
                                                                        }
                                                                    }}
                                                                    disabled={netActual === 0}
                                                                    className="text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {formatCurrency(netActual, currencySettings)}
                                                                </button>
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_actual`}
                                                                    rowName="Flux de trésorerie"
                                                                    columnName={`${period.label} (Réel)`}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(netReste, true)}`}>
                                                            {formatCurrency(netReste, currencySettings)}
                                                            <CommentButton
                                                                rowId={rowId}
                                                                columnId={`${columnIdBase}_reste`}
                                                                rowName="Flux de trésorerie"
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

                            <tr className="text-gray-900 bg-gray-300">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300" style={{ width: columnWidths.category }}>
                                    Trésorerie fin de période
                                    <div className="mt-1 text-xs font-normal text-gray-600">Solde initial + Flux net</div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((_, periodIndex) => {
                                    const position = periodPositions[periodIndex];
                                    const finalAmount = position?.final || 0;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-2 font-normal text-center" colSpan={numVisibleCols}>
                                                {formatCurrency(finalAmount, currencySettings)}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BudgetTableContent;