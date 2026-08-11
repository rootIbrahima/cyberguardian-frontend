import { useState, useEffect } from 'react'

/* Hauteur réellement visible de la fenêtre.

   Safari iOS n'honore pas « interactive-widget » : à l'ouverture du clavier, la
   hauteur de mise en page ne bouge pas, seule la fenêtre visuelle rétrécit. Un
   écran dimensionné en dvh dépasse alors la zone visible et Safari fait défiler
   la page pour révéler le champ de saisie, ce qui escamote la barre supérieure
   et donne l'impression que la conversation occupe tout l'écran.

   visualViewport est la seule source qui suive le clavier sur les deux
   plateformes. Repli sur innerHeight pour les navigateurs qui ne l'exposent
   pas, où le comportement reste celui d'avant. */
export default function useHauteurVisible() {
  const mesurer = () => window.visualViewport?.height ?? window.innerHeight
  const [hauteur, setHauteur] = useState(mesurer)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) {
      const surRedimension = () => setHauteur(window.innerHeight)
      window.addEventListener('resize', surRedimension)
      return () => window.removeEventListener('resize', surRedimension)
    }
    // « scroll » autant que « resize » : iOS décale la fenêtre visuelle avant
    // d'en changer la hauteur, les deux événements doivent être suivis.
    const surChangement = () => setHauteur(vv.height)
    vv.addEventListener('resize', surChangement)
    vv.addEventListener('scroll', surChangement)
    return () => {
      vv.removeEventListener('resize', surChangement)
      vv.removeEventListener('scroll', surChangement)
    }
  }, [])

  return hauteur
}
