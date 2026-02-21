import { useNavigate } from "react-router-dom";
import { useBusinessContext } from "../../business/BusinessContext";
import { Card } from "../../components/ui/Card";

export default function SettingsPage() {
  const { selectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  if (!selectedBusiness) return <div className="px-6 py-12 text-white/40">Aucun business sélectionné</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Infos business — read-only, les données viennent du BusinessContext */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-6">Informations du business</h2>
        <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
          <div><span className="text-white/40">Nom</span><p className="mt-1 text-white">{selectedBusiness.name}</p></div>
          <div><span className="text-white/40">Type</span><p className="mt-1">{selectedBusiness.business_type ?? "—"}</p></div>
          <div><span className="text-white/40">Ville</span><p className="mt-1">{selectedBusiness.city ?? "—"}</p></div>
          <div><span className="text-white/40">Pays</span><p className="mt-1">{selectedBusiness.country ?? "—"}</p></div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-6">Actions</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Importer des données CSV supplémentaires</p>
              <p className="text-xs text-white/40 mt-1">
                Ajouter de nouvelles transactions depuis un fichier CSV — les données existantes ne sont pas effacées
              </p>
            </div>
            <button
              onClick={() => navigate("/onboarding", { state: { reimport: true, businessId: selectedBusiness.id_business } })}
              className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/15 transition"
            >
              Re-import CSV
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
