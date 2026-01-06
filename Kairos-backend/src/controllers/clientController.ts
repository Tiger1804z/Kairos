import type { Request, Response } from "express";
import {
  createClientForBusinessService,
  listClientsByBusinessService,
  getClientByIdService,
  updateClientByIdService,
  deleteClientByIdService,
} from "../services/clientsService";

// --------------------
// MY (user connecté) - business scoped
// --------------------

export const createMyClient = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!; // forcé

    const {
      first_name,
      last_name,
      company_name,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      notes,
      is_active,
    } = req.body ?? {};

    const client = await createClientForBusinessService({
      business_id: businessId, // forcé
      first_name,
      last_name,
      company_name,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      notes,
      is_active,
    });

    return res.status(201).json({ client });
  } catch (err: any) {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const listMyClients = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId!; // forcé
    const items = await listClientsByBusinessService(businessId);
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const getMyClientById = async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.id);
    if (!clientId || Number.isNaN(clientId)) {
      return res.status(400).json({ error: "INVALID_CLIENT_ID" });
    }

    const client = await getClientByIdService(clientId);
    if (!client) return res.status(404).json({ error: "CLIENT_NOT_FOUND" });

   
    return res.json({ client });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const updateMyClient = async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.id);
    if (!clientId || Number.isNaN(clientId)) {
      return res.status(400).json({ error: "INVALID_CLIENT_ID" });
    }

    // allowlist (PAS business_id)
    const {
      first_name,
      last_name,
      company_name,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      notes,
      is_active,
    } = req.body ?? {};

    const updated = await updateClientByIdService(clientId, {
      first_name,
      last_name,
      company_name,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      notes,
      is_active,
    });

    return res.json({ client: updated });
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "CLIENT_NOT_FOUND" });
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const deleteMyClient = async (req: Request, res: Response) => {
  try {
    const clientId = Number(req.params.id);
    if (!clientId || Number.isNaN(clientId)) {
      return res.status(400).json({ error: "INVALID_CLIENT_ID" });
    }

    await deleteClientByIdService(clientId);
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "CLIENT_NOT_FOUND" });
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
