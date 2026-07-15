/**
 * Génère les icônes PWA pour AlloPanier en SVG → PNG
 * Exécuter : node generate-icons.js
 */
const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

// Générer une icône SVG AlloPanier
function genSVG(size) {
  const r = size / 2
  const center = size / 2
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#2E7D32"/>
  <text x="${center}" y="${size * 0.38}" font-family="Arial,sans-serif" font-size="${size * 0.22}" font-weight="900" fill="white" text-anchor="middle">Allo</text>
  <text x="${center}" y="${size * 0.62}" font-family="Arial,sans-serif" font-size="${size * 0.22}" font-weight="900" fill="#F57C00" text-anchor="middle">Panier</text>
  <circle cx="${center}" cy="${size * 0.78}" r="${size * 0.06}" fill="white" opacity="0.6"/>
</svg>`
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

sizes.forEach(size => {
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
  fs.writeFileSync(svgPath, genSVG(size))
  console.log(`Généré: icon-${size}x${size}.svg`)
})

// Créer aussi un fichier PNG placeholder (SVG renommé en PNG pour compatibilité basique)
sizes.forEach(size => {
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`)
  // Copier le SVG comme PNG (les navigateurs modernes acceptent SVG dans le manifest)
  fs.copyFileSync(svgPath, pngPath)
})

console.log('\nIcones générées dans public/icons/')
console.log('Pour des vrais PNG, installez: npm install sharp et relancez avec le script sharp')
