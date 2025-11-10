import { useState, useEffect } from 'react';
import { Award, TrendingUp, DollarSign, Users, Gift, Link2, Copy, Check, Clock, XCircle, ChevronRight, Sparkles } from 'lucide-react';

// Données statiques
const staticLevels = [
    { name: 'Bronze', min_referrals: 0, commission_rate: 0, color: 'from-amber-700 to-amber-900' },
    { name: 'Argent', min_referrals: 3, commission_rate: 2.5, color: 'from-gray-300 to-gray-500' },
    { name: 'Or', min_referrals: 10, commission_rate: 5, color: 'from-yellow-400 to-yellow-600' },
    { name: 'Platinum', min_referrals: 25, commission_rate: 7.5, color: 'from-cyan-400 to-blue-600' },
    { name: 'Diamant', min_referrals: 50, commission_rate: 10, color: 'from-purple-400 to-pink-600' },
    { name: 'Legendaire', min_referrals: 100, commission_rate: 15, color: 'from-orange-500 to-red-600' }
];

const staticReferees = [
    { id: 1, full_name: 'Jean Dupont', email: 'jean.dupont@email.com', subscription_status: 'active' },
    { id: 2, full_name: 'Marie Martin', email: 'marie.martin@email.com', subscription_status: 'trialing' },
    { id: 3, full_name: 'Pierre Lambert', email: 'pierre.lambert@email.com', subscription_status: 'active' },
    { id: 4, full_name: 'Sophie Bernard', email: 'sophie.bernard@email.com', subscription_status: 'inactive' },
    { id: 5, full_name: 'Thomas Moreau', email: 'thomas.moreau@email.com', subscription_status: 'active' }
];

const staticUserData = {
    referralCode: 'TREZO123',
    invitedCount: 8,
    validatedCount: 5,
    conversionRate: 62.5,
    generatedRevenue: 600
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

const ReferralDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [referralData, setReferralData] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            const currentLevel = staticLevels.find(level =>
                staticUserData.validatedCount >= level.min_referrals
            ) || staticLevels[0];

            const nextLevel = staticLevels.find(level =>
                level.min_referrals > staticUserData.validatedCount
            );

            const activeReferees = staticReferees.filter(ref =>
                ref.subscription_status === 'active' || ref.subscription_status === 'trialing'
            );

            setReferralData({
                ...staticUserData,
                referees: activeReferees,
                levels: staticLevels,
                currentLevel,
                nextLevel
            });
            setLoading(false);
        }, 500);
    }, []);

    const copyToClipboard = () => {
        const link = `https://trezocash.com/signup?ref=${referralData?.referralCode}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
            case 'lifetime':
                return { text: 'Actif', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
            case 'trialing':
                return { text: 'Essai', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
            default:
                return { text: 'Inactif', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
            </div>
        );
    }

    if (!referralData) return null;

    const progress = referralData.nextLevel
        ? (referralData.validatedCount / referralData.nextLevel.min_referrals) * 100
        : 100;
    const remaining = referralData.nextLevel
        ? referralData.nextLevel.min_referrals - referralData.validatedCount
        : 0;

    const commission = referralData.currentLevel.commission_rate > 0
        ? referralData.validatedCount * 12 * referralData.currentLevel.commission_rate
        : 0;

    return (
        <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="mx-auto space-y-6 max-w-7xl">

                {/* Hero Section - Statut */}
                <div className="relative overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className={`absolute inset-0 bg-gradient-to-br ${referralData.currentLevel.color} opacity-5`}></div>
                    <div className="relative p-8">
                        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-medium text-blue-700 rounded-full bg-blue-50">
                                    <Sparkles className="w-3 h-3" />
                                    Ambassadeur
                                </div>
                                <h1 className="mb-2 text-4xl font-bold text-gray-900">
                                    Niveau {referralData.currentLevel.name}
                                </h1>
                                <p className="text-gray-600">
                                    {referralData.currentLevel.commission_rate > 0
                                        ? `Vous gagnez ${referralData.currentLevel.commission_rate}€ par mois et par filleul actif`
                                        : 'Atteignez le niveau Argent pour commencer à gagner'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                                    {referralData.validatedCount}
                                </div>
                                <div className="text-sm text-gray-500">Filleuls actifs</div>
                            </div>
                        </div>

                        {referralData.nextLevel && (
                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Prochain niveau : {referralData.nextLevel.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {remaining} restant{remaining > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="relative h-3 overflow-hidden bg-gray-100 rounded-full">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${referralData.nextLevel.color} transition-all duration-500`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Métriques Principales */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Conversions */}
                    <div className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl group hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                +{referralData.conversionRate.toFixed(0)}%
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{referralData.invitedCount}</div>
                        <div className="mt-1 text-sm text-gray-500">Personnes invitées</div>
                        <div className="pt-3 mt-4 text-xs text-gray-400 border-t border-gray-100">
                            {referralData.validatedCount} conversions validées
                        </div>
                    </div>

                    {/* Commissions */}
                    <div className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl group hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            {commission > 0 && (
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                    Actif
                                </span>
                            )}
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                            {commission > 0 ? formatCurrency(commission) : '0€'}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">Commissions mensuelles</div>
                        <div className="pt-3 mt-4 text-xs text-gray-400 border-t border-gray-100">
                            {commission > 0 ? 'Estimation basée sur les filleuls actifs' : 'Pas encore de commissions'}
                        </div>
                    </div>

                    {/* Revenus */}
                    <div className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl group hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                            {formatCurrency(referralData.generatedRevenue)}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">Revenus générés</div>
                        <div className="pt-3 mt-4 text-xs text-gray-400 border-t border-gray-100">
                            Estimation annuelle pour Trezocash
                        </div>
                    </div>
                </div>

                {/* Lien de Parrainage */}
                <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Link2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Votre lien de parrainage</h3>
                            <p className="text-sm text-gray-500">Partagez ce lien pour inviter de nouveaux utilisateurs</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            readOnly
                            value={`https://trezocash.com/signup?ref=${referralData.referralCode}`}
                            className="flex-1 px-4 py-3 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copié
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copier
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filleuls et Récompenses */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* Mes Filleuls */}
                    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Filleuls actifs</h3>
                            </div>
                            <span className="text-sm font-medium text-gray-500">
                                {referralData.referees.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {referralData.referees.length > 0 ? (
                                referralData.referees.map(ref => {
                                    const statusInfo = getStatusInfo(ref.subscription_status);
                                    return (
                                        <div
                                            key={ref.id}
                                            className="flex items-center justify-between p-4 transition-colors border border-gray-100 rounded-xl hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 font-semibold text-blue-600 rounded-full bg-blue-50">
                                                    {ref.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{ref.full_name}</div>
                                                    <div className="text-xs text-gray-500">{ref.email}</div>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="flex justify-center mb-3">
                                        <Users className="w-12 h-12 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-500">Aucun filleul pour le moment</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Récompenses */}
                    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <Gift className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Récompenses</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { needed: 1, label: '1 mois offert', icon: '🎁' },
                                { needed: 3, label: '3 mois offerts', icon: '🎉' },
                                { needed: 5, label: '6 mois offerts', icon: '🚀' },
                                { needed: 10, label: 'Abonnement -50% à vie', icon: '👑' }
                            ].map(reward => {
                                const isUnlocked = referralData.validatedCount >= reward.needed;
                                return (
                                    <div
                                        key={reward.label}
                                        className={`flex items-center justify-between p-4 border rounded-xl transition-all ${isUnlocked
                                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
                                            : 'bg-gray-50 border-gray-200 opacity-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{reward.icon}</span>
                                            <div>
                                                <div className="font-medium text-gray-900">{reward.label}</div>
                                                <div className="text-xs text-gray-500">
                                                    {reward.needed} parrainage{reward.needed > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        {isUnlocked && (
                                            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm">
                                                <Check className="w-5 h-5 text-emerald-600" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Conseils */}
                <div className="p-8 border border-blue-100 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white shadow-sm rounded-xl">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                Maximisez vos gains
                            </h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                    <span>Partagez votre lien sur LinkedIn et vos réseaux professionnels</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                    <span>Recommandez Trezocash à vos collègues et partenaires</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                    <span>Créez du contenu pour montrer comment vous utilisez l'application</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReferralDashboard;