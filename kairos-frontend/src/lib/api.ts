import axios from "axios";

// On utilise Axios plutôt que fetch natif pour 3 raisons :
// 1. Intercepteur JWT : le token est ajouté automatiquement à chaque requête (une seule config ici)
// 2. JSON automatique : response.data est déjà parsé, pas besoin de .json()
// 3. Erreurs HTTP : Axios lance une erreur si status >= 400, donc le .catch() fonctionne toujours

// Instance Axios configurée avec l'URL du backend (définie dans .env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Intercepteur de requête : s'exécute avant CHAQUE appel API
// Récupère le token JWT stocké au login, et l'ajoute dans le header Authorization
// Sans ça, le backend répondrait 401 Unauthorized sur toutes les routes protégées
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});