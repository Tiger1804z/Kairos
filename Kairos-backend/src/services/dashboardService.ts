/**
 * ============================================================================
 * Dashboard Service
 * ============================================================================
 * Agrège les données de plusieurs tables pour alimenter le dashboard:
 * - Métriques clés (clients, engagements actifs, revenu mensuel)
 * - Top 5 clients par revenu
 * - Croissance du revenu mois/mois
 * - Tendance mensuelle (6 derniers mois) pour le line chart
 * - Dépenses par catégorie (mois en cours) pour le pie chart
 */

import prisma from "../prisma/prisma";

// retourne les métriques du dashboard
export const getDashboardMetricsService = async (businessId: number) => {
    const totalClients = await prisma.client.count({
        where: { business_id: businessId, is_active: true },
    });
    

    // compter le nombre d"engagements actifs
    const  activeEngagements = await prisma.engagement.count({
        where: { business_id: businessId, status: "active" },
    });

    // revenue du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
        where: {
            business_id: businessId,
            transaction_type: "income",
            transaction_date: {gte: startOfMonth, lte: endOfMonth},
        },
        select:{
            amount: true,
        },
    });

    //calculer le revenu total
    const monthlyRevenue = transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
    );
    return {
        totalClients,
        activeEngagements,
        monthlyRevenue,
    };
};



// retourne 5 meilleurs clients par revenue total

export const getTopClientsService = async (businessId: number) => {
  // Récupérer les clients avec leur revenu total
  const clients = await prisma.client.findMany({
    where: {
      business_id: businessId,
      is_active: true,
    },
    select: {
      id_client: true,
      first_name: true,
      last_name: true,
      company_name: true,
      transactions: {
        where: {
          transaction_type: "income",
        },
        select: {
          amount: true,
        },
      },
    },
  });

  // Calculer le revenu total pour chaque client
  const clientsWithRevenue = clients.map((client) => {
    const totalRevenue = client.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    return {
      id: client.id_client,
      name: client.company_name || 
            `${client.first_name || ""} ${client.last_name || ""}`.trim() || 
            "Client sans nom",
      revenue: totalRevenue,
    };
  });

  // Trier par revenu décroissant et prendre les 5 premiers
  return clientsWithRevenue
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
};

// revenue growth
// compare le revenu du mois en cours avec le mois précédent
export const getRevenueGrowthService = async (businessId: number) => {
    const now = new Date();

    // Mois en cours
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Mois précédent
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Revenu du mois en dernier
    const lastMonthTransactions = await prisma.transaction.findMany({
         where: {
            business_id: businessId,
            transaction_type: "income",
            transaction_date: {
                gte: startOfPreviousMonth,
                lte: endOfPreviousMonth,
            },
            },
            select: { amount: true },
    });

    const lastMonthRevenue = lastMonthTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
    );

    // Revenu du mois en cours
    const thisMonthTransactions = await prisma.transaction.findMany({
          where: {
            business_id: businessId,
            transaction_type: "income",
            transaction_date: {
                gte: startOfCurrentMonth,
                lte: endOfCurrentMonth,
            },
            },
            select: { amount: true },
        });

    const thisMonthRevenue = thisMonthTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
    );

    // Calculer la croissance en pourcentage

    const growth= lastMonthRevenue >0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    :0;

    return {
        lastMonth: lastMonthRevenue,
        thisMonth: thisMonthRevenue,
        growth: Math.round(growth*10)/10, // arrondi à une décimale
    };
}



// === DONNEES POUR LES GRAPHIQUES ===

// REVENU et DEPENSES par mois (6 last) pour le line chart du dashboard

export const getMonthlyTrendService = async (businessId: number) => {
  const now = new Date();

  const months = [];
  for (let i=5; i>=0 ;i--){
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        business_id: businessId,
        transaction_date: { gte: start, lte: end },
      },
      select: {
        amount: true,
        transaction_type: true,
      },
    });

    const income = transactions
      .filter(t => t.transaction_type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => t.transaction_type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

      // Nom du mois abrégé (ex: "Jan", "Feb", etc.)
      const monthName = start.toLocaleString("default", { month: "short" });

      months.push({
        month: monthName,
        income,
        expenses,
      });
  }

  return months;
};

// Depenses regroupe par catégorie pour le  pie chart
export const getExpenseByCategoryService = async (businessId: number) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      business_id: businessId,
      transaction_type: "expense",
      transaction_date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: {
      amount: true,
      category: true,
    },
  });

  // Regrouper les dépenses par catégorie
  const categoryMap: Record<string, number> = {};
  for (const t of transactions) {
    const category = t.category || "other";
    categoryMap[category] = (categoryMap[category] || 0) + Number(t.amount);
  }

  // Convertir en tableau pour le frontend
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
  }));
};


        
    
    
