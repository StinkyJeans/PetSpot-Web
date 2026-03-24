function fileExtension(filename) {
  const parts = filename.split(".");
  if (parts.length < 2) return "bin";
  return parts.pop().toLowerCase();
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildUserMediaPath(userId, folder, filename) {
  const safeName = sanitizeFilename(filename);
  return `${userId}/${folder}/${Date.now()}-${safeName}`;
}

export function buildCurrentPath(userId, folder, filename) {
  const ext = fileExtension(filename);
  return `${userId}/${folder}/current.${ext}`;
}
