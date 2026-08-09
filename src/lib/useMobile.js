import { useState, useEffect } from 'react'

/* Seuil de bascule de la navigation. En dessous de 1024 px, la barre latérale
   fixe mangerait le quart de la largeur utile : elle passe en tiroir
   escamotable, ouvert depuis la barre supérieure. Au-dessus, elle reste
   ancrée à gauche comme sur poste de travail. */
const REQUETE = '(max-width: 1023px)'

export default function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(REQUETE).matches)

  useEffect(() => {
    const mq = window.matchMedia(REQUETE)
    const surChangement = (e) => setMobile(e.matches)
    mq.addEventListener('change', surChangement)
    return () => mq.removeEventListener('change', surChangement)
  }, [])

  return mobile
}
