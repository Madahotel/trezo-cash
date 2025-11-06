import React, { useState, useMemo, useEffect } from 'react';
import {
  Banknote,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';
import EmptyState from '../../../components/emptystate/EmptyState';
import {
  getUserFinancials,
  storeTiers,
  updateTiers,
} from '../../../components/context/tiersActions';

// Composant pour l'ajout de prêteurs/emprunteurs
const FinancialTierForm = ({ onAddFinancialTier, onRefreshData }) => {
  const [newFinancialTierName, setNewFinancialTierName] = useState('');
  const [newFinancialTierFirstName, setNewFinancialTierFirstName] =
    useState('');
  const [newFinancialTierEmail, setNewFinancialTierEmail] = useState('');
  const [newFinancialTierPhone, setNewFinancialTierPhone] = useState('');
  const [newFinancialTierType, setNewFinancialTierType] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const financialTierOptions = [
    { value: 7, label: 'Prêteur' },
    { value: 5, label: 'Emprunteur' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newFinancialTierName.trim() && newFinancialTierFirstName.trim()) {
      setIsSubmitting(true);

      const formData = {
        name: newFinancialTierName.trim(),
        firstname: newFinancialTierFirstName.trim(),
        email: newFinancialTierEmail.trim(),
        phone_number: newFinancialTierPhone.trim(),
        user_type_id: newFinancialTierType,
      };

      try {
        await storeTiers(formData);

        if (onAddFinancialTier) {
          onAddFinancialTier({
            name: newFinancialTierName.trim(),
            first_name: newFinancialTierFirstName.trim(),
            email: newFinancialTierEmail.trim(),
            phone: newFinancialTierPhone.trim(),
            user_type_id: newFinancialTierType,
          });
        }

        await onRefreshData();

        setNewFinancialTierName('');
        setNewFinancialTierFirstName('');
        setNewFinancialTierEmail('');
        setNewFinancialTierPhone('');
        setNewFinancialTierType(7);
        setFocusedField(null);
      } catch (error) {
        console.error("Erreur lors de l'ajout du tier financier:", error);
        alert("Erreur lors de l'ajout du tier financier. Veuillez réessayer.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getFieldClasses = (fieldName) => {
    const baseClasses =
      'px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white transition-all duration-300 ease-in-out';
    const isFocused = focusedField === fieldName;

    if (isFocused) {
      return `${baseClasses} flex-grow-[2] shadow-md border-blue-500`;
    } else {
      return `${baseClasses} flex-grow`;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
      <h2 className="text-black font-semibold mb-3 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-green-600" /> Ajouter un prêteur ou
        emprunteur
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex flex-col flex-grow min-w-[120px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={newFinancialTierName}
              onChange={(e) => setNewFinancialTierName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: BNI"
              className={getFieldClasses('name')}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col flex-grow min-w-[120px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Prénom *
            </label>
            <input
              type="text"
              value={newFinancialTierFirstName}
              onChange={(e) => setNewFinancialTierFirstName(e.target.value)}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: Madagascar"
              className={getFieldClasses('firstName')}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col flex-grow min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newFinancialTierEmail}
              onChange={(e) => setNewFinancialTierEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="exemple@email.com"
              className={getFieldClasses('email')}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col flex-grow min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={newFinancialTierPhone}
              onChange={(e) => setNewFinancialTierPhone(e.target.value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="+261 34 00 000 00"
              className={getFieldClasses('phone')}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col flex-shrink-0 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Type
            </label>
            <select
              value={newFinancialTierType}
              onChange={(e) => setNewFinancialTierType(Number(e.target.value))}
              onFocus={() => setFocusedField('type')}
              onBlur={() => setFocusedField(null)}
              className={getFieldClasses('type')}
              disabled={isSubmitting}
            >
              {financialTierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm min-w-[120px] h-[42px] transition-colors flex-shrink-0"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isSubmitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Composant pour la recherche
const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <label htmlFor="search-financial" className="sr-only">
        Rechercher un prêteur ou emprunteur
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        id="search-financial"
        name="search-financial"
        className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
        placeholder="Rechercher un prêteur ou emprunteur..."
        type="search"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

// Composant de pagination
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...');
    }
  }

  const uniquePages = pages.filter((page, index, array) => {
    if (page === '...') {
      return array[index - 1] !== '...';
    }
    return true;
  });

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> sur{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Précédent</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {uniquePages.map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  page === currentPage
                    ? 'z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                } ${page === '...' ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Suivant</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// Composant pour une ligne de tier financier
const FinancialTierRow = ({
  tier,
  settings,
  editingFinancialTier,
  onStartEditFinancial,
  onSaveEditFinancial,
  onCancelEditFinancial,
  // onDeleteFinancialTier,
  // isFinancialTierUsed,
}) => {
  const isPreteur = tier.user_type_id === 7;

  return (
    <tr className="group border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
      <td className="py-3 whitespace-nowrap">
        {editingFinancialTier?.id === tier.id ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editingFinancialTier.user_name || ''}
              onChange={(e) =>
                onStartEditFinancial({
                  ...editingFinancialTier,
                  user_name: e.target.value,
                })
              }
              placeholder="Nom"
              className="w-1/2 px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
            />
            <input
              type="text"
              value={editingFinancialTier.user_first_name || ''}
              onChange={(e) =>
                onStartEditFinancial({
                  ...editingFinancialTier,
                  user_first_name: e.target.value,
                })
              }
              placeholder="Prénom"
              className="w-1/2 px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
            />
          </div>
        ) : (
          <div className="font-medium">
            {tier.user_name} {tier.user_first_name}
          </div>
        )}
      </td>
      <td className="py-3 whitespace-nowrap">
        {editingFinancialTier?.id === tier.id ? (
          <select
            value={editingFinancialTier.user_type_id || 7}
            onChange={(e) =>
              onStartEditFinancial({
                ...editingFinancialTier,
                user_type_id: Number(e.target.value),
              })
            }
            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
          >
            <option value={7}>Prêteur</option>
            <option value={5}>Emprunteur</option>
          </select>
        ) : (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isPreteur
                ? 'bg-purple-100 text-purple-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {isPreteur ? 'Prêteur' : 'Emprunteur'}
          </span>
        )}
      </td>
      <td className="py-3 text-gray-600 whitespace-nowrap">
        {editingFinancialTier?.id === tier.id ? (
          <input
            type="email"
            value={editingFinancialTier.email || ''}
            onChange={(e) =>
              onStartEditFinancial({
                ...editingFinancialTier,
                email: e.target.value,
              })
            }
            placeholder="Email"
            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
          />
        ) : (
          tier.email || '-'
        )}
      </td>
      <td className="py-3 text-gray-600 whitespace-nowrap">
        {editingFinancialTier?.id === tier.id ? (
          <input
            type="tel"
            value={editingFinancialTier.phone || ''}
            onChange={(e) =>
              onStartEditFinancial({
                ...editingFinancialTier,
                phone: e.target.value,
              })
            }
            placeholder="Téléphone"
            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
          />
        ) : (
          tier.phone || '-'
        )}
      </td>
      <td
        className={`py-3 text-right font-semibold ${
          tier.unpaid > 0 ? 'text-gray-600' : 'text-gray-500'
        } whitespace-nowrap`}
      >
        {tier.unpaid > 0 ? formatCurrency(tier.unpaid, settings) : '-'}
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        {editingFinancialTier?.id === tier.id ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onSaveEditFinancial}
              className="p-1 text-green-600 hover:text-green-800"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEditFinancial}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onStartEditFinancial(tier)}
              className="p-1 text-blue-600 hover:text-blue-800"
            >
              <Edit className="w-4 h-4" />
            </button>
            {/* <button
              onClick={() => onDeleteFinancialTier(tier.id)}
              className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed"
              title={
                isFinancialTierUsed(tier.name)
                  ? 'Suppression impossible: tiers utilisé'
                  : 'Supprimer'
              }
            >
              <Trash2 className="w-4 h-4" />
            </button> */}
          </div>
        )}
      </td>
    </tr>
  );
};

// Composant pour le tableau de chargement
const LoadingTable = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300 space-y-4">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md mb-4"></div>

        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>

        {[...Array(5)].map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 mb-3">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant pour le tableau avec erreur
const ErrorTable = ({ error, onRetry }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={onRetry}
          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
};

// Composant principal pour la gestion des prêteurs/emprunteurs
const FinancialTiersManagement = ({
  settings = { currency: 'EUR', locale: 'fr-FR' },
  onFinancialTierClick,
  onAddFinancialTier,
  onEditFinancialTier,
  onDeleteFinancialTier,
}) => {
  const [editingFinancialTier, setEditingFinancialTier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiData, setApiData] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const transformApiData = (data) => {
    if (!data?.users?.user_financials?.user_financial_items?.data) {
      return [];
    }

    return data.users.user_financials.user_financial_items.data.map((user) => {
      const userTypeId = parseInt(user.user_type_id, 10);
      const isPreteur = userTypeId === 7;

      return {
        id: user.user_id.toString(),
        name: `${user.user_name} ${user.user_first_name}`,
        user_name: user.user_name,
        user_first_name: user.user_first_name,
        type: isPreteur ? 'preteur' : 'emprunteur',
        email: user.user_email,
        phone: user.user_phone_number,
        unpaid: user.unpaid_amount || 0,
        user_type_id: userTypeId,
      };
    });
  };

  const fetchData = async (page = 1) => {
    try {
      setTableLoading(true);
      setError(null);
      const res = await getUserFinancials(page);
      setApiData(res);
    } catch (err) {
      setError('Erreur lors du chargement des données financières');
      console.error('Error fetching financial data:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const financialTiers = useMemo(() => {
    return transformApiData(apiData);
  }, [apiData]);

  const totalItems =
    apiData?.users?.user_financials?.user_financial_items?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleStartEditFinancial = (tier) =>
    setEditingFinancialTier({
      ...tier,
      user_name: tier.user_name,
      user_first_name: tier.user_first_name,
      email: tier.email,
      phone: tier.phone,
      user_type_id: tier.user_type_id,
    });

  const handleCancelEditFinancial = () => setEditingFinancialTier(null);

  const handleSaveEditFinancial = async () => {
    if (editingFinancialTier?.user_name?.trim()) {
      try {
        const formData = {
          id: editingFinancialTier.id,
          name: editingFinancialTier.user_name.trim(),
          firstname: editingFinancialTier.user_first_name
            ? editingFinancialTier.user_first_name.trim()
            : '',
          email: editingFinancialTier.email?.trim() || '',
          phone_number: editingFinancialTier.phone?.trim() || '',
          user_type_id: editingFinancialTier.user_type_id,
        };

        await updateTiers(formData, editingFinancialTier.id);

        if (onEditFinancialTier) {
          onEditFinancialTier(editingFinancialTier.id, {
            user_name: editingFinancialTier.user_name.trim(),
            user_first_name: editingFinancialTier.user_first_name
              ? editingFinancialTier.user_first_name.trim()
              : '',
            email: editingFinancialTier.email?.trim() || '',
            phone: editingFinancialTier.phone?.trim() || '',
            user_type_id: editingFinancialTier.user_type_id,
          });
        }

        await fetchData(currentPage);
        handleCancelEditFinancial();
      } catch (error) {
        console.error(
          'Erreur lors de la modification du tier financier:',
          error
        );
        alert(
          'Erreur lors de la modification du tier financier. Veuillez réessayer.'
        );
      }
    }
  };

  const isFinancialTierUsed = (tierName) => {
    const usedFinancialTiers = ['BNI Madagascar'];
    return usedFinancialTiers.includes(tierName);
  };

  const handleDeleteFinancialTier = async (tierId) => {
    const tierToDelete = financialTiers.find((t) => t.id === tierId);
    if (!tierToDelete) return;

    if (isFinancialTierUsed(tierToDelete.name)) {
      alert(
        `Suppression impossible: le tiers financier "${tierToDelete.name}" est utilisé.`
      );
      return;
    }

    if (
      window.confirm(
        `Supprimer "${tierToDelete.name}" ?\nCette action est irréversible.`
      )
    ) {
      try {
        if (onDeleteFinancialTier) {
          await onDeleteFinancialTier(tierId);
        }
        await fetchData(currentPage);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression. Veuillez réessayer.');
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderFinancialTiersTable = () => {
    const filteredFinancialTiers = financialTiers
      .filter((tier) =>
        tier.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Prêteurs / Emprunteurs
        </h3>
        <div className="overflow-x-auto">
          {filteredFinancialTiers.length > 0 ? (
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Nom & Prénom
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Type
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Email
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Téléphone
                  </th>
                  <th className="py-2 text-right font-medium text-gray-500 whitespace-nowrap">
                    Impayés
                  </th>
                  <th className="py-2 text-right font-medium text-gray-500 w-32 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFinancialTiers.map((tier) => (
                  <FinancialTierRow
                    key={tier.id}
                    tier={tier}
                    settings={settings}
                    editingFinancialTier={editingFinancialTier}
                    onFinancialTierClick={onFinancialTierClick}
                    onStartEditFinancial={handleStartEditFinancial}
                    onSaveEditFinancial={handleSaveEditFinancial}
                    onCancelEditFinancial={handleCancelEditFinancial}
                    onDeleteFinancialTier={handleDeleteFinancialTier}
                    isFinancialTierUsed={isFinancialTierUsed}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={Banknote}
              title={
                searchTerm
                  ? 'Aucun prêteur ou emprunteur trouvé'
                  : 'Aucun prêteur ou emprunteur'
              }
              message={
                searchTerm
                  ? "Essayez d'affiner votre recherche."
                  : 'Ajoutez un nouveau prêteur ou emprunteur pour commencer.'
              }
            />
          )}
        </div>
      </div>
    );
  };

  const renderTableContent = () => {
    if (tableLoading) {
      return <LoadingTable />;
    }

    if (error) {
      return (
        <ErrorTable error={error} onRetry={() => fetchData(currentPage)} />
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-300">
        <div className="p-4 space-y-4">
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <hr className="border-gray-200" />
          {renderFinancialTiersTable()}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <FinancialTierForm
        onAddFinancialTier={onAddFinancialTier}
        onRefreshData={() => fetchData(currentPage)}
      />

      {renderTableContent()}
    </div>
  );
};

export default FinancialTiersManagement;
