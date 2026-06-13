#!/usr/bin/env python3
"""
Import des tickets Kairos Phase 1 → GitHub Issues + GitHub Project #2

Usage:
  python scripts/import_kairos_phase1_tickets.py --dry-run --sprint 0
  python scripts/import_kairos_phase1_tickets.py --sprint 0
  python scripts/import_kairos_phase1_tickets.py --sprint 1
  python scripts/import_kairos_phase1_tickets.py --all

Garanties:
  - Idempotent : détecte les [Sx-Txx] déjà existants, ne duplique jamais
  - Token jamais loggé ni hardcodé
  - GraphQL user-owned project (pas organization)
  - Mode --dry-run obligatoire pour tester avant import réel
"""

import argparse
import getpass
import os
import re
import sys
import time

# Force UTF-8 output on Windows (emoji support)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import requests

# ══════════════════════════════════════════════════════════════════════════════
# DEFAULTS (overridable via CLI args)
# ══════════════════════════════════════════════════════════════════════════════
DEFAULT_OWNER       = "Tiger1804z"
DEFAULT_REPO        = "Kairos"
DEFAULT_PROJECT_NUM = 2
GQL_URL             = "https://api.github.com/graphql"
SLEEP_SEC           = 1.5   # pause entre créations (rate-limit ~30 req/min)

# ── Terminal colors ───────────────────────────────────────────────────────────
OK   = "\033[92m✅\033[0m"
SKIP = "\033[93m⏭️ \033[0m"
DRY  = "\033[96m🔵\033[0m"
ERR  = "\033[91m❌\033[0m"
INF  = "\033[94m⏳\033[0m"
WARN = "\033[93m⚠️ \033[0m"

# ══════════════════════════════════════════════════════════════════════════════
# SPRINT FILE MAPPING
# ══════════════════════════════════════════════════════════════════════════════
TICKETS_DIR = Path(__file__).parent.parent / "docs" / "business-intelligence" / "tickets"

SPRINT_FILES = {
    0: "SPRINT_0_SECURITY_LEGAL_TICKETS.md",
    1: "SPRINT_1_DATA_MOAT_TICKETS.md",
    2: "SPRINT_2_JOBS_PIPELINE_TICKETS.md",
    3: "SPRINT_3_PROFIT_ENGINE_TICKETS.md",
    4: "SPRINT_4_PRODUCT_CONFIDENCE_TICKETS.md",
    5: "SPRINT_5_BETA_INTELLIGENCE_TICKETS.md",
    6: "SPRINT_6_AI_PYTHON_HARDENING_TICKETS.md",
    7: "SPRINT_7_BETA_POLISH_TICKETS.md",
}

# ══════════════════════════════════════════════════════════════════════════════
# LABELS
# ══════════════════════════════════════════════════════════════════════════════
LABELS = [
    {"name": "priority:P0",              "color": "b60205", "description": "Critique — bloque tout"},
    {"name": "priority:P1",              "color": "e4480b", "description": "Urgent — fondation"},
    {"name": "priority:P2",              "color": "e4b429", "description": "Important — qualité"},
    {"name": "gate:A-security-legal",    "color": "d73a4a", "description": "Gate A — Security / Legal"},
    {"name": "gate:B-product-experience","color": "6e5494", "description": "Gate B — Product Experience"},
    {"name": "area:security",            "color": "c5221f", "description": "Sécurité"},
    {"name": "area:compliance",          "color": "5319e7", "description": "Conformité légale (Loi 25)"},
    {"name": "area:data",                "color": "006b75", "description": "Data / tables / migrations"},
    {"name": "area:backend",             "color": "0052cc", "description": "Backend Node/TypeScript"},
    {"name": "area:frontend",            "color": "7057ff", "description": "Frontend React"},
    {"name": "area:ai",                  "color": "0e8a16", "description": "IA / LLM / Python engine"},
    {"name": "area:jobs",                "color": "cfd3d7", "description": "Crons / jobs scheduler"},
    {"name": "area:legacy-cleanup",      "color": "bfd4f2", "description": "Nettoyage routes/pages legacy"},
    {"name": "area:shopify",             "color": "95d23d", "description": "Intégration Shopify"},
    {"name": "area:testing",             "color": "28a745", "description": "Tests"},
    {"name": "type:feature",             "color": "1d76db", "description": "Nouvelle fonctionnalité"},
    {"name": "type:bug",                 "color": "d73a4a", "description": "Correction de bug"},
    {"name": "type:refactor",            "color": "e4e669", "description": "Refactoring"},
    {"name": "type:docs",                "color": "c2e0c6", "description": "Documentation"},
    {"name": "type:test",                "color": "0e8a16", "description": "Tests / QA"},
    {"name": "risk:critical",            "color": "b60205", "description": "Risque critique"},
    {"name": "risk:high",                "color": "e4480b", "description": "Risque élevé"},
    {"name": "risk:medium",              "color": "e4b429", "description": "Risque moyen"},
    {"name": "risk:low",                 "color": "0e8a16", "description": "Risque faible"},
    {"name": "status:blocked",           "color": "5319e7", "description": "Bloqué par dépendance"},
]

# ══════════════════════════════════════════════════════════════════════════════
# MILESTONES
# ══════════════════════════════════════════════════════════════════════════════
MILESTONES = [
    "Sprint 0 — Gate A Security / Legal",
    "Sprint 1 — Data Moat Foundation",
    "Sprint 2 — Jobs & Snapshot Pipeline",
    "Sprint 3 — Profit Engine v1.5",
    "Sprint 4 — Product Scores & Confidence",
    "Sprint 5 — Beta Intelligence Layer",
    "Sprint 6 — AI / Python Hardening",
    "Sprint 7 — Beta Polish & Readiness",
]

# ══════════════════════════════════════════════════════════════════════════════
# LABEL MAPPING (from ticket metadata → GitHub label names)
# ══════════════════════════════════════════════════════════════════════════════
PRIORITY_MAP = {
    "p0": "priority:P0",
    "p1": "priority:P1",
    "p2": "priority:P2",
}

GATE_MAP = {
    "gate a": "gate:A-security-legal",
    "a":      "gate:A-security-legal",
    "gate b": "gate:B-product-experience",
    "b":      "gate:B-product-experience",
}

TYPE_MAP = {
    "feature":  "type:feature",
    "bug":      "type:bug",
    "refactor": "type:refactor",
    "docs":     "type:docs",
    "test":     "type:test",
}

RISK_MAP = {
    "critical": "risk:critical",
    "high":     "risk:high",
    "medium":   "risk:medium",
    "low":      "risk:low",
}

AREA_MAP = {
    "security":      "area:security",
    "compliance":    "area:compliance",
    "data":          "area:data",
    "backend":       "area:backend",
    "frontend":      "area:frontend",
    "ai":            "area:ai",
    "jobs":          "area:jobs",
    "legacy-cleanup":"area:legacy-cleanup",
    "shopify":       "area:shopify",
    "testing":       "area:testing",
}

# ══════════════════════════════════════════════════════════════════════════════
# TICKET DATACLASS
# ══════════════════════════════════════════════════════════════════════════════
@dataclass
class Ticket:
    ticket_id:  str               # e.g. "S0-T01"
    title:      str               # e.g. "Créer helper crypto AES-256-GCM pour tokens Shopify"
    milestone:  str               # e.g. "Sprint 0 — Gate A Security / Legal"
    priority:   str               # e.g. "P0"
    gate:       str               # e.g. "Gate A"
    type_:      str               # e.g. "feature"
    areas:      list[str]         # e.g. ["security", "backend"]
    risk:       str               # e.g. "critical"
    estimate:   str               # e.g. "S"
    body:       str               # full Markdown body (from ### Contexte onward)
    labels:     list[str] = field(default_factory=list)  # resolved GitHub label names

    @property
    def github_title(self) -> str:
        return f"[{self.ticket_id}] {self.title}"


# ══════════════════════════════════════════════════════════════════════════════
# PARSING
# ══════════════════════════════════════════════════════════════════════════════
TICKET_HEADER_RE = re.compile(
    r"^## (S\d+-T\d+[a-z]?) — (.+)$",
    re.MULTILINE
)

FIELD_RE = re.compile(
    r"^\*\*(?P<key>[^*:]+):\*\*\s*(?P<value>.+)$",
    re.MULTILINE
)


def _extract_field(text: str, key: str) -> str:
    """Extract a **Key:** value from a ticket block."""
    for m in FIELD_RE.finditer(text):
        if m.group("key").strip().lower() == key.lower():
            return m.group("value").strip()
    return ""


def _resolve_labels(ticket_id: str, priority: str, gate: str,
                    type_: str, areas: list[str], risk: str) -> list[str]:
    labels: list[str] = []

    p = PRIORITY_MAP.get(priority.lower())
    if p:
        labels.append(p)

    g = GATE_MAP.get(gate.strip().lower())
    if g:
        labels.append(g)

    t = TYPE_MAP.get(type_.strip().lower())
    if t:
        labels.append(t)

    r = RISK_MAP.get(risk.strip().lower())
    if r:
        labels.append(r)

    for area in areas:
        a = AREA_MAP.get(area.strip().lower())
        if a:
            labels.append(a)

    return labels


def parse_ticket_file(path: Path) -> list[Ticket]:
    """Parse a sprint Markdown file and return a list of Ticket objects."""
    content = path.read_text(encoding="utf-8")
    tickets: list[Ticket] = []

    matches = list(TICKET_HEADER_RE.finditer(content))
    if not matches:
        return tickets

    for idx, m in enumerate(matches):
        ticket_id = m.group(1)   # e.g. S0-T01
        title     = m.group(2).strip()

        # Block = everything from this header to next header (or EOF)
        start = m.start()
        end   = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
        block = content[start:end]

        milestone = _extract_field(block, "Milestone")
        priority  = _extract_field(block, "Priority")
        gate      = _extract_field(block, "Gate")
        type_     = _extract_field(block, "Type")
        area_raw  = _extract_field(block, "Area")
        risk      = _extract_field(block, "Risk")
        estimate  = _extract_field(block, "Estimate")

        areas = [a.strip() for a in area_raw.split(",") if a.strip()]

        # Body: from first ### heading onward
        body_match = re.search(r"^### ", block, re.MULTILINE)
        body = block[body_match.start():].rstrip() if body_match else ""

        label_list = _resolve_labels(ticket_id, priority, gate, type_, areas, risk)

        tickets.append(Ticket(
            ticket_id=ticket_id,
            title=title,
            milestone=milestone,
            priority=priority,
            gate=gate,
            type_=type_,
            areas=areas,
            risk=risk,
            estimate=estimate,
            body=body,
            labels=label_list,
        ))

    return tickets


def extract_ticket_id(github_title: str) -> Optional[str]:
    """Extract 'S0-T01' from '[S0-T01] Some title'."""
    m = re.search(r"\[(S\d+-T\d+[a-z]?)\]", github_title, re.IGNORECASE)
    return m.group(1).upper() if m else None


# ══════════════════════════════════════════════════════════════════════════════
# GITHUB REST API HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _rest(method: str, url: str, headers: dict, **kwargs) -> requests.Response:
    r = requests.request(method, url, headers=headers, **kwargs)
    return r


def create_or_get_labels(owner: str, repo: str, headers: dict, dry_run: bool):
    print("\n📌 Labels")
    r = _rest("GET", f"https://api.github.com/repos/{owner}/{repo}/labels",
              headers=headers, params={"per_page": 100})
    existing = {lb["name"] for lb in r.json()}

    for lb in LABELS:
        if lb["name"] in existing:
            print(f"   {SKIP} '{lb['name']}' existe déjà")
        elif dry_run:
            print(f"   {DRY} [dry-run] créerait label '{lb['name']}'")
        else:
            r2 = _rest("POST", f"https://api.github.com/repos/{owner}/{repo}/labels",
                       headers=headers, json=lb)
            if r2.status_code == 201:
                print(f"   {OK} Label '{lb['name']}' créé")
            else:
                print(f"   {ERR} Label '{lb['name']}': {r2.json().get('message')}")
            time.sleep(0.3)


def create_or_get_milestones(owner: str, repo: str, headers: dict,
                              dry_run: bool) -> dict[str, int]:
    print("\n🏁 Milestones")
    r = _rest("GET", f"https://api.github.com/repos/{owner}/{repo}/milestones",
              headers=headers, params={"per_page": 100, "state": "open"})
    existing: dict[str, int] = {m["title"]: m["number"] for m in r.json()}

    for ms in MILESTONES:
        if ms in existing:
            print(f"   {SKIP} '{ms}' existe déjà")
        elif dry_run:
            print(f"   {DRY} [dry-run] créerait milestone '{ms}'")
        else:
            r2 = _rest("POST", f"https://api.github.com/repos/{owner}/{repo}/milestones",
                       headers=headers, json={"title": ms})
            if r2.status_code == 201:
                existing[ms] = r2.json()["number"]
                print(f"   {OK} Milestone '{ms}' créée")
            else:
                print(f"   {ERR} Milestone '{ms}': {r2.json().get('message')}")
            time.sleep(0.3)

    return existing


def fetch_existing_issue_ids(owner: str, repo: str, headers: dict) -> set[str]:
    """Return set of ticket IDs (e.g. 'S0-T01') already present as issues."""
    ids: set[str] = set()
    page = 1
    while True:
        r = _rest("GET", f"https://api.github.com/repos/{owner}/{repo}/issues",
                  headers=headers,
                  params={"state": "all", "per_page": 100, "page": page})
        batch = r.json()
        if not batch or not isinstance(batch, list):
            break
        for issue in batch:
            tid = extract_ticket_id(issue.get("title", ""))
            if tid:
                ids.add(tid.upper())
        if len(batch) < 100:
            break
        page += 1
    return ids


def create_issue(owner: str, repo: str, headers: dict,
                 ticket: Ticket, milestone_map: dict[str, int]) -> Optional[dict]:
    payload: dict = {
        "title":  ticket.github_title,
        "body":   ticket.body,
        "labels": ticket.labels,
    }
    ms_num = milestone_map.get(ticket.milestone)
    if ms_num:
        payload["milestone"] = ms_num

    r = _rest("POST", f"https://api.github.com/repos/{owner}/{repo}/issues",
              headers=headers, json=payload)
    if r.status_code == 201:
        return r.json()
    print(f"   {ERR} Création issue : {r.json().get('message')}")
    return None


# ══════════════════════════════════════════════════════════════════════════════
# GITHUB GRAPHQL — USER-OWNED PROJECT V2
# ══════════════════════════════════════════════════════════════════════════════

def _gql(token: str, query: str, variables: dict = None) -> dict:
    payload: dict = {"query": query}
    if variables:
        payload["variables"] = variables
    r = requests.post(
        GQL_URL,
        json=payload,
        headers={
            "Authorization": f"bearer {token}",
            "Content-Type": "application/json",
        },
    )
    data = r.json()
    if "errors" in data:
        raise RuntimeError(data["errors"][0]["message"])
    return data["data"]


def get_user_project_meta(token: str, owner: str, project_num: int) -> dict:
    """
    Fetch user-owned project metadata.
    Returns {"id": ..., "status_field_id": ..., "backlog_option_id": ...}
    """
    query = """
    query($login: String!, $num: Int!) {
      user(login: $login) {
        projectV2(number: $num) {
          id
          fields(first: 50) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }"""
    data = _gql(token, query, {"login": owner, "num": project_num})
    proj = data["user"]["projectV2"]
    project_id       = proj["id"]
    status_field_id  = None
    backlog_option_id = None

    for f in proj["fields"]["nodes"]:
        if not f:
            continue
        if f.get("name", "").lower() == "status":
            status_field_id = f["id"]
            for opt in f.get("options", []):
                if opt["name"].lower() == "backlog":
                    backlog_option_id = opt["id"]
                    break
            break

    return {
        "id":               project_id,
        "status_field_id":  status_field_id,
        "backlog_option_id": backlog_option_id,
    }


def add_issue_to_project(token: str, project_id: str, issue_node_id: str) -> str:
    """Add issue to project. Return item_id."""
    mutation = """
    mutation($pid: ID!, $cid: ID!) {
      addProjectV2ItemById(input: {projectId: $pid, contentId: $cid}) {
        item { id }
      }
    }"""
    data = _gql(token, mutation, {"pid": project_id, "cid": issue_node_id})
    return data["addProjectV2ItemById"]["item"]["id"]


def set_project_status_backlog(token: str, project_id: str, item_id: str,
                                field_id: str, option_id: str):
    """Set Status = Backlog on a project item."""
    mutation = """
    mutation($pid: ID!, $iid: ID!, $fid: ID!, $oid: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $pid
        itemId:    $iid
        fieldId:   $fid
        value:     { singleSelectOptionId: $oid }
      }) { projectV2Item { id } }
    }"""
    _gql(token, mutation, {
        "pid": project_id,
        "iid": item_id,
        "fid": field_id,
        "oid": option_id,
    })


# ══════════════════════════════════════════════════════════════════════════════
# PHASES
# ══════════════════════════════════════════════════════════════════════════════

def phase_issues(token: str, headers: dict, tickets: list[Ticket],
                 milestone_map: dict[str, int], project_meta: dict,
                 owner: str, repo: str, dry_run: bool) -> tuple[int, int, int]:
    print(f"\n📝 Issues ({len(tickets)} tickets détectés)")

    print(f"   {INF} Scan des issues existantes...", end=" ", flush=True)
    existing_ids = fetch_existing_issue_ids(owner, repo, headers)
    print(f"{len(existing_ids)} identifiant(s) [Sx-Txx] déjà dans le repo")

    created = skipped = failed = 0

    for i, ticket in enumerate(tickets, 1):
        prefix = f"   [{i:02d}/{len(tickets)}]"
        tid_upper = ticket.ticket_id.upper()

        if tid_upper in existing_ids:
            print(f"{prefix} {SKIP} {ticket.ticket_id} déjà présent — ignoré")
            skipped += 1
            continue

        if dry_run:
            print(f"{prefix} {DRY} [{ticket.ticket_id}] {ticket.title[:55]}")
            print(f"          milestone : {ticket.milestone!r}")
            print(f"          labels    : {ticket.labels}")
            created += 1
            continue

        issue_data = create_issue(owner, repo, headers, ticket, milestone_map)
        if not issue_data:
            failed += 1
            time.sleep(SLEEP_SEC)
            continue

        node_id   = issue_data["node_id"]
        issue_url = issue_data["html_url"]

        try:
            item_id = add_issue_to_project(token, project_meta["id"], node_id)
            status_note = ""

            if project_meta["status_field_id"] and project_meta["backlog_option_id"]:
                try:
                    set_project_status_backlog(
                        token,
                        project_meta["id"],
                        item_id,
                        project_meta["status_field_id"],
                        project_meta["backlog_option_id"],
                    )
                    status_note = " · statut → Backlog"
                except Exception as e:
                    status_note = f" · {WARN}statut non défini ({e})"
            else:
                status_note = f" · {WARN}champ 'Status/Backlog' introuvable"

            print(f"{prefix} {OK} {ticket.ticket_id} créée + projet{status_note}")
            print(f"          {issue_url}")
            created += 1

        except Exception as e:
            print(f"{prefix} {WARN} Issue créée mais erreur projet: {e}")
            print(f"          {issue_url}")
            created += 1

        time.sleep(SLEEP_SEC)

    return created, skipped, failed


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def parse_args():
    p = argparse.ArgumentParser(
        description="Import tickets Kairos Phase 1 → GitHub Issues + Project #2"
    )
    p.add_argument("--dry-run", action="store_true",
                   help="Simule sans rien créer ni modifier")
    p.add_argument("--sprint", type=int, default=None,
                   help="Importer seulement ce sprint (0-7)")
    p.add_argument("--all", action="store_true",
                   help="Importer tous les sprints (0-7)")
    p.add_argument("--token", default=None,
                   help="Personal Access Token GitHub (sinon env GITHUB_TOKEN/GH_TOKEN ou prompt)")
    p.add_argument("--owner", default=DEFAULT_OWNER,
                   help=f"GitHub owner (défaut: {DEFAULT_OWNER})")
    p.add_argument("--repo", default=DEFAULT_REPO,
                   help=f"GitHub repo (défaut: {DEFAULT_REPO})")
    p.add_argument("--project-number", type=int, default=DEFAULT_PROJECT_NUM,
                   help=f"GitHub Project number (défaut: {DEFAULT_PROJECT_NUM})")
    return p.parse_args()


def resolve_token(args_token: Optional[str]) -> str:
    """
    Token resolution order:
    1. --token argument
    2. GITHUB_TOKEN env var
    3. GH_TOKEN env var
    4. Interactive prompt (masked)
    """
    if args_token:
        return args_token
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        return token
    return getpass.getpass("Token GitHub (ghp_...) : ")


def collect_tickets(sprint: Optional[int], import_all: bool) -> list[Ticket]:
    """Load and parse the appropriate sprint file(s)."""
    if import_all:
        sprint_keys = sorted(SPRINT_FILES.keys())
    elif sprint is not None:
        if sprint not in SPRINT_FILES:
            print(f"{ERR} Sprint {sprint} inconnu. Sprints valides : {sorted(SPRINT_FILES.keys())}")
            sys.exit(1)
        sprint_keys = [sprint]
    else:
        print(f"{ERR} Spécifier --sprint N ou --all")
        sys.exit(1)

    all_tickets: list[Ticket] = []
    for k in sprint_keys:
        path = TICKETS_DIR / SPRINT_FILES[k]
        if not path.exists():
            print(f"{WARN} Fichier introuvable : {path}")
            continue
        tickets = parse_ticket_file(path)
        print(f"   {INF} Sprint {k} : {len(tickets)} tickets parsés depuis {path.name}")
        all_tickets.extend(tickets)

    return all_tickets


def main():
    args = parse_args()

    if args.sprint is None and not args.all:
        print(f"{ERR} Aucun sprint sélectionné. Utiliser --sprint N ou --all")
        print("Exemples :")
        print("  python scripts/import_kairos_phase1_tickets.py --dry-run --sprint 0")
        print("  python scripts/import_kairos_phase1_tickets.py --sprint 0")
        print("  python scripts/import_kairos_phase1_tickets.py --all")
        sys.exit(1)

    dry_run     = args.dry_run
    owner       = args.owner
    repo        = args.repo
    project_num = args.project_number

    mode_label = "🔵 DRY-RUN — aucune écriture" if dry_run else "🚀 IMPORT RÉEL"
    sprint_label = f"sprint {args.sprint}" if args.sprint is not None else "tous les sprints"
    print(f"\n{mode_label}")
    print(f"   Owner / Repo     : {owner}/{repo}")
    print(f"   Project          : #{project_num} (user-owned)")
    print(f"   Scope            : {sprint_label}")
    print("=" * 64)

    # ── Parse tickets BEFORE asking for token (no network needed) ────────────
    print()
    tickets = collect_tickets(args.sprint, args.all)
    if not tickets:
        print(f"{WARN} Aucun ticket trouvé. Vérifier les fichiers sources.")
        sys.exit(0)
    print(f"\n   Total : {len(tickets)} tickets détectés")
    print("=" * 64)

    # ── Token ────────────────────────────────────────────────────────────────
    token = resolve_token(args.token)

    headers = {
        "Authorization": f"token {token}",
        "Accept":        "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # ── Auth check ───────────────────────────────────────────────────────────
    me = requests.get("https://api.github.com/user", headers=headers)
    if me.status_code != 200:
        print(f"{ERR} Token invalide ou expiré.")
        sys.exit(1)
    print(f"\n{OK} Connecté : {me.json()['login']}")

    # ── Project metadata ─────────────────────────────────────────────────────
    if not dry_run:
        print(f"{INF} Récupération du projet #{project_num}...")
        try:
            project_meta = get_user_project_meta(token, owner, project_num)
        except RuntimeError as e:
            print(f"{ERR} Impossible d'accéder au projet : {e}")
            sys.exit(1)
        print(f"{OK} Projet ID : {project_meta['id']}")
        if project_meta["backlog_option_id"]:
            print(f"{OK} Champ 'Status' trouvé — option 'Backlog' disponible")
        else:
            print(f"{WARN} Option 'Backlog' introuvable — items ajoutés sans statut")
    else:
        project_meta = {"id": "DRY-RUN", "status_field_id": None, "backlog_option_id": None}
        print(f"{DRY} [dry-run] Projet #{project_num} — méta non chargée")

    # ── Labels ───────────────────────────────────────────────────────────────
    create_or_get_labels(owner, repo, headers, dry_run)

    # ── Milestones ───────────────────────────────────────────────────────────
    milestone_map = create_or_get_milestones(owner, repo, headers, dry_run)

    # ── Issues ───────────────────────────────────────────────────────────────
    created, skipped, failed = phase_issues(
        token, headers, tickets, milestone_map, project_meta,
        owner, repo, dry_run
    )

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 64)
    if dry_run:
        print(f"🔵 Dry-run terminé — {created} seraient créées, "
              f"{skipped} ignorées (déjà présentes), {failed} erreurs")
    else:
        print(f"✅ Terminé — {created} créées, {skipped} ignorées, {failed} erreurs")
        print(f"👉 https://github.com/users/{owner}/projects/{project_num}")


if __name__ == "__main__":
    main()
