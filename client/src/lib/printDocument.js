/** Impression fiable (évite page blanche Chrome avec iframe) */
export function imprimerHtml(html, { title = 'Impression', pageSize = 'A4' } = {}) {
  const sizes = {
    A4: 'A4 portrait',
    A3: 'A3 portrait',
    A2: 'A2 portrait',
    A4p: 'A4 landscape',
  }
  const pageRule = sizes[pageSize] || sizes.A4
  const fullHtml = html.replace('</style>', `@page { size: ${pageRule}; margin: 12mm; }\n</style>`)

  const w = window.open('', '_blank', 'width=1000,height=800')
  if (!w) {
    return { ok: false, error: 'Autorisez les popups dans Chrome pour imprimer' }
  }
  w.document.open()
  w.document.write(fullHtml)
  w.document.close()
  w.document.title = title
  setTimeout(() => {
    w.focus()
    w.print()
  }, 600)
  return { ok: true }
}

export const FORMATS_IMPRESSION = [
  { value: 'A4', label: 'A4 (standard)' },
  { value: 'A4p', label: 'A4 paysage' },
  { value: 'A3', label: 'A3' },
  { value: 'A2', label: 'A2 (grand format)' },
]
