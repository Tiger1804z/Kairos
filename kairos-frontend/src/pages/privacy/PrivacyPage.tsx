import { Link } from "react-router-dom";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-10">
    <h2 className="text-base font-semibold text-white">{title}</h2>
    <div className="mt-3 space-y-2 text-sm text-white/60 leading-relaxed">{children}</div>
  </div>
);

const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-yellow-300/80 ring-1 ring-yellow-500/20">
    {children}
  </span>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-2 text-xs font-medium text-accent/70 uppercase tracking-widest">
          Kairos
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Politique de confidentialité
        </h1>

        {/* Beta warning */}
        <div className="mt-6 rounded-xl bg-yellow-500/10 p-4 ring-1 ring-yellow-500/20">
          <p className="text-sm text-yellow-300/90">
            <span className="font-semibold">Version bêta minimale.</span> Les éléments marqués{" "}
            <Placeholder>à confirmer</Placeholder> sont des placeholders provisoires.
          </p>
        </div>

        {/* Sections */}
        <Section title="1. Qui collecte vos données ?">
          <p>
            <Placeholder>Nom légal de l'entreprise — à confirmer avant bêta publique.</Placeholder>
          </p>
        </Section>

        <Section title="2. Quelles données sont collectées ?">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <span className="text-white/80">Compte :</span> adresse courriel, mot de passe (chiffré),
              informations d'authentification.
            </li>
            <li>
              <span className="text-white/80">Business :</span> nom, devise, domaine Shopify.
            </li>
            <li>
              <span className="text-white/80">Données Shopify connectées :</span> produits, coûts,
              inventaire, commandes et ventes lorsque disponibles via l'API Shopify.
            </li>
            <li>
              <span className="text-white/80">Données d'usage :</span> interactions avec le tableau
              de bord, les insights et les fonctionnalités de l'application.
            </li>
          </ul>
        </Section>

        <Section title="3. Pourquoi utilisons-nous ces données ?">
          <ul className="list-disc list-inside space-y-1.5">
            <li>Calcul de la profitabilité et des marges de votre business.</li>
            <li>Génération d'insights, de recommandations et de tableaux de bord.</li>
            <li>Amélioration continue du service.</li>
            <li>Support technique et sécurité.</li>
          </ul>
        </Section>

        <Section title="4. Durée de conservation">
          <p>
            Pendant l'utilisation du service. Après fermeture de compte ou demande de suppression :
            suppression ou anonymisation des données selon la politique interne et les demandes
            applicables. <Placeholder>Durée exacte à définir avant bêta publique.</Placeholder>
          </p>
        </Section>

        <Section title="5. Vos droits">
          <p>
            Vous disposez d'un droit d'accès, de correction, d'export, de retrait du consentement
            et de suppression de vos données personnelles, lorsque applicable.
          </p>
          <p className="mt-2">
            Pour exercer vos droits, contactez :{" "}
            <Placeholder>privacy@exemple.com — à remplacer avant bêta publique.</Placeholder>
          </p>
        </Section>

        <Section title="6. Sous-traitants et fournisseurs techniques">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <span className="text-white/80">Shopify :</span> connexion à votre boutique en ligne
              et accès aux données commerciales.
            </li>
            <li>
              <span className="text-white/80">OpenAI :</span> génération d'insights et de
              recommandations basés sur vos données.
            </li>
            <li>
              <span className="text-white/80">Render :</span> hébergement de l'application.
            </li>
            <li>
              <span className="text-white/80">Neon :</span> base de données.
            </li>
          </ul>
          <p className="mt-3 text-white/40 text-xs">
            D'autres fournisseurs techniques pourraient s'ajouter avant la bêta publique.
          </p>
        </Section>

        <Section title="7. Responsable de la protection des renseignements personnels">
          <p>
            <Placeholder>À confirmer avant bêta publique.</Placeholder>
          </p>
        </Section>

        <Section title="8. Modifications de cette politique">
          <p>
            Cette politique peut être mise à jour. En cas de changement important, les utilisateurs
            seront informés via l'application.
          </p>
        </Section>

        {/* Footer nav */}
        <div className="mt-16 border-t border-white/10 pt-8 flex items-center justify-between text-xs text-white/30">
          <span>© {new Date().getFullYear()} Kairos</span>
          <Link to="/" className="hover:text-white/60 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
