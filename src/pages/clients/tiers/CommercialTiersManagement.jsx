import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  Search,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatPaymentTerms } from '../../../utils/formatting';
import EmptyState from '../../../components/emptystate/EmptyState';
import {
  getUserThirdParty,
  storeTiers,
  updateTiers,
} from '../../../components/context/tiersActions';

// Composant pour l'ajout de tiers commerciaux
const CommercialTierForm = ({ onAddTier, onRefreshData }) => {
  const [newTierName, setNewTierName] = useState('');
  const [newTierFirstName, setNewTierFirstName] = useState('');
  const [newTierEmail, setNewTierEmail] = useState('');
  const [newTierPhone, setNewTierPhone] = useState('');
  const [newTierType, setNewTierType] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const tierOptions = [
    { value: 6, label: 'Fournisseur' },
    { value: 4, label: 'Client' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newTierName.trim() && newTierFirstName.trim()) {
      setIsSubmitting(true);

      const formData = {
        name: newTierName.trim(),
        firstname: newTierFirstName.trim(),
        email: newTierEmail.trim(),
        phone_number: newTierPhone.trim(),
        user_type_id: newTierType,
      };

      try {
        await storeTiers(formData);

        if (onAddTier) {
          onAddTier({
            name: newTierName.trim(),
            first_name: newTierFirstName.trim(),
            email: newTierEmail.trim(),
            phone: newTierPhone.trim(),
            user_type_id: newTierType,
          });
        }

        await onRefreshData();

        setNewTierName('');
        setNewTierFirstName('');
        setNewTierEmail('');
        setNewTierPhone('');
        setNewTierType(6);
        setFocusedField(null);
      } catch (error) {
        console.error("Erreur lors de l'ajout du tier commercial:", error);
        alert("Erreur lors de l'ajout du tier commercial. Veuillez réessayer.");
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
        <UserPlus className="w-5 h-5 text-blue-600" /> Ajouter un nouveau tiers
        commercial
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex flex-col flex-grow min-w-[120px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={newTierName}
              onChange={(e) => setNewTierName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: DUPONT"
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
              value={newTierFirstName}
              onChange={(e) => setNewTierFirstName(e.target.value)}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: Marie"
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
              value={newTierEmail}
              onChange={(e) => setNewTierEmail(e.target.value)}
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
              value={newTierPhone}
              onChange={(e) => setNewTierPhone(e.target.value)}
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
              value={newTierType}
              onChange={(e) => setNewTierType(Number(e.target.value))}
              onFocus={() => setFocusedField('type')}
              onBlur={() => setFocusedField(null)}
              className={getFieldClasses('type')}
              disabled={isSubmitting}
            >
              {tierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm min-w-[120px] h-[42px] transition-colors flex-shrink-0"
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
      <label htmlFor="search-tier" className="sr-only">
        Rechercher un tiers
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        id="search-tier"
        name="search-tier"
        className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
        placeholder="Rechercher un tiers..."
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
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
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

// Composant pour une ligne de tier commercial
const TierRow = ({
  tier,
  unpaidAmount,
  settings,
  editingTier,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  // onDeleteTier,
  // onOpenPaymentTerms,
  // isTierUsed,
  safeFormatPaymentTerms,
}) => {
  const isFournisseur = tier.user_type_id === 6;

  return (
    <tr className="group border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
      <td className="py-3 whitespace-nowrap">
        {editingTier?.id === tier.id ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editingTier.user_name || ''}
              onChange={(e) =>
                onStartEdit({ ...editingTier, user_name: e.target.value })
              }
              placeholder="Nom"
              className="w-1/2 px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
            />
            <input
              type="text"
              value={editingTier.user_first_name || ''}
              onChange={(e) =>
                onStartEdit({ ...editingTier, user_first_name: e.target.value })
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
      <td className="py-3 text-gray-600 whitespace-nowrap">
        {editingTier?.id === tier.id ? (
          <input
            type="email"
            value={editingTier.email || ''}
            onChange={(e) =>
              onStartEdit({
                ...editingTier,
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
        {editingTier?.id === tier.id ? (
          <input
            type="tel"
            value={editingTier.phone || ''}
            onChange={(e) =>
              onStartEdit({
                ...editingTier,
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
      <td className="py-3 whitespace-nowrap">
        {editingTier?.id === tier.id ? (
          <select
            value={editingTier.user_type_id || 6}
            onChange={(e) =>
              onStartEdit({
                ...editingTier,
                user_type_id: Number(e.target.value),
              })
            }
            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900"
          >
            <option value={6}>Fournisseur</option>
            <option value={4}>Client</option>
          </select>
        ) : (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isFournisseur
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isFournisseur ? 'Fournisseur' : 'Client'}
          </span>
        )}
      </td>
      <td
        className={`py-3 text-right font-semibold ${
          unpaidAmount > 0
            ? isFournisseur
              ? 'text-red-600'
              : 'text-yellow-600'
            : 'text-gray-500'
        } whitespace-nowrap`}
      >
        {unpaidAmount > 0 ? formatCurrency(unpaidAmount, settings) : '-'}
      </td>
      <td className="py-3 pl-4 text-gray-500 text-xs whitespace-nowrap">
        {safeFormatPaymentTerms(tier.payment_terms)}
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        {editingTier?.id === tier.id ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onSaveEdit}
              className="p-1 text-green-600 hover:text-green-800"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* <button
              onClick={() => onOpenPaymentTerms(tier)}
              className="p-1 text-gray-500 hover:text-purple-600"
              title="Définir les conditions de paiement"
            >
              <CreditCard className="w-4 h-4" />
            </button> */}
            <button
              onClick={() => onStartEdit(tier)}
              className="p-1 text-blue-600 hover:text-blue-800"
            >
              <Edit className="w-4 h-4" />
            </button>
            {/* <button
              onClick={() => onDeleteTier(tier.id)}
              className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed"
              title={
                isTierUsed(tier.name)
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

        <div className="grid grid-cols-7 gap-4 mb-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>

        {[...Array(5)].map((_, index) => (
          <div key={index} className="grid grid-cols-7 gap-4 mb-3">
            <div className="h-6 bg-gray-200 rounded"></div>
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

// Composant principal pour la gestion des tiers commerciaux
const CommercialTiersManagement = ({
  settings = { currency: 'EUR', locale: 'fr-FR' },
  onOpenPaymentTerms,
  onTierClick,
  onAddTier,
  onEditTier,
  onDeleteTier,
}) => {
  const [editingTier, setEditingTier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiData, setApiData] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const mockUnpaid = useMemo(
    () => ({
      'DUPONT Marie': 12500,
      'MARTIN Pierre': 23450,
    }),
    []
  );

  const transformApiData = (data) => {
    if (!data?.users?.user_third_parties?.user_third_party_items?.data) {
      return [];
    }

    return data.users.user_third_parties.user_third_party_items.data.map(
      (user) => {
        const userTypeId = parseInt(user.user_type_id, 10);
        const isFournisseur = userTypeId === 6;

        return {
          id: user.user_id.toString(),
          name: `${user.user_name} ${user.user_first_name}`,
          user_name: user.user_name,
          user_first_name: user.user_first_name,
          type: isFournisseur ? 'fournisseur' : 'client',
          email: user.user_email,
          phone: user.user_phone_number,
          payment_terms: 30,
          user_type_id: userTypeId,
        };
      }
    );
  };

  const fetchData = async (page = 1) => {
    try {
      setTableLoading(true);
      setError(null);
      const res = await getUserThirdParty(page);
      setApiData(res);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Error fetching data:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const tiers = useMemo(() => {
    return transformApiData(apiData);
  }, [apiData]);

  const totalItems =
    apiData?.users?.user_third_parties?.user_third_party_items?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const safeFormatPaymentTerms = (paymentTerms) => {
    if (!paymentTerms && paymentTerms !== 0) return 'Non défini';
    if (typeof paymentTerms === 'number') return `${paymentTerms} jours`;
    if (Array.isArray(paymentTerms)) return formatPaymentTerms(paymentTerms);
    return 'Non défini';
  };

  const calculateUnpaidAmount = (tierName) => mockUnpaid[tierName] || 0;

  const handleStartEdit = (tier) =>
    setEditingTier({
      ...tier,
      user_name: tier.user_name,
      user_first_name: tier.user_first_name,
      email: tier.email,
      phone: tier.phone,
      user_type_id: tier.user_type_id,
    });

  const handleCancelEdit = () => setEditingTier(null);

  const handleSaveEdit = async () => {
    if (editingTier?.user_name?.trim()) {
      try {
        const formData = {
          id: editingTier.id,
          name: editingTier.user_name.trim(),
          firstname: editingTier.user_first_name
            ? editingTier.user_first_name.trim()
            : '',
          email: editingTier.email?.trim() || '',
          phone_number: editingTier.phone?.trim() || '',
          user_type_id: editingTier.user_type_id,
        };

        await updateTiers(formData, parseInt(editingTier.id));

        if (onEditTier) {
          onEditTier(editingTier.id, {
            user_name: editingTier.user_name.trim(),
            user_first_name: editingTier.user_first_name
              ? editingTier.user_first_name.trim()
              : '',
            email: editingTier.email?.trim() || '',
            phone: editingTier.phone?.trim() || '',
            user_type_id: editingTier.user_type_id,
          });
        }

        await fetchData(currentPage);
        handleCancelEdit();
      } catch (error) {
        console.error('Erreur lors de la modification du tier:', error);
        alert('Erreur lors de la modification du tier. Veuillez réessayer.');
      }
    }
  };

  const isTierUsed = (tierName) => {
    const usedTiers = ['DUPONT Marie', 'MARTIN Pierre'];
    return usedTiers.includes(tierName);
  };

  const handleDeleteTier = async (tierId) => {
    const tierToDelete = tiers.find((t) => t.id === tierId);
    if (!tierToDelete) return;

    if (isTierUsed(tierToDelete.name)) {
      alert(
        `Suppression impossible: le tiers "${tierToDelete.name}" est utilisé.`
      );
      return;
    }

    if (
      window.confirm(
        `Supprimer "${tierToDelete.name}" ?\nCette action est irréversible.`
      )
    ) {
      try {
        if (onDeleteTier) {
          await onDeleteTier(tierId);
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

  const renderTiersTable = () => {
    const filteredTiers = tiers
      .filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Tous les tiers commerciaux
        </h3>
        {filteredTiers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Nom
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Email
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Téléphone
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                    Type
                  </th>
                  <th className="py-2 text-right font-medium text-gray-500 whitespace-nowrap">
                    Impayés
                  </th>
                  <th className="py-2 text-left font-medium text-gray-500 pl-4 whitespace-nowrap">
                    Délai de paiement
                  </th>
                  <th className="py-2 text-right font-medium text-gray-500 w-32 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTiers.map((tier) => {
                  const unpaidAmount = calculateUnpaidAmount(tier.name);
                  return (
                    <TierRow
                      key={tier.id}
                      tier={tier}
                      unpaidAmount={unpaidAmount}
                      settings={settings}
                      editingTier={editingTier}
                      onTierClick={onTierClick}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDeleteTier={handleDeleteTier}
                      onOpenPaymentTerms={onOpenPaymentTerms}
                      isTierUsed={isTierUsed}
                      safeFormatPaymentTerms={safeFormatPaymentTerms}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={searchTerm ? 'Aucun tiers trouvé' : 'Aucun tiers commercial'}
            message={
              searchTerm
                ? "Essayez d'affiner votre recherche."
                : 'Ajoutez un nouveau tiers commercial pour commencer.'
            }
          />
        )}
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
          {renderTiersTable()}
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
      <CommercialTierForm
        onAddTier={onAddTier}
        onRefreshData={() => fetchData(currentPage)}
      />

      {renderTableContent()}
    </div>
  );
};

export default CommercialTiersManagement;
