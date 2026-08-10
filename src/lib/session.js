/* Session du navigateur.

   Le jeton vit dans localStorage quand l'utilisateur demande à rester connecté,
   dans sessionStorage sinon : il disparaît alors à la fermeture de l'onglet.
   La case « Rester connecté » était jusqu'ici cochée d'office et branchée sur
   rien, la session survivant toujours au navigateur. Sur un poste partagé, ce
   n'est pas un détail.

   Une seule des deux zones porte le jeton à un instant donné : l'ouverture
   d'une session efface systématiquement l'autre. */

const CLE_JETON = 'cg-token'
const CLE_USER  = 'cg-user'

export function ouvrirSession(jeton, utilisateur, persistant) {
  fermerSession()
  const zone = persistant ? localStorage : sessionStorage
  zone.setItem(CLE_JETON, jeton)
  zone.setItem(CLE_USER, JSON.stringify(utilisateur))
}

export function lireJeton() {
  return localStorage.getItem(CLE_JETON) || sessionStorage.getItem(CLE_JETON)
}

export function lireUtilisateur() {
  const brut = localStorage.getItem(CLE_USER) || sessionStorage.getItem(CLE_USER)
  try {
    return JSON.parse(brut || '{}')
  } catch {
    return {}
  }
}

/* Rafraîchit le profil sans toucher au choix de persistance : écrire dans
   localStorage un profil dont le jeton vit dans sessionStorage ferait survivre
   l'identité à la fermeture de l'onglet. */
export function majUtilisateur(utilisateur) {
  const zone = localStorage.getItem(CLE_JETON) ? localStorage : sessionStorage
  zone.setItem(CLE_USER, JSON.stringify(utilisateur))
}

export function fermerSession() {
  for (const zone of [localStorage, sessionStorage]) {
    zone.removeItem(CLE_JETON)
    zone.removeItem(CLE_USER)
  }
}
