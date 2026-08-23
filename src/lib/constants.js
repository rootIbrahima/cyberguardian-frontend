export const ASSET_TYPES = [
  { key: 'domain', label: 'Domaine', placeholder: 'ex: ec2lt.sn' },
  { key: 'ip',     label: 'Adresse IP', placeholder: 'ex: 196.1.95.1' },
  // Le chemin de l'URL est transmis au contrôle des en-têtes, qui peut donner
  // un résultat différent de la racine lorsque l'application les règle par
  // page. Les autres contrôles portent sur l'hôte : un certificat, des ports
  // ou un enregistrement DNS ne dépendent pas de la page demandée.
  { key: 'url',    label: 'URL', placeholder: 'ex: https://orange.sn/espace-client' },
  { key: 'github', label: 'GitHub', placeholder: 'ex: github.com/user/repo' },
]

/* Outils MCP, groupes : easm | github | score | report */
export const MCP_TOOLS = [
  // EASM (domaine / IP / URL)
  { name: 'check_ssl()',        label: 'SSL/TLS : certificat, grade, protocoles acceptés',   types: ['domain', 'url', 'ip'], group: 'easm'   },
  { name: 'check_dns()',        label: 'DNS : SPF, DMARC, DKIM, MX, enregistrements',        types: ['domain', 'url'],       group: 'easm'   },
  { name: 'check_whois()',      label: 'WHOIS : registrar, expiration du domaine',            types: ['domain'],              group: 'easm'   },
  { name: 'scan_headers()',     label: 'En-têtes HTTP : HSTS, CSP, X-Frame-Options',         types: ['domain', 'url'],       group: 'easm'   },
  { name: 'scan_ports()',       label: 'Ports ouverts : services exposés sur internet',       types: ['domain', 'url', 'ip'], group: 'easm'   },
  { name: 'scan_virustotal()',  label: 'Réputation : VirusTotal, listes noires',              types: ['domain', 'url', 'ip'], group: 'easm'   },
  { name: 'check_subdomains()', label: 'Sous-domaines : journaux de transparence des certificats', types: ['domain', 'url'],   group: 'easm'   },

  // GitHub
  { name: 'github_info()',      label: 'Métadonnées : visibilité, branches, contributeurs',  types: ['github'],              group: 'github' },
  { name: 'scan_bandit()',      label: 'Bandit : vulnérabilités statiques Python',            types: ['github'],              group: 'github' },
  { name: 'scan_safety()',      label: 'Safety : dépendances avec CVE connues',               types: ['github'],              group: 'github' },
  { name: 'scan_trufflehog()',  label: 'TruffleHog : secrets et tokens exposés',              types: ['github'],              group: 'github' },

  // Score & rapport
  { name: 'calculate_score()', label: 'Score de sécurité pondéré /100',                      types: ['domain', 'url', 'ip', 'github'], group: 'score'  },
  { name: 'generate_report()', label: 'Rapport PDF : synthèse et recommandations',            types: ['domain', 'url', 'ip', 'github'], group: 'report' },
]

export const MOCK_SCANS = [
  { id: 1, target: 'ec2lt.sn',            type: 'domain', score: 50,   status: 'completed', date: '18 avr. 2026, 09:12', vulns: 8,    cve: 2,    typeLabel: 'Domaine' },
  { id: 2, target: 'orange.sn',           type: 'domain', score: 82,   status: 'completed', date: '17 avr. 2026, 14:33', vulns: 4,    cve: 1,    typeLabel: 'Domaine' },
  { id: 3, target: '196.1.95.1',          type: 'ip',     score: 68,   status: 'completed', date: '17 avr. 2026, 11:05', vulns: 2,    cve: 0,    typeLabel: 'IP' },
  { id: 4, target: 'github.com/ibraly/api', type: 'github', score: null, status: 'running',   date: '18 avr. 2026, 10:41', vulns: null, cve: null, typeLabel: 'GitHub' },
  { id: 5, target: 'wavedigital.sn',      type: 'domain', score: 35,   status: 'critical',  date: '16 avr. 2026, 08:20', vulns: 14,   cve: 5,    typeLabel: 'Domaine' },
  { id: 6, target: 'lonase.sn',           type: 'domain', score: 91,   status: 'completed', date: '15 avr. 2026, 16:50', vulns: 1,    cve: 0,    typeLabel: 'Domaine' },
]

export const MOCK_EXPERTS = [
  { id: 1, name: 'Mamadou Diallo',  specialty: 'DNS & Email',       rating: 4.8, missions: 47, price: 150000, city: 'Dakar',       color: '#1F5C99' },
  { id: 2, name: 'Fatou Sow',       specialty: 'Sécurité Web',      rating: 4.6, missions: 32, price: 200000, city: 'Thiès',       color: '#10B981' },
  { id: 3, name: 'Ousmane Ba',      specialty: 'Audit sécurité',    rating: 4.9, missions: 68, price: 180000, city: 'Dakar',       color: '#F59E0B' },
  { id: 4, name: 'Aissatou Ndiaye', specialty: 'Réseau & Pentest',  rating: 4.7, missions: 41, price: 160000, city: 'Saint-Louis', color: '#8B5CF6' },
]

export const MOCK_PENDING_EXPERTS = [
  { id: 1, name: 'Abdoulaye Fall',  cni: '1 789 1985 0 0421', level: 'Master 2',  specialty: 'Cloud Security', date: '17 avr. 2026' },
  { id: 2, name: 'Khady Seck',      cni: '2 912 1992 0 0183', level: 'Ingénieur', specialty: 'DevSecOps',      date: '16 avr. 2026' },
  { id: 3, name: 'Ibrahima Diouf',  cni: '1 645 1988 0 0752', level: 'Doctorat',  specialty: 'Cryptographie',  date: '15 avr. 2026' },
]

/* missionStart = timestamp ISO d'acceptation de la mission (pour timer 48h) */
export const MOCK_CONVERSATIONS = [
  {
    id: 1, expert: MOCK_EXPERTS[0], subject: 'ec2lt.sn',      unread: 3, last: 'Il y a 5 min',
    level: 2, preview: 'Je viens d\'analyser votre scan, on peut…',
    missionStart: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 2, expert: MOCK_EXPERTS[2], subject: 'wavedigital.sn', unread: 0, last: 'Hier',
    level: 3, preview: 'Rapport complet envoyé. Bonne réception.',
    missionStart: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: 3, expert: MOCK_EXPERTS[1], subject: 'orange.sn',      unread: 0, last: '15 avr.',
    level: 1, preview: 'Bonjour, intéressée par votre demande.',
    missionStart: null,
  },
]

export const MOCK_MESSAGES = [
  { from: 'expert', time: '09:14', text: 'Bonjour Ibrahima, j\'ai bien reçu votre demande concernant le scan de ec2lt.sn. Le score de 50/100 est effectivement préoccupant.' },
  { from: 'client', time: '09:18', text: 'Bonjour Mamadou, oui je suis inquiet. Le DMARC est marqué comme absent, c\'est grave ?' },
  { from: 'expert', time: '09:20', text: 'Oui c\'est critique. Sans DMARC, n\'importe qui peut envoyer un email en se faisant passer pour @ec2lt.sn. Je peux configurer une politique DMARC + SPF + DKIM pour vous.' },
  { from: 'expert', time: '09:21', text: 'Je propose une mission complète : audit DNS + mise en conformité. Budget estimé 150 000 FCFA, délai 48h.' },
  { from: 'client', time: '09:25', text: 'Ça me semble raisonnable. Comment on procède pour le contrat ?' },
  { from: 'expert', time: '09:27', text: 'Je vous envoie le contrat numérique dans la messagerie. Une fois signé, j\'aurai accès Niveau 3 à votre rapport pour 48h et je commence.' },
]

export const SCORE_CATEGORIES = [
  { label: 'DNS',         pts: 18, max: 25, detail: 'SPF présent, DMARC absent' },
  { label: 'SSL / TLS',   pts: 22, max: 25, detail: 'Certificat valide, expire dans 47 jours' },
  { label: 'Headers HTTP', pts: 8, max: 20, detail: 'CSP et HSTS manquants' },
  { label: 'Ports réseau', pts: 5, max: 15, detail: 'Port 8080 et 3306 ouverts' },
  { label: 'Réputation',  pts: 7,  max: 15, detail: 'Aucune blacklist, SSL Labs B' },
]

export const SCAN_ISSUES = [
  { severity: 'CRITIQUE', color: 'red',    title: 'Enregistrement DMARC absent',          desc: 'Sans DMARC, n\'importe qui peut envoyer un email en se faisant passer pour @ec2lt.sn', tool: 'check_dns()', cve: null },
  { severity: 'HAUT',     color: 'orange', title: 'Content-Security-Policy manquant',     desc: 'Le header CSP n\'est pas défini. Risque d\'injection de scripts malveillants (XSS).', tool: 'scan_headers()', cve: null },
  { severity: 'HAUT',     color: 'orange', title: 'Strict-Transport-Security manquant',   desc: 'Sans HSTS, un attaquant peut forcer la rétrogradation vers HTTP non chiffré.', tool: 'scan_headers()', cve: null },
  { severity: 'MOYEN',    color: 'yellow', title: 'Port 8080 ouvert publiquement',         desc: 'Un service de développement semble exposé. Recommandation : restreindre par firewall.', tool: 'scan_ports()', cve: null },
  { severity: 'MOYEN',    color: 'yellow', title: 'Librairie obsolète détectée',           desc: 'requests 2.25.0, vulnérable à CVE-2023-32681.', tool: 'scan_github_repo()', cve: 'CVE-2023-32681' },
]

/* GitHub scan findings (mock, réels viennent du backend) */
export const MOCK_GITHUB_FINDINGS = {
  repo: 'github.com/ibraly/api',
  cloneTime: 3.1,
  scanTime: 22.4,
  bandit: [
    { severity: 'HIGH',   line: 42, file: 'app/auth.py',    issue: 'Mot de passe codé en dur détecté',   code: 'SECRET_KEY = "mysecretkey123"', cwe: 'CWE-798' },
    { severity: 'MEDIUM', line: 87, file: 'api/views.py',   issue: 'Utilisation de eval() sur entrée utilisateur', code: 'result = eval(user_input)', cwe: 'CWE-95' },
    { severity: 'MEDIUM', line: 14, file: 'db/models.py',   issue: 'Injection SQL via requête brute',     code: 'cursor.execute("SELECT * FROM users WHERE id=%s" % uid)', cwe: 'CWE-89' },
  ],
  safety: [
    { package: 'requests', version: '2.25.0', cve: 'CVE-2023-32681', severity: 'HIGH',     desc: 'Fuite du header Proxy-Authorization vers des hôtes non-TLS' },
    { package: 'pillow',   version: '8.1.0',  cve: 'CVE-2021-25290', severity: 'CRITICAL', desc: 'Buffer overflow dans le décodeur TIFF' },
    { package: 'django',   version: '3.1.4',  cve: 'CVE-2021-28658', severity: 'HIGH',     desc: 'Path traversal dans FileSystemStorage' },
  ],
  trufflehog: [
    { type: 'AWS Access Key', file: '.env.backup',        line: 3,  value: 'AKIAIOSFODNN7EXAMPLE',     verified: true },
    { type: 'API Token',      file: 'config/settings.py', line: 18, value: 'sk-proj-***...***wBXsK',   verified: false },
  ],
  semgrep: [
    { rule: 'python.django.security.audit.raw-query',        severity: 'HIGH',   file: 'db/queries.py',  line: 23, msg: 'Injection SQL via requête brute (ORM non utilisé)' },
    { rule: 'python.requests.best-practice.use-timeout',     severity: 'MEDIUM', file: 'utils/http.py',  line: 11, msg: 'Appel requests sans timeout : risque de blocage infini' },
    { rule: 'python.lang.security.insecure-hash-algorithms', severity: 'MEDIUM', file: 'app/crypto.py',  line: 7,  msg: 'Algorithme MD5 utilisé pour hachage de mot de passe' },
  ],
}