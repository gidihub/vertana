const MAX_BYTES = 5 * 1024 * 1024

type ImageKind = "jpeg" | "png" | "webp" | "gif"

const SIGNATURES: Array<{ kind: ImageKind; ext: string; match: (b: Uint8Array) => boolean }> = [
  {
    kind: "jpeg",
    ext: "jpg",
    match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    kind: "png",
    ext: "png",
    match: (b) =>
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47,
  },
  {
    kind: "gif",
    ext: "gif",
    match: (b) =>
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38,
  },
  {
    kind: "webp",
    ext: "webp",
    match: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
]

export function detectImage(bytes: Uint8Array): { kind: ImageKind; ext: string } | null {
  for (const sig of SIGNATURES) {
    if (sig.match(bytes)) return { kind: sig.kind, ext: sig.ext }
  }
  return null
}

export function validateImageUpload(
  buffer: ArrayBuffer,
): { ok: true; ext: string; contentType: string } | { ok: false; error: string } {
  if (buffer.byteLength > MAX_BYTES) {
    return { ok: false, error: "File must be 5 MB or smaller" }
  }
  const bytes = new Uint8Array(buffer)
  const detected = detectImage(bytes)
  if (!detected) {
    return { ok: false, error: "Unsupported image type (jpeg, png, webp, gif only)" }
  }
  const contentType =
    detected.kind === "jpeg"
      ? "image/jpeg"
      : detected.kind === "png"
        ? "image/png"
        : detected.kind === "gif"
          ? "image/gif"
          : "image/webp"
  return { ok: true, ext: detected.ext, contentType }
}

export function cacheBustPublicUrl(baseUrl: string): string {
  const sep = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${sep}v=${Date.now()}`
}
