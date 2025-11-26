import React from 'react';
import { Award, Gift, TrendingUp, Star, Zap, Crown, Sparkles, ChevronRight } from 'lucide-react';

const ProgramInfoPage = () => {
    const tiers = [
        {
            name: 'Bronze',
            min: 0,
            commission: 0,
            color: 'from-amber-700 to-amber-900',
            textColor: 'text-amber-700',
            icon: '🥉',
            description: 'Point de départ'
        },
        {
            name: 'Argent',
            min: 3,
            commission: 2.5,
            color: 'from-gray-300 to-gray-500',
            textColor: 'text-gray-600',
            icon: '🥈',
            description: 'Premier niveau payant'
        },
        {
            name: 'Or',
            min: 10,
            commission: 5,
            color: 'from-yellow-400 to-yellow-600',
            textColor: 'text-yellow-600',
            icon: '🥇',
            description: 'Récompense spéciale'
        },
        {
            name: 'Platinum',
            min: 25,
            commission: 7.5,
            color: 'from-cyan-400 to-blue-600',
            textColor: 'text-cyan-600',
            icon: '💎',
            description: 'Elite'
        },
        {
            name: 'Diamant',
            min: 50,
            commission: 10,
            color: 'from-purple-400 to-pink-600',
            textColor: 'text-purple-600',
            icon: '💎',
            description: 'Exclusif'
        },
        {
            name: 'Legendaire',
            min: 100,
            commission: 15,
            color: 'from-orange-500 to-red-600',
            textColor: 'text-orange-600',
            icon: '🎖️',
            description: 'Top ambassadeur'
        }
    ];

    const rewards = [
        { referrals: 1, reward: '1 mois offert', icon: Gift },
        { referrals: 3, reward: '3 mois offerts', icon: Gift },
        { referrals: 5, reward: '6 mois offerts', icon: Gift },
        { referrals: 10, reward: 'Abonnement -50% à vie', icon: Crown },
    ];

    return (
        <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="mx-auto space-y-8 max-w-7xl">

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900">Le Programme Ambassadeur</h1>
                    <p className="text-gray-600">Découvrez tous les niveaux, commissions et récompenses du programme</p>
                </div>

                {/* Hero Section */}
                <div className="relative p-8 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl"></div>
                    <div className="relative flex flex-col items-center gap-6 md:flex-row">
                        <div className="flex items-center justify-center w-24 h-24 shadow-lg rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/30">
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="mb-2 text-2xl font-bold text-gray-900">Gagnez en parrainant vos proches</h2>
                            <p className="text-gray-600">Plus vous parrainez, plus vos avantages augmentent. Accédez à des niveaux exclusifs avec des commissions récurrentes et des récompenses exceptionnelles.</p>
                        </div>
                    </div>
                </div>

                {/* Niveaux d'Ambassadeur */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Award className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Les Niveaux d'Ambassadeur</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tiers.map((tier, index) => (
                            <div
                                key={tier.name}
                                className="relative p-6 overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>

                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-4xl">{tier.icon}</span>
                                        {index > 0 && (
                                            <div className="px-3 py-1 text-xs font-semibold text-blue-600 rounded-full bg-blue-50">
                                                {tier.commission}€/mois/filleul
                                            </div>
                                        )}
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-1 ${tier.textColor}`}>
                                        {tier.name}
                                    </h3>
                                    <p className="mb-3 text-sm text-gray-500">{tier.description}</p>

                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
                                            <span className="text-xs font-medium text-gray-600">
                                                {tier.min}+ parrainage{tier.min > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {tier.commission > 0 ? (
                                        <div className="pt-4 mt-4 border-t border-gray-100">
                                            <div className="text-4xl font-bold text-gray-900">
                                                {tier.commission}€
                                            </div>
                                            <p className="text-sm text-gray-600">par mois et par filleul actif</p>
                                        </div>
                                    ) : (
                                        <div className="pt-4 mt-4 border-t border-gray-100">
                                            <p className="text-sm text-gray-700">
                                                <strong>1 mois gratuit</strong> pour chaque filleul validé
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Récompenses Spéciales */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <Gift className="w-6 h-6 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Récompenses Spéciales</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {rewards.map((reward, index) => {
                            const RewardIcon = reward.icon;
                            const isSpecial = reward.referrals === 10;

                            return (
                                <div
                                    key={index}
                                    className={`p-6 bg-white border shadow-sm rounded-2xl hover:shadow-md transition-all ${isSpecial
                                        ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
                                        : 'border-gray-100'
                                        }`}
                                >
                                    <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl ${isSpecial
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30'
                                        : 'bg-blue-50'
                                        }`}>
                                        <RewardIcon className={`w-6 h-6 ${isSpecial ? 'text-white' : 'text-blue-600'}`} />
                                    </div>

                                    <div className="mb-2 text-sm text-gray-600">
                                        {reward.referrals} parrainage{reward.referrals > 1 ? 's' : ''}
                                    </div>
                                    <div className={`text-lg font-bold ${isSpecial ? 'text-amber-700' : 'text-gray-900'}`}>
                                        {reward.reward}
                                    </div>

                                    {isSpecial && (
                                        <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-600">
                                            <Star className="w-3 h-3 fill-current" />
                                            Récompense exclusive
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Détails des Avantages */}
                <section className="grid gap-6 lg:grid-cols-2">
                    {/* Bronze */}
                    <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">🥉</div>
                            <div>
                                <h3 className="text-xl font-bold text-amber-700">Niveau Bronze</h3>
                                <p className="text-sm text-gray-600">0-2 parrainages</p>
                            </div>
                        </div>

                        <p className="mb-4 text-sm text-gray-700">
                            Votre entrée dans le cercle des ambassadeurs. Chaque filleul validé vous rapporte un mois d'abonnement gratuit.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full">
                                    <ChevronRight className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-sm text-gray-700">
                                    <strong>1 filleul validé = 1 mois gratuit</strong>
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full">
                                    <ChevronRight className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-sm text-gray-700">
                                    Cumulez jusqu'à 2 mois gratuits avant de passer au niveau Argent
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Niveaux Supérieurs */}
                    <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl">🥈</div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-700">Niveaux Argent et Supérieur</h3>
                                <p className="text-sm text-gray-600">3+ parrainages</p>
                            </div>
                        </div>

                        <p className="mb-4 text-sm text-gray-700">
                            Devenez un partenaire actif et gagnez des commissions récurrentes. En plus, à 10 filleuls, débloquez une récompense spéciale : l'abonnement à vie à -50% !
                        </p>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <span className="font-medium text-gray-600">Argent (3+)</span>
                                <span className="font-bold text-gray-900">2.5€/mois/filleul</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <span className="font-medium text-yellow-600">Or (10+)</span>
                                <span className="font-bold text-gray-900">5€/mois/filleul</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <span className="font-medium text-cyan-600">Platinum (25+)</span>
                                <span className="font-bold text-gray-900">7.5€/mois/filleul</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <span className="font-medium text-purple-600">Diamant (50+)</span>
                                <span className="font-bold text-gray-900">10€/mois/filleul</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <span className="font-medium text-orange-600">Légendaire (100+)</span>
                                <span className="font-bold text-gray-900">15€/mois/filleul</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <div className="p-8 border border-blue-400 shadow-xl rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                    <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                        <div className="flex items-center justify-center w-16 h-16 bg-white shadow-lg rounded-2xl">
                            <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1 text-white">
                            <h3 className="mb-2 text-2xl font-bold">Prêt à devenir ambassadeur ?</h3>
                            <p className="text-blue-100">
                                Commencez dès maintenant à parrainer vos proches et débloquez des avantages exclusifs. Plus vous parrainez, plus vous gagnez !
                            </p>
                        </div>
                        <button className="px-8 py-4 font-semibold text-blue-600 transition-all bg-white shadow-lg rounded-xl hover:bg-blue-50 active:scale-95">
                            Partager mon lien
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProgramInfoPage;