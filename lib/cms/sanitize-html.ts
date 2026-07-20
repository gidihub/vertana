const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "strong",
  "em",
  "s",
  "a",
  "img",
  "hr",
  "br",
])

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "rel", "target"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
}

const BLOCK_REMOVE = /<\/?(script|style|iframe|object|embed|form)\b[^>]*>/gi
const VOID_REMOVE =
  /<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi

function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
}

function stripEventHandlers(html: string): string {
  return html
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
}

function normalizeUrl(raw: string, forHref: boolean): string | null {
  let value = raw.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "")
  try {
    value = decodeURIComponent(value)
  } catch {
    // keep raw
  }
  if (!value) return null
  if (value.startsWith("#") || value.startsWith("/")) return value
  const lower = value.toLowerCase()
  if (forHref && lower.startsWith("mailto:")) {
    return value
  }
  if (lower.startsWith("javascript:")) return null
  if (lower.startsWith("data:")) return null
  if (lower.startsWith("vbscript:")) return null
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return value
  }
  return null
}

function sanitizeTag(match: string, tag: string, attrs: string): string {
  const name = tag.toLowerCase()
  if (!ALLOWED_TAGS.has(name)) return ""
  if (name === "br" || name === "hr") return `<${name}>`

  const allowed = TAG_ATTRS[name] ?? new Set<string>()
  const kept: string[] = []
  const attrRe = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(attrs)) !== null) {
    const key = m[1].toLowerCase()
    if (!allowed.has(key)) continue
    const val = m[2] ?? m[3] ?? m[4] ?? ""
    if (key === "href" || key === "src") {
      const safe = normalizeUrl(val, key === "href")
      if (!safe) continue
      kept.push(`${key}="${safe.replace(/"/g, "&quot;")}"`)
    } else if (key === "target" && val === "_blank") {
      kept.push('target="_blank"')
      if (!kept.some((a) => a.startsWith("rel="))) {
        kept.push('rel="noopener noreferrer"')
      }
    } else {
      kept.push(`${key}="${val.replace(/"/g, "&quot;")}"`)
    }
  }

  if (match.startsWith("</")) return `</${name}>`
  const attrStr = kept.length ? ` ${kept.join(" ")}` : ""
  return `<${name}${attrStr}>`
}

/** Sanitize CMS HTML before dangerouslySetInnerHTML. */
export function sanitizeHtml(input: string): string {
  if (!input?.trim()) return ""

  let html = decodeEntities(input)
  html = html.replace(BLOCK_REMOVE, "").replace(VOID_REMOVE, "")
  html = stripEventHandlers(html)

  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tag, attrs) =>
    sanitizeTag(full, tag, attrs ?? ""),
  )

  html = html.replace(/<[^>]+>/g, (full) => {
    const m = full.match(/^<\/?([a-zA-Z0-9]+)([^>]*)>$/)
    if (!m) return ""
    return sanitizeTag(full, m[1], m[2] ?? "")
  })

  return html.trim()
}

export function escapeJsonLd(value: string): string {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
}
