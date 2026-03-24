import FeedLeftSidebar from "@/components/feed/feed-left-sidebar";
import FeedRightSidebar from "@/components/feed/feed-right-sidebar";

/**
 * Shared 3-column layout (mint bg applied on parent): left explore + events, center column, right trending.
 */
export default function FeedShell({ children }) {
  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <FeedLeftSidebar hasEvent={false} />
        </aside>

        <div className="flex flex-col gap-5 lg:col-span-6">{children}</div>

        <aside className="hidden lg:col-span-3 lg:block">
          <FeedRightSidebar />
        </aside>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 lg:hidden">
        <div className="grid gap-6 sm:grid-cols-2">
          <FeedLeftSidebar hasEvent={false} />
          <FeedRightSidebar />
        </div>
      </div>
    </>
  );
}
