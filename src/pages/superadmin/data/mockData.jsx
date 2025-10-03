export const TIERS = {
  BRONZE: { name: 'Bronze', min: 0, commission: 0, color: 'text-orange-400' },
  ARGENT: { name: 'Argent', min: 10, commission: 0.10, color: 'text-gray-300' },
  OR: { name: 'Or', min: 25, commission: 0.15, color: 'text-yellow-400' },
  PLATINUM: { name: 'Platinum', min: 50, commission: 0.20, color: 'text-cyan-300' },
  DIAMANT: { name: 'Diamant', min: 100, commission: 0.25, color: 'text-blue-300' },
  LEGENDAIRE: { name: 'Légendaire', min: 200, commission: 0.30, color: 'text-purple-400' },
  GLOBALE: { name: 'Globale', min: 500, commission: 0.35, color: 'text-emerald-300' },
};

export const PACKS = {
  solo_monthly: { id: 'solo_monthly', name: 'Pack Solo (Mensuel)', price: 12, annualValue: 12 * 12 },
  solo_yearly: { id: 'solo_yearly', name: 'Pack Solo (Annuel)', price: 96, annualValue: 96 },
  team_monthly: { id: 'team_monthly', name: 'Pack Team (Mensuel)', price: 20, annualValue: 20 * 12 },
  team_yearly: { id: 'team_yearly', name: 'Pack Team (Annuel)', price: 200, annualValue: 200 },
};

export const REWARDS = [
  { referrals: 10, label: 'Abonnement -50% à vie', description: '10 parrainages' },
];

const generateReferrals = (count) => {
  const statuses = ['actif', 'essai', 'inactif'];
  const names = ['Marie D.', 'Thomas L.', 'Sophie M.', 'Marc P.', 'Laura G.', 'Julien B.', 'Claire F.', 'Paul R.'];
  const packIds = Object.keys(PACKS);
  let referrals = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    const months = Math.floor(Math.random() * 12) + 1;
    const registrationDate = new Date(now.getFullYear(), now.getMonth() - months, Math.floor(Math.random() * 28) + 1);
    const pack = PACKS[packIds[i % packIds.length]];
    
    let commissionableValue = 0;
    if(status === 'actif') {
        if (pack.id.includes('monthly')) {
            commissionableValue = pack.price;
        } else { // yearly
            commissionableValue = pack.price / 12;
        }
    }

    referrals.push({
      id: i + 1,
      name: names[i % names.length],
      status: status,
      since: status === 'actif' ? `Depuis ${months} mois` : (status === 'essai' ? `Expire dans ${Math.floor(Math.random() * 10)} jours` : 'Résilé'),
      packId: pack.id,
      packName: pack.name,
      commissionableValue: commissionableValue, // Monthly equivalent value for commission
      annualValue: status === 'actif' ? pack.annualValue : 0,
      registrationDate: registrationDate.toISOString(),
    });
  }
  return referrals;
};

const generatePaymentHistory = (ambassadorId, referrals, tier) => {
    if (tier.commission === 0) return [];
    const history = [];
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 12; i++) { 
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
        
        const allActiveReferrals = referrals.filter(r => r.status === 'actif');
        const activeThisMonthCount = Math.max(0, allActiveReferrals.length - Math.floor(Math.random() * 3));
        
        const activeReferralsListWithDate = allActiveReferrals.slice(0, activeThisMonthCount).map(ref => {
            const paymentDay = Math.floor(Math.random() * 28) + 1;
            const paymentDateInMonth = new Date(year, monthIndex, paymentDay);
            
            const pack = PACKS[ref.packId];
            let commissionableValue = 0;
            let isAnnualPaymentMonth = false;

            // Check if it's an annual payment month
            const registrationDate = new Date(ref.registrationDate);
            if (pack.id.includes('yearly') && registrationDate.getMonth() === monthIndex && registrationDate.getFullYear() <= year) {
                 if ((year - registrationDate.getFullYear()) > 0 && registrationDate.getMonth() === monthIndex) {
                    isAnnualPaymentMonth = true;
                } else if ((year - registrationDate.getFullYear()) === 0) {
                     isAnnualPaymentMonth = true;
                }
            }
            
            if (pack.id.includes('monthly')) {
                commissionableValue = pack.price;
            } else if (isAnnualPaymentMonth) {
                commissionableValue = pack.price;
            }

            return {
                ...ref,
                paymentDateInMonth: paymentDateInMonth.toISOString(),
                commissionableValueForMonth: commissionableValue,
                isAnnualPaymentMonth
            };
        });
        
        const contributingReferrals = activeReferralsListWithDate.filter(r => r.commissionableValueForMonth > 0);

        const totalCommissionableRevenue = contributingReferrals.reduce((sum, ref) => sum + ref.commissionableValueForMonth, 0);
        const commission = totalCommissionableRevenue * tier.commission;
        
        if (activeReferralsListWithDate.length > 0) {
            history.push({
                id: `${ambassadorId}_payment_${i}`,
                month: `${months[monthIndex]} ${year}`,
                activeReferrals: activeReferralsListWithDate.length,
                contributingReferrals: contributingReferrals,
                nonContributingReferrals: activeReferralsListWithDate.filter(r => r.commissionableValueForMonth === 0),
                totalCommissionableRevenue,
                commission: Math.max(0, commission),
                status: i === 0 ? 'En attente' : 'Validé' 
            });
        }
    }
    return history.sort((a,b) => new Date(b.month.split(' ')[1], months.indexOf(b.month.split(' ')[0])) - new Date(a.month.split(' ')[1], months.indexOf(a.month.split(' ')[0])));
}

export const AMBASSADORS_DATA = [
  { id: 'usr_001', name: 'Jean Dupont', email: 'jean.dupont@email.com', referralCode: 'JEANDP21', invitedCount: 12, referrals: generateReferrals(6), usedRewards: [], rewardsToActivate: [], bankingInfo: null, registrationDate: '2023-01-15T10:00:00Z' },
  { id: 'usr_002', name: 'Alice Martin', email: 'alice.martin@email.com', referralCode: 'ALICEMT89', invitedCount: 30, referrals: generateReferrals(26), usedRewards: [10], rewardsToActivate: [], bankingInfo: { iban: 'FR7630006000011234567890189', bic: 'AGRIFRPPXXX' }, registrationDate: '2023-02-20T11:30:00Z' },
  { id: 'usr_003', name: 'Bob Johnson', email: 'bob.j@email.com', referralCode: 'BOBJNSN45', invitedCount: 150, referrals: generateReferrals(110), usedRewards: [10], rewardsToActivate: [], bankingInfo: { iban: 'FR7630004000022345678901234', bic: 'BNPAFRPPXXX' }, registrationDate: '2023-03-05T09:00:00Z' },
  { id: 'usr_004', name: 'Clara Bernard', email: 'clara.b@email.com', referralCode: 'CLARABND12', invitedCount: 80, referrals: generateReferrals(55), usedRewards: [10], rewardsToActivate: [], bankingInfo: { iban: 'FR7610011000203456789012B02', bic: 'SOGEFRPPXXX' }, registrationDate: '2023-04-10T14:00:00Z' },
  { id: 'usr_005', name: 'David Petit', email: 'david.petit@email.com', referralCode: 'DAVIDPT44', invitedCount: 250, referrals: generateReferrals(205), usedRewards: [10], rewardsToActivate: [], bankingInfo: { iban: 'FR7630056009519876543210925', bic: 'CCFRFRPPXXX' }, registrationDate: '2023-05-25T16:45:00Z' },
  { id: 'usr_006', name: 'Eva Dubois', email: 'eva.dubois@email.com', referralCode: 'EVADBS01', invitedCount: 5, referrals: generateReferrals(2), usedRewards: [], rewardsToActivate: [], bankingInfo: null, registrationDate: '2023-06-18T12:00:00Z' },
  { id: 'usr_007', name: 'Felix Moreau', email: 'felix.m@email.com', referralCode: 'FELIXMRX9', invitedCount: 28, referrals: generateReferrals(28), usedRewards: [], rewardsToActivate: [10], bankingInfo: { iban: 'FR7618206002104567890123C88', bic: 'CEPAFRPPXXX' }, registrationDate: '2023-07-01T08:20:00Z' },
  { id: 'usr_008', name: 'Grace Simon', email: 'grace.simon@email.com', referralCode: 'GRACESIM5', invitedCount: 60, referrals: generateReferrals(48), usedRewards: [10], rewardsToActivate: [], bankingInfo: null, registrationDate: '2023-08-11T18:00:00Z' },
  { id: 'usr_009', name: 'Hugo Girard', email: 'hugo.girard@email.com', referralCode: 'HUGOGRD23', invitedCount: 3, referrals: generateReferrals(1), usedRewards: [], rewardsToActivate: [], bankingInfo: null, registrationDate: '2023-09-03T20:00:00Z' },
  { id: 'usr_010', name: 'Ines Roussel', email: 'ines.roussel@email.com', referralCode: 'INESRSL88', invitedCount: 95, referrals: generateReferrals(75), usedRewards: [10], rewardsToActivate: [], bankingInfo: { iban: 'FR76100960008012345678901D22', bic: 'CMCIFRPPXXX' }, registrationDate: '2023-10-22T13:10:00Z' },
  { id: 'usr_011', name: 'Laura Legrand', email: 'laura.legrand@email.com', referralCode: 'LAURALGRND99', invitedCount: 600, referrals: generateReferrals(510), usedRewards: [10], rewardsToActivate: [], bankingInfo: { iban: 'FR76100960008098765432109E33', bic: 'CMCIFRPPXXX' }, registrationDate: '2022-11-15T10:00:00Z' },
];

export const getAmbassadorData = (id) => {
    const data = AMBASSADORS_DATA.find(a => a.id === id);
    if (!data) return null;

    const validatedReferrals = data.referrals.filter(r => r.status === 'actif').length;
    const conversionRate = data.invitedCount > 0 ? (validatedReferrals / data.invitedCount) * 100 : 0;
    
    const tiersArray = Object.values(TIERS).sort((a,b) => b.min - a.min);
    const currentTier = tiersArray.find(t => validatedReferrals >= t.min);
    const nextTierIndex = tiersArray.indexOf(currentTier) - 1;
    const nextTier = nextTierIndex >= 0 ? tiersArray[nextTierIndex] : null;

    const monthlyCommissionableRevenue = data.referrals
        .filter(r => r.status === 'actif')
        .reduce((sum, r) => sum + r.commissionableValue, 0);
    
    const monthlyCommission = monthlyCommissionableRevenue * currentTier.commission;

    const generatedRevenue = data.referrals
        .filter(r => r.status === 'actif')
        .reduce((sum, r) => sum + r.annualValue, 0);
    
    const paymentHistory = generatePaymentHistory(data.id, data.referrals, currentTier);

    const totalEarned = paymentHistory
        .filter(p => p.status === 'Validé')
        .reduce((sum, p) => sum + p.commission, 0);

    return {
        ...data,
        validatedReferrals,
        conversionRate,
        currentTier,
        nextTier,
        monthlyCommission,
        generatedRevenue,
        totalEarned,
        paymentHistory,
    };
};

export const getFullAmbassadorDataList = () => {
    return AMBASSADORS_DATA.map(ambassador => getAmbassadorData(ambassador.id));
}

export const getGlobalAdminStats = () => {
    const allAmbassadors = getFullAmbassadorDataList();
    
    const totalAmbassadors = allAmbassadors.length;
    const activeAmbassadors = allAmbassadors.filter(a => a.validatedReferrals > 0).length;
    
    const totalMonthlyCommissions = allAmbassadors.reduce((sum, a) => sum + a.monthlyCommission, 0);
    
    const topAmbassador = allAmbassadors.reduce((top, current) => {
        return current.monthlyCommission > top.monthlyCommission ? current : top;
    }, allAmbassadors[0] || { monthlyCommission: 0, name: 'N/A' });

    const tierDistribution = allAmbassadors.reduce((dist, a) => {
        const tierName = a.currentTier.name;
        dist[tierName] = (dist[tierName] || 0) + 1;
        return dist;
    }, {});

    return {
        totalAmbassadors,
        activeAmbassadors,
        totalMonthlyCommissions,
        topAmbassador,
        tierDistribution
    };
};

export const getPendingValidations = () => {
    const allAmbassadors = getFullAmbassadorDataList();
    const pending = [];

    allAmbassadors.forEach(ambassador => {
        if (ambassador.paymentHistory) {
            ambassador.paymentHistory.forEach(payment => {
                if (payment.status === 'En attente' && payment.commission > 0) {
                    pending.push({
                        ...payment,
                        ambassadorName: ambassador.name,
                        ambassadorId: ambassador.id,
                    });
                }
            });
        }
    });

    return pending;
};

export const getRevenueData = () => {
    const data = [];
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const allAmbassadorsFullData = getFullAmbassadorDataList();

    for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
        const monthName = `${months[monthIndex]} ${year}`;

        // Simulate subscribers and revenue for the month
        const subscribers = {
            solo_monthly: Math.floor(Math.random() * 200) + 50 + i * 5,
            solo_yearly: Math.floor(Math.random() * 100) + 20 + i * 3,
            team_monthly: Math.floor(Math.random() * 80) + 10 + i * 2,
            team_yearly: Math.floor(Math.random() * 40) + 5 + i,
        };

        const newAnnualSolo = Math.floor(subscribers.solo_yearly / 12);
        const newAnnualTeam = Math.floor(subscribers.team_yearly / 12);

        const revenue = (subscribers.solo_monthly * PACKS.solo_monthly.price) +
                        (subscribers.team_monthly * PACKS.team_monthly.price) +
                        (newAnnualSolo * PACKS.solo_yearly.price) +
                        (newAnnualTeam * PACKS.team_yearly.price);

        // Aggregate commissions for the month
        let commissions = 0;
        allAmbassadorsFullData.forEach(ambassador => {
            const paymentForMonth = ambassador.paymentHistory.find(p => p.month === monthName);
            if (paymentForMonth) {
                commissions += paymentForMonth.commission;
            }
        });
        
        // Ensure commission is not higher than revenue
        commissions = Math.min(revenue * 0.4, commissions);

        data.push({
            id: i,
            month: monthName,
            trialUsers: Math.floor(Math.random() * 50) + 10,
            subscribers: subscribers,
            revenue: revenue,
            commissions: commissions,
            grossMargin: revenue - commissions,
        });
    }

    return data;
};

export const getDailyRevenueData = (days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Simulate a base revenue with some weekly seasonality and random noise
        const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
        const baseRevenue = 1500 + (Math.sin(i / 7) * 300);
        let dailyFactor = 1.0;
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend dip
            dailyFactor = 0.8;
        }
        if (dayOfWeek === 1) { // Monday spike
            dailyFactor = 1.2;
        }
        const noise = (Math.random() - 0.5) * 400;
        const revenue = Math.max(500, baseRevenue * dailyFactor + noise + (days - i) * 2);

        // Simulate subscriber count
        const baseSubscribers = 400 + (Math.sin(i / 14) * 50) + (days - i) * 0.5;
        const subscriberNoise = (Math.random() - 0.5) * 50;
        const subscribers = Math.max(100, Math.floor(baseSubscribers + subscriberNoise));

        data.push({
            date: date.toISOString().split('T')[0],
            revenue: revenue,
            subscriberCount: subscribers,
        });
    }
    return data;
};

const generateAllUsers = (count) => {
    const users = [];
    const firstNames = ['Léa', 'Gabriel', 'Chloé', 'Louis', 'Emma', 'Raphaël', 'Manon', 'Arthur', 'Inès', 'Jules'];
    const lastNames = ['Bernard', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre'];
    const statuses = ['essai', 'abonné'];
    const packIds = Object.keys(PACKS);
    const sponsors = AMBASSADORS_DATA;

    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`;
        
        const registrationDaysAgo = Math.floor(Math.random() * 365);
        const registrationDate = new Date();
        registrationDate.setDate(registrationDate.getDate() - registrationDaysAgo);

        const lastConnectionDaysAgo = Math.floor(Math.random() * registrationDaysAgo);
        const lastConnectionDate = new Date();
        lastConnectionDate.setDate(lastConnectionDate.getDate() - lastConnectionDaysAgo);

        const status = statuses[Math.floor(Math.random() * statuses.length)];
        let pack = null;
        if (status === 'abonné') {
            pack = PACKS[packIds[Math.floor(Math.random() * packIds.length)]];
        }

        const hasSponsor = Math.random() > 0.3; // 70% have a sponsor
        const sponsor = hasSponsor ? sponsors[Math.floor(Math.random() * sponsors.length)] : null;

        users.push({
            id: `gen_usr_${i}`,
            name,
            email,
            registrationDate: registrationDate.toISOString(),
            lastConnectionDate: lastConnectionDate.toISOString(),
            status,
            packId: pack ? pack.id : null,
            packName: pack ? pack.name : null,
            sponsorId: sponsor ? sponsor.id : null,
            sponsorName: sponsor ? sponsor.name : null,
        });
    }
    return users;
};

const allUsersData = generateAllUsers(150);

export const getAllUsersData = () => {
    return allUsersData;
};
