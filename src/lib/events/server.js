function normalizeTypeLabel(value) {
  if (value === "dog-show") return "Dog show";
  if (value === "pet-adoption") return "Pet adoption";
  return "Meet up";
}

export async function getNextEventForUserId(supabase, userId) {
  const { data, error } = await supabase
    .from("events")
    .select("event_date, event_time, city, country, event_type, purpose")
    .eq("owner_id", userId)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    title: normalizeTypeLabel(data.event_type),
    when: `${data.event_date} • ${data.event_time?.slice(0, 5) ?? ""}`,
    location: `${data.city}, ${data.country}`,
    purpose: data.purpose,
  };
}

export async function getEventSectionsForUserId(supabase, userId) {
  const { data: rows, error } = await supabase
    .from("events")
    .select("id, owner_id, event_date, event_time, city, country, event_type, purpose")
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true })
    .limit(60);

  if (error || !rows?.length) {
    return { myEvents: [], otherEvents: [] };
  }

  const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter(Boolean))];
  let nameByOwner = {};
  if (ownerIds.length) {
    const { data: profiles } = await supabase
      .from("pet_profiles")
      .select("owner_id, owner_display_name, pet_name")
      .eq("is_primary", true)
      .in("owner_id", ownerIds);

    nameByOwner = Object.fromEntries(
      (profiles ?? []).map((p) => {
        const owner = p.owner_display_name?.trim();
        const pet = p.pet_name?.trim();
        const display = owner && pet ? `${owner} & ${pet}` : owner || pet || "PetSpot user";
        return [p.owner_id, display];
      }),
    );
  }

  const mapped = rows.map((r) => ({
    id: r.id,
    ownerId: r.owner_id,
    title: normalizeTypeLabel(r.event_type),
    when: `${r.event_date} • ${r.event_time?.slice(0, 5) ?? ""}`,
    location: `${r.city}, ${r.country}`,
    date: r.event_date,
    time: r.event_time?.slice(0, 5) ?? "",
    city: r.city,
    country: r.country,
    eventType: r.event_type,
    purpose: r.purpose,
    authorName: nameByOwner[r.owner_id] || "PetSpot user",
  }));

  const myEvents = mapped.filter((e) => e.ownerId === userId).slice(0, 30);
  const otherEvents = mapped.filter((e) => e.ownerId !== userId).slice(0, 6);

  return { myEvents, otherEvents };
}
