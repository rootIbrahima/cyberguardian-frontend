import { useState, useEffect } from 'react'

/* Géométrie de la fenêtre réellement visible.

   À l'ouverture du clavier, iOS ne redimensionne pas la fenêtre de mise en
   page : il rétrécit la fenêtre visuelle et la décale à l'intérieur. Un élément
   en position fixe, positionné par rapport à la fenêtre de mise en page, se
   retrouve alors hors du champ. « decalage » compense ce glissement.

   Repli sur innerHeight là où l'API manque : le comportement y reste celui
   d'avant, aucune plateforme n'est pénalisée. */
export default function useHauteurVisible() {
  const mesurer = () => ({
    hauteur:  window.visualViewport?.height ?? window.innerHeight,
    decalage: window.visualViewport?.offsetTop ?? 0,
  })
  const [geometrie, setGeometrie] = useState(mesurer)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) {
      const surRedimension = () => setGeometrie({ hauteur: window.innerHeight, decalage: 0 })
      window.addEventListener('resize', surRedimension)
      return () => window.removeEventListener('resize', surRedimension)
    }
    // « scroll » autant que « resize » : iOS décale la fenêtre visuelle avant
    // d'en changer la hauteur, les deux événements comptent.
    const surChangement = () => setGeometrie((precedent) => (
      precedent.hauteur === vv.height && precedent.decalage === vv.offsetTop
        ? precedent                                  // même géométrie, pas de rendu
        : { hauteur: vv.height, decalage: vv.offsetTop }
    ))
    vv.addEventListener('resize', surChangement)
    vv.addEventListener('scroll', surChangement)
    return () => {
      vv.removeEventListener('resize', surChangement)
      vv.removeEventListener('scroll', surChangement)
    }
  }, [])

  return geometrie
}
