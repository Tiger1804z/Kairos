import type { Request, Response } from "express";
import prisma from "../prisma/prisma"; // adapte le chemin si ton fichier est ailleurs
import {createNewClient, deleteClientService, getAllClients, getOneClientById, updateClientService} from "../services/clientsService";

export const createMyClient = async (req: Request, res: Response) => {
    try {
        const client = await createNewClient(req.body);
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const listMyClients = async (req: Request, res: Response) => {
    try {
        const clients = await getAllClients();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: "Server error while fetching clients" });
    }
};

export const getMyClientById = async (req: Request, res: Response) => {
    const clientId = Number(req.params.id);
    if (isNaN(clientId)) {
        return res.status(400).json({ error: "Invalid client ID" });
    }
    try {
        const client = await getOneClientById(clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(200).json(client);
    } catch (err) {
        console.error("Get client error:", err);
        res.status(500).json({ error: "Server error while fetching client" });
    }
};

export const updateMyClient = async (req: Request, res: Response) => {
  const clientId = Number(req.params.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: "Invalid client ID" });
  }

  const {
    business_id,
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
  } = req.body;

  try {
    const updatedClient = await updateClientService(clientId, {
      business_id,
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
    res.status(200).json(updatedClient);
  } catch (err: any) {
    console.error("Update client error:", err);
    res.status(500).json({ error: "Server error while updating client" });
  }
};

export const deleteMyClient = async (req: Request, res: Response) => {
  const clientId = Number(req.params.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: "Invalid client ID" });
  }

  try {
    await deleteClientService(clientId);
    res.status(204).send();
  } catch (err: any) {
    console.error("Delete client error:", err);
    res.status(500).json({ error: "Server error while deleting client" });
  }
};
