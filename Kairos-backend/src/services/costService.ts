import prisma from "../prisma/prisma";
import { CostSourceType } from "../../generated/prisma";


export async function createCost(data:{
    product_id: string;
    variant_id?: string;
    cost_per_unit: number;
    source_type?: CostSourceType;
    note?: string;
}) {
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