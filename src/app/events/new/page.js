import Link from "next/link";
import MainAppChrome from "@/components/layout/main-app-chrome";
import RouteSnapshotWriter from "@/components/navigation/route-snapshot-writer";

const newEventSnapshot = {
  title: "Create event",
  subtitle: "Event creation is coming soon.",
};

export default async function NewEventPage() {
  return (
    <div className="min-h-screen bg-[#F1F8F1]">
      <RouteSnapshotWriter routeKey="/events/new" snapshot={newEventSnapshot} />
      <MainAppChrome>
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-zinc-900">Create event</h1>
          <p className="mt-2 text-sm text-zinc-600">Event creation is coming soon.</p>
          <Link
            href="/feed"
            className="mt-6 inline-block rounded-full bg-emerald-900 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
          >
            Back to feed
          </Link>
        </main>
      </MainAppChrome>
    </div>
  );
}
