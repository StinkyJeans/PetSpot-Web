"use client";

function replaceFileExtension(name, nextExt) {
  const base = String(name ?? "upload").replace(/\.[^/.]+$/, "");
  return `${base}.${nextExt}`;
}

function readImageBitmap(file) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export async function compressImageForUpload(file, options = {}) {
  const maxDimension = Number(options.maxDimension ?? 1440);
  const quality = Number(options.quality ?? 0.8);
  const outputType = "image/webp";

  try {
    const bitmap = await readImageBitmap(file);
    const width = bitmap.width ?? 0;
    const height = bitmap.height ?? 0;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    if (!blob) return file;
    if (blob.size >= file.size * 0.95) return file;

    return new File([blob], replaceFileExtension(file.name, "webp"), {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

async function loadVideoElement(file) {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  const url = URL.createObjectURL(file);
  video.src = url;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Video metadata failed to load"));
  });
  return { video, url };
}

export async function compressVideoForUpload(file, options = {}) {
  const mimeType = pickRecorderMimeType();
  if (!mimeType) return file;

  const videoBitsPerSecond = Number(options.videoBitsPerSecond ?? 520000);
  const audioBitsPerSecond = Number(options.audioBitsPerSecond ?? 64000);
  const frameRate = Number(options.frameRate ?? 24);
  const maxDimension = Number(options.maxDimension ?? 854); // ~480p long edge
  const maxTranscodeDurationSec = Number(options.maxTranscodeDurationSec ?? 75);

  let video;
  let objectUrl = "";
  let rafId = 0;
  try {
    const loaded = await loadVideoElement(file);
    video = loaded.video;
    objectUrl = loaded.url;

    // Browser-side transcode is real-time. For long clips, skip costly transcode
    // so upload can start quickly.
    const durationSec = Number(video.duration ?? 0);
    if (durationSec > maxTranscodeDurationSec) return file;

    const sourceStream = typeof video.captureStream === "function" ? video.captureStream() : null;
    if (!sourceStream) return file;

    const sourceWidth = Math.max(1, Math.round(video.videoWidth || 1));
    const sourceHeight = Math.max(1, Math.round(video.videoHeight || 1));
    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return file;

    const canvasStream = canvas.captureStream(frameRate);
    const mixedStream = new MediaStream();
    const canvasVideoTrack = canvasStream.getVideoTracks()[0];
    if (!canvasVideoTrack) return file;
    mixedStream.addTrack(canvasVideoTrack);
    for (const audioTrack of sourceStream.getAudioTracks()) {
      mixedStream.addTrack(audioTrack);
    }

    const chunks = [];
    const recorder = new MediaRecorder(mixedStream, {
      mimeType,
      videoBitsPerSecond,
      audioBitsPerSecond,
    });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    const finished = new Promise((resolve) => {
      recorder.onstop = () => resolve();
    });

    const drawFrame = () => {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      rafId = window.requestAnimationFrame(drawFrame);
    };

    recorder.start(200);
    drawFrame();
    video.currentTime = 0;
    await video.play();
    await new Promise((resolve) => {
      video.onended = () => resolve();
    });
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    recorder.stop();
    await finished;

    const blob = new Blob(chunks, { type: mimeType });
    if (!blob.size || blob.size >= file.size * 0.95) return file;

    return new File([blob], replaceFileExtension(file.name, "webm"), {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    if (video) {
      video.pause();
      video.src = "";
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export async function compressMediaForUpload(file) {
  const type = String(file?.type ?? "").toLowerCase();
  if (type.startsWith("image/")) {
    const compressed = await compressImageForUpload(file);
    return { file: compressed, kind: "image" };
  }
  if (type.startsWith("video/")) {
    const compressed = await compressVideoForUpload(file);
    return { file: compressed, kind: "video" };
  }
  return { file, kind: null };
}

