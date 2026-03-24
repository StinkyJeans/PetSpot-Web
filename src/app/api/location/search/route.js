import { NextResponse } from "next/server";

function getProviderConfig() {
  const baseUrl = process.env.OSM_GEOCODER_BASE_URL || "https://nominatim.openstreetmap.org";
  const apiKey = process.env.OSM_GEOCODER_API_KEY || "";
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

export async function GET(request) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const { baseUrl, apiKey } = getProviderConfig();
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("q", q);
  if (apiKey) {
    // Some hosted Nominatim-compatible providers require a key.
    url.searchParams.set("key", apiKey);
  }

  try {
    const response = await fetch(url.toString(), {
      // Nominatim usage policy expects identifying headers.
      headers: {
        Accept: "application/json",
        "User-Agent": "PetSpot/1.0 (location search)",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { results: [], error: "Location provider request failed." },
        { status: 502 },
      );
    }

    const rows = await response.json();
    const results = (rows ?? [])
      .map((row) => {
        const addr = row.address ?? {};
        const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || "";
        const country = addr.country || "";
        if (!city || !country) return null;
        return {
          key: `${city}|${country}`,
          city,
          country,
          label: `${city}, ${country}`,
        };
      })
      .filter(Boolean);

    const deduped = [];
    const seen = new Set();
    for (const item of results) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      deduped.push(item);
    }

    return NextResponse.json({ results: deduped });
  } catch {
    return NextResponse.json({ results: [], error: "Location lookup failed." }, { status: 502 });
  }
}
