import type {Request, Response} from "express";
import prisma from "../prisma/prisma";


export async function handleGetProducts(req: Request, res: Response){
    const businessId = parseInt(req.params.businessId ?? "", 10);

    const products = await prisma.product.findMany({
        where: { business_id: businessId },
        include: {
            variants: true,
            costs: {
                orderBy: { effective_from: "desc" },
                take: 1,
            },
        },
        orderBy: {title: "asc"},
    });

    return res.json(products);
}

