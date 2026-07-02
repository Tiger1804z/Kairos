import prisma from "../prisma/prisma";
import { CostSourceType } from "../../generated/prisma";


export async function createCost(data:{
    product_id: string;
    variant_id?: string;
    cost_per_unit: number;
    source_type?: CostSourceType;
    note?: string;
}) {
    // GATE-A-REM-07 : si variant_id est fourni, il doit appartenir au produit
    // ciblé. L'ownership business du product_id est déjà garanti en amont par
    // requireBusinessAccess (S0-FIX-02) → un variant rattaché à ce produit
    // appartient transitivement au même business. Le check combiné
    // (id + product_id) ne révèle pas si le variant existe ailleurs
    // (anti-énumération). Aucun cost n'est écrit si le check échoue.
    if (data.variant_id) {
        const variant = await prisma.productVariant.findFirst({
            where: { id: data.variant_id, product_id: data.product_id },
            select: { id: true },
        });
        if (!variant) throw new Error("VARIANT_INVALID");
    }

    return prisma.productCost.create({
        data: {
            product_id: data.product_id,
            variant_id: data.variant_id ?? null,
            cost_per_unit: data.cost_per_unit,
            source_type: data.source_type ?? "manual",
            note: data.note ?? null,
        },
    });

}

export async function getCostByProduct(product_id: string){
    return prisma.productCost.findMany({
        where: { product_id },
        orderBy: { effective_from: "desc" },
    });
}

export async function getLatestCost(product_id: string, variant_id?: string){
    return prisma.productCost.findFirst({
        where: { 
            product_id,
            variant_id: variant_id ?? null,
        },
        orderBy: { effective_from: "desc" },
    }); 
}