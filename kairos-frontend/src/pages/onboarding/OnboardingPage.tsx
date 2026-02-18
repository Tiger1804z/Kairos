import { useState } from "react";
import BusinessInfoStep from "./BusinessInfoStep";
import CsvWizardStep from "./CsvWizardStep";
import ImportResultStep from "./ImportResultStep";

// ============================================================================
// OnboardingPage - Wizard multi-etapes pour creer un business + importer ses donnees
// ============================================================================
// c'est le "parent" qui controle quelle etape est affichee
// chaque step est un composant independant qui recoit des callbacks (onNext, onComplete, onBack)
// quand un step est fini, il appelle le callback et le parent change d'etape

export default function OnboardingPage() {
  // step = numero de l'etape courante (0 a 2)
  // 0 = creer le business, 1 = wizard CSV, 2 = resultat
  const [step, setStep] = useState(0);

  // l'id du business cree au step 0
  // on en a besoin aux etapes suivantes pour savoir dans quel business importer
  const [businessId, setBusinessId] = useState<number | null>(null);

  // le resultat de l'import (compteurs + erreurs) retourne par le backend
  // on le stocke ici pour l'afficher au step 2 (page resultat)
  const [importResult, setImportResult] = useState<any>(null);

  // labels des 3 etapes pour le progress bar en haut
  const steps = ["Business", "Import", "Résultat"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-white">
      <div className="w-full max-w-2xl">

        {/* progress bar : les 3 cercles numerotes avec les lignes entre chaque */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {/* cercle : blanc si etape completee ou courante, grise sinon */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  i <= step
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {i + 1}
              </div>
              {/* nom de l'etape a cote du cercle */}
              <span
                className={`text-sm ${
                  i <= step ? "text-white" : "text-white/40"
                }`}
              >
                {label}
              </span>
              {/* petite ligne entre les cercles (pas apres le dernier) */}
              {i < 2 && (
                <div
                  className={`h-px w-8 ${
                    i < step ? "bg-white/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* step 0 : formulaire pour creer le business (nom, devise, industrie) */}
        {/* quand le user submit, onNext recoit l'id du business cree par le backend */}
        {step === 0 && (
          <BusinessInfoStep
            onNext={(id: number) => {
              setBusinessId(id); // on garde l'id pour les prochaines etapes
              setStep(1);        // on passe directement au wizard CSV
            }}
          />
        )}

        {/* step 1 : le gros wizard CSV (upload, preview, mapping des colonnes, import) */}
        {/* onBack permet de revenir au step 0 si le user veut changer le nom du business */}
        {step === 1 && (
          <CsvWizardStep
            businessId={businessId!}
            onComplete={(result: any) => {
              setImportResult(result); // sauvegarder le resultat pour le step final
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}

        {/* step 2 : page finale - affiche combien de lignes importees, les erreurs, etc */}
        {/* + bouton pour aller au dashboard */}
        {step === 2 && <ImportResultStep result={importResult} />}
      </div>
    </div>
  );
}
