import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        role: "admin" | "owner" | "employee";
        email: string;
      };
      businessId?: number;
      business?: {
        id_business: number;
        owner_id: number;
        name: string;
        business_type: string | null;
        city: string | null;
        country: string | null;
        currency: string;
        timezone: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
      };
    }
  }
}

export {};
