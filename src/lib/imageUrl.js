export function getOptimizedImageUrl(url, { width, height, quality = 75 } = {}) {
  if (!url || !url.includes("supabase.co")) return url;

  const storageIndex = url.indexOf("/storage/v1/object/public/");
  if (storageIndex === -1) return url;

  const pathPart = url.slice(storageIndex + "/storage/v1/object/public/".length);
  const [bucket, ...rest] = pathPart.split("/");
  const filePath = rest.join("/");
  const base = url.split("/storage/v1/")[0];

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("format", "webp");
  params.set("quality", String(quality));

  return `${base}/storage/v1/render/image/public/${bucket}/${filePath}?${params.toString()}`;
}
