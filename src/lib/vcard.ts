export type VCardInput = {
  name: string
  phones?: string[]
  email?: string
  emails?: string[]
  address?: string
  org?: string
  title?: string
}

export function buildVCard({ name, phones = [], email, emails = [], address, org, title }: VCardInput) {
  const allEmails = [...new Set([...(email ? [email] : []), ...emails].filter(Boolean))]
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    org ? `ORG:${org}` : undefined,
    title ? `TITLE:${title}` : undefined,
    ...phones.map((p) => `TEL;TYPE=CELL:${p}`),
    ...allEmails.map((e) => `EMAIL;TYPE=INTERNET:${e}`),
    address ? `ADR;TYPE=WORK:;;${address}` : undefined,
    'END:VCARD',
  ].filter(Boolean) as string[]
  return lines.join('\n')
}

export function downloadVCardFile(baseName: string, vcardContent: string) {
  const blob = new Blob([vcardContent], { type: 'text/vcard' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName.replace(/\s+/g, '_')}.vcf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}


