import { useState, useRef } from "react";
import { api } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

// ============================================================================
// Types
// ============================================================================

// un mapping entre une colonne du CSV et un champ Kairos
// kairosField = null signifie que la colonne est ignoree
type ColumnMapping = {
  csvColumn: string;
  kairosField: string | null;
};

// la reponse du backend apres le preview
// IMPORTANT : le backend retourne les lignes sous la cle "preview", pas "rows"
type PreviewResponse = {
  headers: string[];
  preview: Record<string, string>[];  // les 10 premieres lignes du CSV
  mappings: ColumnMapping[];
  totalRows: number;
};

// les champs Kairos valides pour le dropdown de mapping
const KAIROS_FIELDS = [
  { value: "date",             label: "Date" },
  { value: "type",             label: "Type (income/expense)" },
  { value: "amount",           label: "Montant" },
  { value: "category",         label: "Catégorie" },
  { value: "client_name",      label: "Nom client" },
  { value: "description",      label: "Description" },
  { value: "payment_method",   label: "Méthode de paiement" },
  { value: "reference_number", label: "Numéro de référence" },
];

// ============================================================================
// Composant
// ============================================================================

export default function CsvWizardStep({
  businessId,
  onComplete,
  onBack,
}: {
  businessId: number;
  onComplete: (result: any) => void;
  onBack: () => void;
}) {
  // phase interne du wizard : upload → mapping → importing
  const [phase, setPhase] = useState<"upload" | "mapping" | "importing">("upload");

  // le fichier CSV selectionne par le user
  const [file, setFile] = useState<File | null>(null);

  // la reponse du backend apres le preview (headers, premieres lignes, mapping suggere)
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  // le mapping editable par le user (initialise avec la suggestion du backend)
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ref sur l'input file pour ouvrir le file picker en cliquant sur la zone
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // Phase 1 : upload le CSV et recuperer le preview + mapping suggere
  // -------------------------------------------------------------------------
  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      // on envoie le fichier CSV en multipart/form-data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("businessId", String(businessId));

      const res = await api.post("/import/transactions/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // stocker le preview et initialiser le mapping avec la suggestion du backend
      // IMPORTANT : le backend retourne "mappings" (pluriel), pas "mapping"
      setPreview(res.data);
      setMapping(res.data.mappings ?? []);
      setPhase("mapping");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Phase 2 : mettre a jour le mapping quand le user change un dropdown
  // -------------------------------------------------------------------------
  function updateMapping(csvColumn: string, kairosField: string | null) {
    setMapping((prev) =>
      prev.map((m) =>
        m.csvColumn === csvColumn ? { ...m, kairosField } : m
      )
    );
  }

  // -------------------------------------------------------------------------
  // Phase 3 : lancer l'import avec le mapping valide par le user
  // -------------------------------------------------------------------------
  async function handleImport() {
    setPhase("importing");
    setError(null);

    try {
      // le backend executeImport attend un multipart/form-data avec le fichier + les champs
      // on re-envoie le fichier + business_id + mappings (JSON stringify car multipart)
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("business_id", String(businessId));
      formData.append("mappings", JSON.stringify(mapping));

      const res = await api.post("/import/transactions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onComplete(res.data); // passer le resultat au parent (step 3 du wizard parent)
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors de l'import.");
      setPhase("mapping"); // revenir au mapping si ca echoue
    }
  }

  // ============================================================================
  // Rendu : phase upload
  // ============================================================================
  if (phase === "upload") {
    return (
      <Card className="p-8">
        <h2 className="text-xl font-semibold">Importer un fichier CSV</h2>
        <p className="mt-1 text-sm text-white/60">
          Formats acceptes : date, type, montant. Les autres colonnes sont detectees automatiquement.
        </p>

        {/* zone de drop / selection de fichier */}
        <div
          className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 p-12 transition hover:border-white/40"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl">📂</div>
          <div className="mt-3 text-sm text-white/60">
            {file ? file.name : "Cliquez pour sélectionner un fichier CSV"}
          </div>
          {file && (
            <div className="mt-1 text-xs text-white/40">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
          {/* input file cache, declenche par le click sur la zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            onClick={onBack}
            className="flex-1 bg-white/10 text-white hover:bg-white/20"
          >
            ← Retour
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1"
          >
            {loading ? "Analyse en cours..." : "Analyser le fichier →"}
          </Button>
        </div>
      </Card>
    );
  }

  // ============================================================================
  // Rendu : phase importing (loading spinner)
  // ============================================================================
  if (phase === "importing") {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl">⏳</div>
        <h2 className="mt-4 text-xl font-semibold">Import en cours...</h2>
        <p className="mt-2 text-sm text-white/60">
          Vos transactions sont en cours d'importation. Cela peut prendre quelques secondes.
        </p>
      </Card>
    );
  }

  // ============================================================================
  // Rendu : phase mapping (preview + edition du mapping)
  // ============================================================================
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Vérifiez le mapping des colonnes</h2>
        <p className="mt-1 text-sm text-white/60">
          L'IA a suggéré un mapping automatique. Vérifiez et corrigez si nécessaire.
        </p>

        {/* tableau de mapping : colonne CSV -> champ Kairos */}
        <div className="mt-4 space-y-2">
          {mapping.map((m) => (
            <div key={m.csvColumn} className="flex items-center gap-3">
              {/* nom de la colonne dans le CSV */}
              <div className="w-40 truncate rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 ring-1 ring-white/10">
                {m.csvColumn}
              </div>
              <div className="text-white/40">→</div>
              {/* dropdown pour choisir le champ Kairos correspondant */}
              <select
                value={m.kairosField ?? ""}
                onChange={(e) => updateMapping(m.csvColumn, e.target.value || null)}
                className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-white/20"
              >
                <option value="" className="bg-gray-900">-- Ignorer --</option>
                {KAIROS_FIELDS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-gray-900">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Card>

      {/* preview des premieres lignes du CSV */}
      {/* le backend retourne les lignes sous la cle "preview", pas "rows" */}
      {preview && preview.preview.length > 0 && (
        <Card className="p-6">
          <div className="text-sm font-semibold">
            Aperçu ({preview.preview.length} premières lignes)
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs text-white/70">
              <thead>
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left text-white/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row: Record<string, string>, i: number) => (
                  <tr key={i} className="border-t border-white/5">
                    {preview.headers.map((h) => (
                      <td key={h} className="py-1 pr-4">
                        {row[h] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => setPhase("upload")}
          className="flex-1 bg-white/10 text-white hover:bg-white/20"
        >
          ← Changer de fichier
        </Button>
        <Button
          type="button"
          onClick={handleImport}
          className="flex-1"
        >
          Lancer l'import →
        </Button>
      </div>
    </div>
  );
}
