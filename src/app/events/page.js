import EventSection from "@/components/event/event-section";
import MainAppChrome from "@/components/layout/main-app-chrome";
import RouteSnapshotWriter from "@/components/navigation/route-snapshot-writer";
import { requirePrimaryPetProfile, requireUser } from "@/lib/auth/server";
import { getEventSectionsForUserId } from "@/lib/events/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const eventsSnapshot = {
  title: "Events",
  subtitle: "Your events and community happenings.",
};

export default async function EventsPage() {
  const user = await requireUser();
  await requirePrimaryPetProfile(user.id);

  const supabase = await getSupabaseServerClient();
  const { myEvents, otherEvents, followedEvents } = await getEventSectionsForUserId(supabase, user.id, {
    maxRows: 36,
    myEventsLimit: 16,
    otherEventsLimit: 12,
    followedEventsLimit: 12,
  });

  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <RouteSnapshotWriter routeKey="/events" snapshot={eventsSnapshot} />
      <MainAppChrome>
        <main className="mx-auto w-full max-w-2xl px-4 py-6">
          <EventSection
            myEvents={myEvents}
            otherEvents={otherEvents}
            followedEvents={followedEvents}
          />
        </main>
      </MainAppChrome>
    </div>
  );
}
