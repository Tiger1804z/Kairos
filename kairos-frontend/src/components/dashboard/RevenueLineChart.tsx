import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { useI18n } from "../../i18n/useI18n";


type MonthlyTrend = {
    month: string;
    income: number;
    expenses: number;
};

type Props = {
    data: MonthlyTrend[] ;
};

export function RevenueLineChart({ data }: Props) {
    const { language, t } = useI18n();

    return(
        // ResponsiveContainer : Rend le graphique responsive (il s'adapte à la largeur du parent)
        <ResponsiveContainer width="100%" height={300}>
            {/* LineChart : Le container principal, reçoit le data array */}
            <LineChart data={data}>
                {/* CartesianGrid : La grille en arrière-plan (les lignes pointillées) */}
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                {/* XAxis : L'axe horizontal, il lit la clé "month" de chaque objet */}
                <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
                />
                {/* YAxis : L'axe vertical, formatte les valeurs en $18k au lieu de 18000 */}
                <YAxis
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                {/* Tooltip : Le popup qui apparaît quand tu hover un point */}
                <Tooltip
                contentStyle={{
                    backgroundColor: "#161B22",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                }}
                formatter={(value) =>
                    new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", {
                    style: "currency",
                    currency: "CAD",
                    }).format(value as number)
                }
                />
                {/* Legend : Affiche la légende (Income = vert, Expenses = rouge) */}
                <Legend />
                {/* Line : Une ligne verte pour les revenus, type="monotone" = courbe lisse */}
                <Line
                type="monotone"
                dataKey="income"
                name={t("dashboard.chart.income")}
                stroke="#6ee7b7"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                />
                {/* Line : Une ligne rouge pour les dépenses */}
                <Line
                type="monotone"
                dataKey="expenses"
                name={t("dashboard.chart.expenses")}
                stroke="#fca5a5"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
