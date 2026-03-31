export function getOptimizedImageUrl(url, { width, height, quality = 75 } = {}) {
  // Safety switch: keep original URLs unless transforms are explicitly enabled.
  if (process.env.NEXT_PUBLIC_ENABLE_IMAGE_TRANSFORMS !== "1") return url;
  if (!url || !url.includes("supabase.co")) return url;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const marker = "/storage/v1/object/public/";
  const storageIndex = parsed.pathname.indexOf(marker);
  if (storageIndex === -1) return url;

  const pathPart = parsed.pathname.slice(storageIndex + marker.length);
  const [bucket, ...rest] = pathPart.split("/");
  const filePath = rest.join("/");
  if (!bucket || !filePath) return url;

  // Guardrail: only transform known image assets.
  const cleanPath = filePath.toLowerCase();
  const isImage =
    cleanPath.endsWith(".jpg") ||
    cleanPath.endsWith(".jpeg") ||
    cleanPath.endsWith(".png") ||
    cleanPath.endsWith(".webp") ||
    cleanPath.endsWith(".gif") ||
    cleanPath.endsWith(".avif") ||
    cleanPath.endsWith(".svg");
  if (!isImage) return url;

  const base = parsed.origin;

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("format", "webp");
  params.set("quality", String(quality));

  return `${base}/storage/v1/render/image/public/${bucket}/${filePath}?${params.toString()}`;
}
