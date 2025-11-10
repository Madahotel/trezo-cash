import React, { useState, useEffect, useMemo } from 'react';
// import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { Loader, Award, BarChart, DollarSign, Users, Gift, Link, Copy, Check, Clock, XCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';

// Données statiques pour les niveaux
const staticLevels = [
    { name: 'Bronze', min_referrals: 0, commission_rate: 0 },
    { name: 'Argent', min_referrals: 3, commission_rate: 2.5 },
    { name: 'Or', min_referrals: 10, commission_rate: 5 },
    { name: 'Platinum', min_referrals: 25, commission_rate: 7.5 },
    { name: 'Diamant', min_referrals: 50, commission_rate: 10 },
    { name: 'Legendaire', min_referrals: 100, commission_rate: 15 }
];

// Données statiques pour les filleuls
const staticReferees = [
    { id: 1, full_name: 'Jean Dupont', email: 'jean.dupont@email.com', subscription_status: 'active' },
    { id: 2, full_name: 'Marie Martin', email: 'marie.martin@email.com', subscription_status: 'trialing' },
    { id: 3, full_name: 'Pierre Lambert', email: 'pierre.lambert@email.com', subscription_status: 'active' },
    { id: 4, full_name: 'Sophie Bernard', email: 'sophie.bernard@email.com', subscription_status: 'inactive' },
    { id: 5, full_name: 'Thomas Moreau', email: 'thomas.moreau@email.com', subscription_status: 'active' }
];

// Données statiques pour l'utilisateur
const staticUserData = {
    referralCode: 'TREZO123',
    invitedCount: 8,
    validatedCount: 5,
    conversionRate: 62.5,
    generatedRevenue: 600
};

const levelIcons = {
    Bronze: '🥉',
    Argent: '🥈',
    Or: '🥇',
    Platinum: '💎',
    Diamant: '💎',
    Legendaire: '🎖️'
};

const StatusCard = ({ level, nextLevel, validatedCount }) => {
    const progress = nextLevel ? (validatedCount / nextLevel.min_referrals) * 100 : 100;
    const remaining = nextLevel ? nextLevel.min_referrals - validatedCount : 0;
    const Icon = level ? (levelIcons[level.name] || '🏆') : '🏆';

    if (!level) return null;

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 font-semibold text-gray-700"><Award className="w-5 h-5 text-blue-500" /> Mon Statut</h3>
            <div className="text-center">
                <div className="mb-2 text-5xl">{Icon}</div>
                <h4 className="text-2xl font-bold text-gray-800">Ambassadeur {level.name}</h4>
                {nextLevel && (
                    <div className="mt-4 text-sm">
                        <p className="text-gray-600">Prochain niveau : <span className="font-semibold">{nextLevel.name}</span> ({nextLevel.min_referrals} parrainages)</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500">{remaining} parrainage{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatsCard = ({ stats }) => (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="flex items-center gap-2 mb-4 font-semibold text-gray-700"><BarChart className="w-5 h-5 text-blue-500" /> Mes Stats Globales</h3>
        <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Personnes invitées :</span> <span className="font-bold">{stats.invitedCount}</span></div>
            <div className="flex justify-between"><span>Abonnements validés :</span> <span className="font-bold text-green-600">{stats.validatedCount} 🎉</span></div>
            <div className="flex justify-between"><span>Taux de conversion :</span> <span className="font-bold">{stats.conversionRate.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>Revenus générés (est.) :</span> <span className="font-bold">{formatCurrency(stats.generatedRevenue, { currency: 'EUR' })}/an</span></div>
        </div>
    </div>
);

const CommissionsCard = ({ level, validatedCount }) => {
    const commission = useMemo(() => {
        if (!level || level.commission_rate === 0) return { monthly: 0, total: 0 };
        const monthly = validatedCount * 12 * level.commission_rate;
        return { monthly };
    }, [level, validatedCount]);

    if (!level) return null;

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 font-semibold text-gray-700"><DollarSign className="w-5 h-5 text-blue-500" /> Mes Commissions</h3>
            {level.commission_rate > 0 ? (
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Commission mensuelle (est.) :</span> <span className="font-bold">{formatCurrency(commission.monthly, { currency: 'EUR' })}/mois</span></div>
                    <div className="flex justify-between"><span>Total perçu (à venir) :</span> <span className="font-bold">...</span></div>
                    <div className="flex justify-between"><span>Prochain paiement :</span> <span className="font-bold">...</span></div>
                </div>
            ) : (
                <p className="py-4 text-sm text-center text-gray-500">Atteignez le niveau Argent pour commencer à gagner des commissions !</p>
            )}
        </div>
    );
};

const ReferralsList = ({ referees }) => {
    const getStatus = (status) => {
        switch (status) {
            case 'active': case 'lifetime': return { text: 'Actif', icon: Check, color: 'text-green-500' };
            case 'trialing': return { text: 'En essai', icon: Clock, color: 'text-yellow-500' };
            default: return { text: 'Inactif', icon: XCircle, color: 'text-red-500' };
        }
    };

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm lg:col-span-2">
            <h3 className="flex items-center gap-2 mb-4 font-semibold text-gray-700"><Users className="w-5 h-5 text-blue-500" /> Mes Filleuls Actifs</h3>
            <div className="pr-2 space-y-2 overflow-y-auto max-h-60">
                {referees.length > 0 ? referees.map(ref => {
                    const statusInfo = getStatus(ref.subscription_status);
                    const StatusIcon = statusInfo.icon;
                    return (
                        <div key={ref.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{ref.full_name}</span>
                                <span className="text-xs text-gray-500">{ref.email}</span>
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-semibold ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" /> {statusInfo.text}
                            </span>
                        </div>
                    );
                }) : <p className="py-4 text-sm text-center text-gray-500">Invitez votre premier filleul pour le voir apparaître ici.</p>}
            </div>
        </div>
    );
};

const RewardsCard = ({ validatedCount }) => {
    const rewards = [
        { needed: 1, label: '1 mois offert' },
        { needed: 3, label: '3 mois offerts' },
        { needed: 5, label: '6 mois offerts' },
        { needed: 10, label: 'Abonnement -50% à vie' },
    ];

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 font-semibold text-gray-700"><Gift className="w-5 h-5 text-blue-500" /> Mes Récompenses Débloquées</h3>
            <ul className="space-y-2 text-sm">
                {rewards.map(reward => {
                    const isUnlocked = validatedCount >= reward.needed;
                    return (
                        <li key={reward.label} className={`flex items-center gap-2 ${isUnlocked ? '' : 'opacity-50'}`}>
                            <Check className={`w-4 h-4 rounded-full p-0.5 ${isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`} />
                            <span>{reward.label} ({reward.needed} parrainage{reward.needed > 1 ? 's' : ''})</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const LinkCard = ({ referralCode }) => {
    const [copied, setCopied] = useState(false);
    const link = `https://trezocash.com/signup?ref=${referralCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm lg:col-span-3">
            <h3 className="flex items-center gap-2 mb-4 font-semibold text-gray-700"><Link className="w-5 h-5 text-blue-500" /> Mon Écosystème de Parrainage</h3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                    <input type="text" readOnly value={link} className="w-full text-sm text-gray-600 bg-transparent outline-none" />
                    <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copié !' : 'Copier'}
                    </button>
                </div>
                <div className="text-xs text-gray-500">
                    <p>💡 <strong>Conseil :</strong> Partagez ce lien avec vos amis, collègues et sur vos réseaux sociaux pour maximiser vos gains !</p>
                </div>
            </div>
        </div>
    );
};

const ReferralDashboard = () => {
    // const { dataState } = useData();
    const { uiDispatch } = useUI();
    // const { session } = dataState;
    const [loading, setLoading] = useState(true);
    const [referralData, setReferralData] = useState(null);

    useEffect(() => {
        const loadStaticData = () => {
            try {
                // Simulation du chargement des données
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

                    const referralData = {
                        ...staticUserData,
                        referees: activeReferees,
                        levels: staticLevels,
                        currentLevel,
                        nextLevel
                    };

                    setReferralData(referralData);
                    setLoading(false);
                }, 500); // Petit délai pour simuler le chargement

            } catch (error) {
                console.error("Error loading static referral data:", error);
                uiDispatch({
                    type: 'ADD_TOAST',
                    payload: {
                        message: `Erreur lors du chargement des données de parrainage.`,
                        type: 'error'
                    }
                });
                setLoading(false);
            }
        };

        loadStaticData();
    }, [uiDispatch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!referralData) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Impossible de charger les données de parrainage.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <p className="text-gray-600">Gérez votre programme d'ambassadeur et suivez vos performances</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <StatusCard
                    level={referralData.currentLevel}
                    nextLevel={referralData.nextLevel}
                    validatedCount={referralData.validatedCount}
                />
                <StatsCard
                    stats={{
                        invitedCount: referralData.invitedCount,
                        validatedCount: referralData.validatedCount,
                        conversionRate: referralData.conversionRate,
                        generatedRevenue: referralData.generatedRevenue
                    }}
                />
                <CommissionsCard
                    level={referralData.currentLevel}
                    validatedCount={referralData.validatedCount}
                />
                <ReferralsList referees={referralData.referees} />
                <RewardsCard validatedCount={referralData.validatedCount} />
                <LinkCard referralCode={referralData.referralCode} />
            </div>

            {/* Section d'information supplémentaire */}
            <div className="p-6 mt-8 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="mb-2 font-semibold text-blue-800">💡 Comment maximiser vos gains ?</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Partagez votre lien de parrainage sur LinkedIn et vos autres réseaux professionnels</li>
                    <li>• Recommandez Trezocash à vos collègues et partenaires</li>
                    <li>• Créez du contenu sur les réseaux sociaux pour montrer comment vous utilisez l'application</li>
                    <li>• Atteignez le niveau Argent (3 parrainages) pour commencer à gagner des commissions</li>
                </ul>
            </div>
        </div>
    );
};

export default ReferralDashboard;