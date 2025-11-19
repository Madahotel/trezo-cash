import React, { useMemo } from 'react';
import { Lock, MessageSquare } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting.js';
import CommentButton from './CommentButton.jsx';

// ✅ CORRECTION: Fonctions de calcul locales
const calculateEntryAmountForPeriod = (entry, startDate, endDate) => {
    if (!entry || !entry.amount) return 0;
    
    // Logique simplifiée pour la démo - à adapter selon votre structure de données
    if (entry.frequency === 'ponctuel') {
        const entryDate = new Date(entry.date);
        return (entryDate >= startDate && entryDate <= endDate) ? entry.amount : 0;
    }
    
    // Pour les fréquences récurrentes, calculer le montant pour la période
    return entry.amount || 0;
};

const calculateActualAmountForPeriod = (entry, actualTransactions, startDate, endDate) => {
    if (!actualTransactions || !entry) return 0;
    
    const entryActuals = actualTransactions.filter(actual => 
        actual.budgetId === entry.id || 
        actual.budgetId === entry.id.replace('_vat', '')
    );
    
    return entryActuals.reduce((sum, actual) => {
        const paymentsInPeriod = (actual.payments || []).filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= startDate && paymentDate <= endDate;
        });
        return sum + paymentsInPeriod.reduce((paymentSum, p) => paymentSum + p.paidAmount, 0);
    }, 0);
};

const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

const LectureView = ({ entries, periods, settings, actuals, isConsolidated, projects, visibleColumns, categories }) => {
    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'revenu' ? -1 : 1;
            const catA = a.category?.toLowerCase() || '';
            const catB = b.category?.toLowerCase() || '';
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            return (a.supplier || '').toLowerCase().localeCompare((b.supplier || '').toLowerCase());
        });
    }, [entries]);

    const totalsByPeriod = useMemo(() => {
        return periods.map(period => {
            const totalBudget = sortedEntries.reduce((sum, entry) => {
                // ✅ CORRECTION: Utiliser la fonction locale
                const amount = calculateEntryAmountForPeriod(entry, period.startDate, period.endDate);
                return sum + (entry.type === 'revenu' ? amount : -amount);
            }, 0);
            const totalActual = sortedEntries.reduce((sum, entry) => {
                // ✅ CORRECTION: Utiliser la fonction locale
                const amount = calculateActualAmountForPeriod(entry, actuals, period.startDate, period.endDate);
                return sum + (entry.type === 'revenu' ? amount : -amount);
            }, 0);
            return { budget: totalBudget, actual: totalActual, reste: totalBudget - totalActual };
        });
    }, [sortedEntries, periods, actuals]);

    let isFirstRevenue = true;
    let isFirstExpense = true;

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-xs text-left text-gray-500 uppercase border-b">
                        <th className="px-4 py-3 w-28">Groupe</th>
                        <th className="px-4 py-3">Écriture</th>
                        {isConsolidated && <th className="px-4 py-3">Projet</th>}
                        <th className="px-4 py-3">Tiers</th>
                        {visibleColumns.description && <th className="px-4 py-3">Description</th>}
                        {periods.map(p => (
                            <th key={p.label} className="px-4 py-3 text-center text-grey-600">
                                <div className="font-semibold">{p.label}</div>
                                <div className="flex justify-around mt-1 font-normal text-gray-400">
                                    {visibleColumns.budget && <div className="w-1/3">Prév.</div>}
                                    {visibleColumns.actual && <div className="w-1/3">Réel</div>}
                                    {visibleColumns.reste && <div className="w-1/3">Reste</div>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedEntries.map(entry => {
                        let groupLabel = '';
                        if (entry.type === 'revenu' && isFirstRevenue) {
                            groupLabel = 'Encaissement';
                            isFirstRevenue = false;
                        } else if (entry.type === 'depense' && isFirstExpense) {
                            groupLabel = 'Décaissement';
                            isFirstExpense = false;
                        }

                        const subCat = (entry.type === 'depense' && entry.category) 
                            ? categories.expense.flatMap(mc => mc.subCategories).find(sc => sc.name === entry.category) 
                            : null;
                        const criticality = subCat?.criticality;
                        const critConfig = criticalityConfig[criticality];
                        
                        return (
                            <tr key={entry.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-bold text-gray-500 align-top">{groupLabel}</td>
                                <td className={`py-2 px-4 font-medium text-gray-600`}>
                                    <div className="flex items-center gap-2">
                                        {critConfig && <span className={`w-2 h-2 rounded-full ${critConfig.color}`} title={`Criticité: ${critConfig.label}`}></span>}
                                        <span>{entry.category}</span>
                                    </div>
                                </td>
                                {isConsolidated && <td className="px-4 py-2">{projects.find(p => p.id === entry.projectId)?.name || 'N/A'}</td>}
                                <td className="flex items-center gap-2 px-4 py-2">
                                    {entry.supplier}
                                    {entry.isProvision && <Lock className="w-3 h-3 text-indigo-500" title="Provision" />}
                                </td>
                                {visibleColumns.description && <td className="max-w-xs px-4 py-2 text-xs text-gray-500 truncate">{entry.description}</td>}
                                {periods.map(period => {
                                    // ✅ CORRECTION: Utiliser les fonctions locales
                                    const budget = calculateEntryAmountForPeriod(entry, period.startDate, period.endDate);
                                    const actual = calculateActualAmountForPeriod(entry, actuals, period.startDate, period.endDate);
                                    const reste = budget - actual;
                                    const isRevenue = entry.type === 'revenu';
                                    const resteColor = reste === 0 ? 'text-gray-500' : isRevenue ? (reste <= 0 ? 'text-green-600' : 'text-red-600') : (reste >= 0 ? 'text-green-600' : 'text-red-600');
                                    const columnIdBase = period.startDate.toISOString();
                                    return (
                                        <td key={period.label} className="px-4 py-2 text-center">
                                            <div className="flex justify-around">
                                                {visibleColumns.budget && <div className="relative w-1/3 text-gray-500 group/subcell">{formatCurrency(budget, settings)}<CommentButton rowId={entry.id} columnId={`${columnIdBase}_budget`} rowName={entry.supplier} columnName={`${period.label} (Prév.)`} /></div>}
                                                {visibleColumns.actual && <div className="relative w-1/3 font-semibold group/subcell">{formatCurrency(actual, settings)}<CommentButton rowId={entry.id} columnId={`${columnIdBase}_actual`} rowName={entry.supplier} columnName={`${period.label} (Réel)`} /></div>}
                                                {visibleColumns.reste && <div className={`w-1/3 ${resteColor} relative group/subcell`}>{formatCurrency(reste, settings)}<CommentButton rowId={entry.id} columnId={`${columnIdBase}_reste`} rowName={entry.supplier} columnName={`${period.label} (Reste)`} /></div>}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={isConsolidated ? (visibleColumns.description ? 5 : 4) : (visibleColumns.description ? 4 : 3)} className="px-4 py-3">Flux de trésorerie net</td>
                        {totalsByPeriod.map((total, index) => {
                            const period = periods[index];
                            const columnIdBase = period.startDate.toISOString();
                            const rowId = 'net_flow';
                            return (
                                <td key={index} className="px-4 py-3 text-center">
                                    <div className="flex justify-around">
                                        {visibleColumns.budget && <div className={`w-1/3 text-xs ${total.budget >= 0 ? 'text-gray-600' : 'text-red-600'} relative group/subcell`}>{formatCurrency(total.budget, settings)}<CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName="Flux de trésorerie net" columnName={`${period.label} (Prév.)`} /></div>}
                                        {visibleColumns.actual && <div className={`w-1/3 font-semibold ${total.actual >= 0 ? 'text-gray-800' : 'text-red-700'} relative group/subcell`}>{formatCurrency(total.actual, settings)}<CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName="Flux de trésorerie net" columnName={`${period.label} (Réel)`} /></div>}
                                        {visibleColumns.reste && <div className={`w-1/3 text-xs ${total.reste >= 0 ? 'text-green-600' : 'text-red-600'} relative group/subcell`}>{formatCurrency(total.reste, settings)}<CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName="Flux de trésorerie net" columnName={`${period.label} (Reste)`} /></div>}
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default LectureView;