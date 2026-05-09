import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { Card } from "../../components/ui/Card";
import { getShopifyStatus, connectShopify, triggerShopifySync } from "../../services/shopifyService";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n/useI18n";

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
  const { language, t } = useI18n();
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
    if (!shopDomain.trim() || !selectedBusiness) return;
    setConnecting(true);
    const data = await connectShopify(shopDomain.trim(), selectedBusiness.id_business);
    setConnecting(false);
    if (data.authUrl) {
      window.location.href = data.authUrl;
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
      setDemoError(err?.response?.data?.error || err?.message || t("dashboard.demo.load"));
    } finally {
      setLoadingDemo(false);
    }
  }

  if (!selectedBusiness) return <div className="px-6 py-12 text-white/40">{t("settings.noBusiness")}</div>;

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 overflow-x-hidden py-4 sm:py-8">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      {/* Infos business */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-6">{t("settings.businessInfo")}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
          <div><span className="text-white/40">{t("settings.name")}</span><p className="mt-1 text-white">{selectedBusiness.name}</p></div>
          <div><span className="text-white/40">{t("settings.type")}</span><p className="mt-1">{selectedBusiness.business_type ?? "—"}</p></div>
          <div><span className="text-white/40">{t("settings.city")}</span><p className="mt-1">{selectedBusiness.city ?? "—"}</p></div>
          <div><span className="text-white/40">{t("settings.country")}</span><p className="mt-1">{selectedBusiness.country ?? "—"}</p></div>
        </div>
      </Card>

      {/* Shopify */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-6">{t("settings.shopifyIntegration")}</h2>

        {justConnected && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
            {t("settings.connectedSuccess")}
          </div>
        )}

        {shopifyStatus === null && (
          <p className="text-sm text-white/40">{t("common.loading")}</p>
        )}

        {shopifyStatus?.connected === false && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">{t("settings.connectText")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder={t("settings.shopPlaceholder")}
                className="min-w-0 flex-1 px-4 py-2 rounded-lg bg-white/10 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30"
              />
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 rounded-lg bg-accent text-sm text-white hover:bg-accent-hover transition disabled:opacity-50"
              >
                {connecting ? t("settings.redirecting") : t("settings.connect")}
              </button>
            </div>
          </div>
        )}

        {shopifyStatus?.connected === true && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
              <div><span className="text-white/40">{t("settings.store")}</span><p className="mt-1 text-white">{shopifyStatus.shop_domain}</p></div>
              <div><span className="text-white/40">{t("settings.lastSync")}</span><p className="mt-1 text-white">{shopifyStatus.last_sync_at ? new Date(shopifyStatus.last_sync_at).toLocaleString(language === "fr" ? "fr-CA" : "en-CA") : t("settings.never")}</p></div>
              <div><span className="text-white/40">{t("settings.products")}</span><p className="mt-1 text-white">{shopifyStatus.counts.products}</p></div>
              <div><span className="text-white/40">{t("settings.customers")}</span><p className="mt-1 text-white">{shopifyStatus.counts.customers}</p></div>
              <div><span className="text-white/40">{t("settings.orders")}</span><p className="mt-1 text-white">{shopifyStatus.counts.orders}</p></div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition disabled:opacity-50"
            >
              {syncing ? t("settings.syncing") : t("settings.syncNow")}
            </button>
          </div>
        )}
      </Card>

      {/* Demo */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-2">{t("settings.demoData")}</h2>
        <p className="text-xs text-white/40 mb-6">
          {t("settings.demoDescription")}
        </p>

        {demoResult && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20">
            {t("settings.demoLoaded", { products: demoResult.productsSeeded, insights: demoResult.insightsGenerated })}
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
          {loadingDemo ? t("dashboard.demo.loading") : t("dashboard.demo.load")}
        </button>
      </Card>
    </div>
  );
}
