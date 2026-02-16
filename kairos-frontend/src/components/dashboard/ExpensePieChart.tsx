import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,

} from "recharts";

type ExpenseByCategory = {
    category: string;
    amount: number;
};

type Props = {
    data: ExpenseByCategory[] ;
};

// Palette de couleurs pour chaque partie
const COLORS = ["#6ee7b7", "#93c5fd", "#fca5a5", "#fcd34d", "#c4b5fd", "#f9a8d4"];


export default function ExpensePieChart({ data }: Props) {
    return (
         // ResponsiveContainer : Adapte la taille au parent
        <ResponsiveContainer width="100%" height={300}>
        {/* PieChart : Le container principal du camembert */}
        <PieChart>
            {/* Pie : Le camembert lui-même */}
            {/* dataKey="amount" : la valeur numérique de chaque part */}
            {/* nameKey="category" : le label de chaque part */}
            {/* cx/cy="50%" : centré horizontalement et verticalement */}
            {/* outerRadius : le rayon du cercle */}
            <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={3}
            label={({ name, percent }) =>
                `${name} ${((percent ?? 0 )* 100).toFixed(0)}%`
            }
            labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
            >
            {/* Cell : Chaque part du camembert reçoit une couleur différente */}
            {data.map((_, index) => (
                <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                />
            ))}
            </Pie>
            {/* Tooltip : Le popup au hover avec le montant formatté en CAD */}
            <Tooltip
            contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
            }}
            formatter={(value) =>
                new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
                }).format(value as number)
            }
            />
            {/* Legend : La légende en bas (quelles couleurs = quelles catégories) */}
            <Legend />
        </PieChart>
        </ResponsiveContainer>
  );
}