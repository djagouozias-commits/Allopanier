/**
 * Retourne l'URL complète d'une image produit.
 * - Si l'image est déjà une URL complète (http/https), la retourner telle quelle.
 * - Si c'est un chemin local (/uploads/...), pointer vers le serveur backend.
 * - Sinon retourner le placeholder.
 */
export function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://placehold.co/400x300/E8F5E9/2E7D32?text=AlloPanier'
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  if (imageUrl.startsWith('/uploads/')) {
    // En développement, le proxy Vite redirige /uploads → localhost:5000
    return imageUrl
  }
  return 'https://placehold.co/400x300/E8F5E9/2E7D32?text=AlloPanier'
}

export const PLACEHOLDER = 'https://placehold.co/400x300/E8F5E9/2E7D32?text=AlloPanier'
