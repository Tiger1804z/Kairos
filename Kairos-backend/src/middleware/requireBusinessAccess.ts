import type { Request, Response, NextFunction } from "express";
import prisma from "../prisma/prisma";



export const requireBusinessAccess = (opts?: {
  from?: "query" | "params" | "body";
  key?: string;
 // ... dans opts.entity union:
  entity?: "business" | "document" | "client" | "engagement" | "engagementItem" | "transaction" | "report" | "queryLog";




}) => {
  const from = opts?.from ?? "query";
  const key = opts?.key ?? "business_id";
  const entity = opts?.entity ?? "business";

  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as
      | { user_id: number; role: string; email: string }
      | undefined;

    if (!user) return res.status(401).json({ error: "AUTH_REQUIRED" });

    // 1) Lire la valeur brute (id business OU id entity)
    const raw =
      from === "query"
        ? (req.query as any)[key]
        : from === "params"
        ? (req.params as any)[key]
        : (req.body as any)[key];

    const id = Number(raw);
    if (!id || Number.isNaN(id)) {
      // message générique (on ne sait pas encore si c’est business_id ou entity id)
      return res.status(400).json({ error: "INVALID_ID" });
    }

    // 2) Résoudre businessId selon entity
    let businessId: number | null = null;

    if (entity === "business") {
      businessId = id;
    } else if (entity === "document") {
      const doc = await prisma.document.findUnique({
        where: { id_document: id },
        select: { business_id: true },
      });
      if (!doc) return res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
      businessId = doc.business_id;
    } else if (entity === "client") {
      const client = await prisma.client.findUnique({
        where: { id_client: id },
        select: { business_id: true },
      });
      if (!client) return res.status(404).json({ error: "CLIENT_NOT_FOUND" });
      businessId = client.business_id;
    } else if (entity === "engagement") {
      const engagement = await prisma.engagement.findUnique({
        where: { id_engagement: id },
        select: { business_id: true },
      });
      if (!engagement) return res.status(404).json({ error: "ENGAGEMENT_NOT_FOUND" });
      businessId = engagement.business_id;
      
    }else if (entity === "engagementItem") {
      const item = await prisma.engagementItem.findUnique({
        where: { id_item: id },
        select: { business_id: true },
      });
      if (!item) return res.status(404).json({ error: "ENGAGEMENT_ITEM_NOT_FOUND" });
      businessId = item.business_id;

    }else if (entity === "transaction") {
      const tx = await prisma.transaction.findUnique({
        where: { id_transaction: id },
        select: { business_id: true },
      });
      if (!tx) return res.status(404).json({ error: "TRANSACTION_NOT_FOUND" });
      businessId = tx.business_id;

    }else if (entity === "report") {
      const r = await prisma.report.findUnique({
        where: { id_report: id },
        select: { business_id: true },
      });
      if (!r) return res.status(404).json({ error: "REPORT_NOT_FOUND" });
      businessId = r.business_id;

    } else if (entity === "queryLog") {
      const q = await prisma.queryLog.findUnique({
        where: { id_query: id },
        select: { business_id: true },
      });
      if (!q) return res.status(404).json({ error: "QUERY_LOG_NOT_FOUND" });
      businessId = q.business_id;
    }

    
    

    if (!businessId) {
      return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });
    }

    // 3) Admin : accès global
    if (user.role === "admin") {
      (req as any).businessId = businessId;
      return next();
    }

    // 4) Owner : doit posséder le business
    const ok = await prisma.business.findFirst({
      where: { id_business: businessId, owner_id: user.user_id },
      select: { id_business: true },
    });

    if (!ok) return res.status(403).json({ error: "FORBIDDEN" });

    (req as any).businessId = businessId;
    return next();
  };
};
