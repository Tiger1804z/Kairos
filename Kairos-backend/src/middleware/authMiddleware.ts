import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";



export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    // 1) Sécurité environnement
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET_MISSING" });
    }

    // 2) Header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "AUTH_REQUIRED" });
    }

    // 3) Extraction token
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ error: "AUTH_REQUIRED" });
    }

    // 4) Vérification JWT
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 5) Payload minimal attendu
    if (
      !payload ||
      typeof payload.user_id !== "number" ||
      !payload.email ||
      !payload.role
    ) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }

    // 6) Injection user (contrat clair)
    req.user = {
      user_id: payload.user_id,
      role: String(payload.role),
      email: String(payload.email),
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
};
