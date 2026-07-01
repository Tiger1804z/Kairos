import { Link } from "react-router-dom";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-10">
    <h2 className="text-base font-semibold text-white">{title}</h2>
    <div className="mt-3 space-y-2 text-sm text-white/60 leading-relaxed">{children}</div>
  </div>
);

const PRIVACY_EMAIL = "innovai.solutions2026@outlook.com";

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
        <p className="mt-2 text-xs text-white/40">Dernière mise à jour : 1er juillet 2026</p>

        {/* Sections */}
        <Section title="1. Qui collecte vos données ?">
          <p>
            Kairos est une application exploitée par son fondateur, sous le nom de projet
            InnovAI Solutions. Juridiction : Québec, Canada.
          </p>
          <p className="mt-2">
            Pour toute question relative à vos renseignements personnels :{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent hover:underline">
              {PRIVACY_EMAIL}
            </a>
          </p>
        </Section>

        <Section title="2. Quelles données sont collectées ?">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <span className="text-white/80">Compte :</span> prénom et nom, adresse courriel,
              mot de passe (stocké sous forme hashée).
            </li>
            <li>
              <span className="text-white/80">Business :</span> nom du business, devise,
              informations d'intégration Shopify.
            </li>
            <li>
              <span className="text-white/80">Données Shopify connectées :</span> produits,
              variants, commandes, coûts, marges et métriques, lorsque disponibles via l'API
              Shopify.
            </li>
            <li>
              <span className="text-white/80">Conversations avec l'assistant AI :</span> vos
              questions (prompts) et les réponses générées.
            </li>
            <li>
              <span className="text-white/80">Événements de confidentialité :</span> consentements,
              demandes d'export et de suppression.
            </li>
            <li>
              <span className="text-white/80">Logs techniques :</span> journaux d'activité et
              événements liés à la sécurité et au débogage.
            </li>
          </ul>
        </Section>

        <Section title="3. Pourquoi utilisons-nous ces données ?">
          <ul className="list-disc list-inside space-y-1.5">
            <li>Calcul de la profitabilité et des marges de votre business.</li>
            <li>Génération d'insights, de recommandations, de tableaux de bord et de réponses de l'assistant AI.</li>
            <li>Support technique, sécurité et prévention de la fraude.</li>
            <li>Respect de nos obligations légales (preuve de consentement, traitement des demandes).</li>
            <li>Amélioration continue du service.</li>
          </ul>
        </Section>

        <Section title="4. Durée de conservation">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <span className="text-white/80">Compte et business :</span> conservés tant que le
              compte est actif, puis supprimés ou anonymisés sur demande, sauf obligations légales
              ou de sécurité.
            </li>
            <li>
              <span className="text-white/80">Données Shopify synchronisées :</span> conservées
              tant que l'intégration est active ou jusqu'à demande de suppression.
            </li>
            <li>
              <span className="text-white/80">Tokens d'accès Shopify :</span> conservés tant que
              l'intégration est active, chiffrés au repos, supprimés à la déconnexion ou sur
              demande de suppression.
            </li>
            <li>
              <span className="text-white/80">Conversations AI :</span> conservées tant que le
              compte est actif (historique, support, amélioration du service), supprimables sur
              demande.
            </li>
            <li>
              <span className="text-white/80">Logs techniques :</span> conservés pour une durée
              limitée, sauf nécessité liée à la sécurité ou au débogage.
            </li>
            <li>
              <span className="text-white/80">Événements de consentement et demandes privacy :</span>{" "}
              conservés jusqu'à 7 ans comme preuve de consentement et de traitement des demandes.
            </li>
          </ul>
        </Section>

        <Section title="5. Vos droits">
          <p>
            Vous disposez d'un droit d'accès, de correction, d'export, de retrait du consentement
            et de suppression de vos données personnelles, lorsque applicable.
          </p>
          <p className="mt-2">
            Pendant la phase bêta, les demandes d'export et de suppression sont enregistrées puis
            traitées manuellement par notre équipe — aucune suppression automatique n'est
            effectuée. Nous traiterons les demandes dans un délai raisonnable, conformément aux
            obligations applicables.
          </p>
          <p className="mt-2">
            Sur demande de suppression, nous supprimons ou anonymisons votre compte, votre
            business, vos tokens Shopify, les données Shopify synchronisées, vos conversations AI
            et les données opérationnelles associées. Certains événements de confidentialité,
            demandes, journaux de sécurité ou informations minimales peuvent être conservés si
            nécessaire pour nos obligations légales, la preuve de consentement ou de traitement,
            la sécurité ou la prévention de la fraude.
          </p>
          <p className="mt-2">
            Pour exercer vos droits, contactez :{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent hover:underline">
              {PRIVACY_EMAIL}
            </a>
          </p>
        </Section>

        <Section title="6. Sous-traitants et fournisseurs techniques">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <span className="text-white/80">Shopify :</span> connexion à votre boutique en ligne
              et accès aux données commerciales.
            </li>
            <li>
              <span className="text-white/80">OpenAI :</span> génération d'insights, de
              recommandations et de réponses de l'assistant AI basés sur vos données.
            </li>
            <li>
              <span className="text-white/80">Render :</span> hébergement du backend de
              l'application.
            </li>
            <li>
              <span className="text-white/80">Vercel :</span> hébergement de l'interface web.
            </li>
            <li>
              <span className="text-white/80">Neon :</span> base de données PostgreSQL.
            </li>
            <li>
              <span className="text-white/80">GitHub :</span> hébergement du code source (aucune
              donnée marchande).
            </li>
          </ul>
        </Section>

        <Section title="7. Transferts hors Québec">
          <p>
            Certains de nos fournisseurs peuvent traiter ou héberger des données à l'extérieur du
            Québec et/ou du Canada, notamment aux États-Unis ou dans d'autres régions, selon leur
            infrastructure.
          </p>
        </Section>

        <Section title="8. Responsable de la protection des renseignements personnels">
          <p>
            Sébastien Yves Robert Eugène —{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent hover:underline">
              {PRIVACY_EMAIL}
            </a>{" "}
            (Québec, Canada).
          </p>
        </Section>

        <Section title="9. Modifications de cette politique">
          <p>
            Nous pouvons mettre à jour cette politique de temps à autre. En cas de changement
            important, nous aviserons les utilisateurs par un moyen approprié.
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
