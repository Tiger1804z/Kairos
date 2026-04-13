import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { Card } from "../../components/ui/Card";
import { getShopifyStatus, connectShopify, triggerShopifySync } from "../../services/shopifyService";
import { api } from "../../lib/api";

type ShopifyStatus =
  | { connected: false }
  | {
      connected: true;
      shop_domain: string;
      connected_at: string;
      last_sync_at: string | null;
      counts: { products: number; customers: number; orders: number };
    };

export default function SettingsPage() {
  const { selectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoResult, setDemoResult] = useState<{ productsSeeded: number; insightsGenerated: number } | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Détecter le redirect OAuth ?shopify=connected
  useEffect(() => {
    if (searchParams.get("shopify") === "connected") {
      setJustConnected(true);
      // Nettoyer l'URL sans recharger la page
      navigate("/dashboard/settings", { replace: true });
    }
  }, []);

  // Charger le statut Shopify au montage
  useEffect(() => {
    console.log("Shopify effect:", selectedBusiness);
    if (!selectedBusiness) return;
    console.log("Calling getShopifyStatus for", selectedBusiness.id_business);
    getShopifyStatus(selectedBusiness.id_business)
      .then(setShopifyStatus)
      .catch((err) => console.error("Shopify status error:", err));
  }, [selectedBusiness]);

  async function handleConnect() {
    if (!shopDomain.trim()) return;
    setConnecting(true);
    const data = await connectShopify(shopDomain.trim());
    setConnecting(false);
    if (data.authUrl) {
      window.location.href = data.authUrl; // redirect vers Shopify OAuth
    }
  }

  async function handleSync() {
    if (!selectedBusiness) return;
    setSyncing(true);
    try {
      await triggerShopifySync(selectedBusiness.id_business);
      const updated = await getShopifyStatus(selectedBusiness.id_business);
      setShopifyStatus(updated);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleLoadDemo() {
    if (!selectedBusiness) return;
    setLoadingDemo(true);
    setDemoResult(null);
    setDemoError(null);
    try {
      const res = await api.post(`/demo/${selectedBusiness.id_business}/load`);
      setDemoResult(res.data);
    } catch (err: any) {
      setDemoError(err?.response?.data?.error || err?.message || "Demo load failed");
    } finally {
      setLoadingDemo(false);
    }
  }

  if (!selectedBusiness) return <div className="px-6 py-12 text-white/40">Aucun business sélectionné</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Infos business */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-6">Informations du business</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
          <div><span className="text-white/40">Nom</span><p className="mt-1 text-white">{selectedBusiness.name}</p></div>
          <div><span className="text-white/40">Type</span><p className="mt-1">{selectedBusiness.business_type ?? "—"}</p></div>
          <div><span className="text-white/40">Ville</span><p className="mt-1">{selectedBusiness.city ?? "—"}</p></div>
          <div><span className="text-white/40">Pays</span><p className="mt-1">{selectedBusiness.country ?? "—"}</p></div>
        </div>
      </Card>

      {/* Shopify */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-6">Intégration Shopify</h2>

        {justConnected && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
            Boutique connectée avec succès !
          </div>
        )}

        {shopifyStatus === null && (
          <p className="text-sm text-white/40">Chargement...</p>
        )}

        {shopifyStatus?.connected === false && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">Connectez votre boutique Shopify pour synchroniser vos données.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="votre-boutique.myshopify.com"
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30"
              />
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-sm hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {connecting ? "Redirection..." : "Connecter"}
              </button>
            </div>
          </div>
        )}

        {shopifyStatus?.connected === true && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
              <div><span className="text-white/40">Boutique</span><p className="mt-1 text-white">{shopifyStatus.shop_domain}</p></div>
              <div><span className="text-white/40">Dernière sync</span><p className="mt-1 text-white">{shopifyStatus.last_sync_at ? new Date(shopifyStatus.last_sync_at).toLocaleString("fr-CA") : "Jamais"}</p></div>
              <div><span className="text-white/40">Produits</span><p className="mt-1 text-white">{shopifyStatus.counts.products}</p></div>
              <div><span className="text-white/40">Clients</span><p className="mt-1 text-white">{shopifyStatus.counts.customers}</p></div>
              <div><span className="text-white/40">Commandes</span><p className="mt-1 text-white">{shopifyStatus.counts.orders}</p></div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition disabled:opacity-50"
            >
              {syncing ? "Synchronisation..." : "Sync maintenant"}
            </button>
          </div>
        )}
      </Card>

      {/* Demo */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-2">Demo Data</h2>
        <p className="text-xs text-white/40 mb-6">
          Charge 6 scénarios de test (marges négatives, coûts manquants, remises…) et calcule automatiquement la profitabilité et les insights.
        </p>

        {demoResult && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20">
            Données chargées — {demoResult.productsSeeded} produits · {demoResult.insightsGenerated} insights
          </div>
        )}

        {demoError && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
            {demoError}
          </div>
        )}

        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="px-4 py-2 rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent/80 transition disabled:opacity-50"
        >
          {loadingDemo ? "Chargement…" : "Load Demo Data"}
        </button>
      </Card>
    </div>
  );
}
