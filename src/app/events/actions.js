"use server";

import { revalidateTag } from "next/cache";
import { requireUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalizeTypeLabel(value) {
  if (value === "dog-show") return "Dog show";
  if (value === "pet-adoption") return "Pet adoption";
  return "Meet up";
}

export async function createEvent(input) {
  const user = await requireUser();
  const event_date = String(input?.date ?? "").trim();
  const event_time = String(input?.time ?? "").trim();
  const city = String(input?.city ?? "").trim();
  const country = String(input?.country ?? "").trim();
  const event_type = String(input?.eventType ?? "").trim();
  const purpose = String(input?.purpose ?? "").trim();

  if (!event_date || !event_time || !city || !country || !event_type || !purpose) {
    return { error: "Please complete all event details." };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: user.id,
      event_date,
      event_time,
      city,
      country,
      event_type,
      purpose,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message || "Could not create event." };
  }

  revalidateTag("feed");
  revalidateTag("profile");

  return {
    error: "",
    event: {
      id: data?.id ?? `${event_date}-${event_time}-${city}`,
      title: normalizeTypeLabel(event_type),
      when: `${event_date} • ${event_time}`,
      location: `${city}, ${country}`,
      date: event_date,
      time: event_time,
      city,
      country,
      eventType: event_type,
      purpose,
    },
  };
}

export async function updateEvent(input) {
  const user = await requireUser();
  const id = String(input?.id ?? "").trim();
  const event_date = String(input?.date ?? "").trim();
  const event_time = String(input?.time ?? "").trim();
  const city = String(input?.city ?? "").trim();
  const country = String(input?.country ?? "").trim();
  const event_type = String(input?.eventType ?? "").trim();
  const purpose = String(input?.purpose ?? "").trim();

  if (!id || !event_date || !event_time || !city || !country || !event_type || !purpose) {
    return { error: "Please complete all event details." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("events")
    .update({ event_date, event_time, city, country, event_type, purpose })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message || "Could not update event." };
  }

  revalidateTag("feed");
  revalidateTag("profile");

  return {
    error: "",
    event: {
      id,
      title: normalizeTypeLabel(event_type),
      when: `${event_date} • ${event_time}`,
      location: `${city}, ${country}`,
      date: event_date,
      time: event_time,
      city,
      country,
      eventType: event_type,
      purpose,
    },
  };
}

export async function getNextEventForUser() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("events")
    .select("event_date, event_time, city, country, event_type, purpose")
    .eq("owner_id", user.id)
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

export async function setEventInterested(eventId) {
  const user = await requireUser();
  const id = String(eventId ?? "").trim();
  if (!id) return { error: "Missing event." };

  const supabase = await getSupabaseServerClient();

  // If already interested, keep it idempotent.
  const { data: existing } = await supabase
    .from("event_interests")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("event_id", id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("event_interests").insert({
      user_id: user.id,
      event_id: id,
    });
    if (error) {
      return { error: error.message || "Could not mark event as interested." };
    }

    const { error: notifyError } = await supabase.rpc("notify_event_interested", {
      p_event_id: id,
    });
    if (notifyError) {
      return {
        error:
          notifyError.message ||
          "Event notification failed. Run the latest notifications migration.",
      };
    }
  }

  revalidateTag("profile");
  revalidateTag("feed");
  return { error: "", interested: true };
}
