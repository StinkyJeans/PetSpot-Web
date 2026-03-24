function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString();
}

export default function PostList({ posts }) {
  if (!posts.length) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8">
        <p className="text-sm text-zinc-700">
          No posts yet. Create your first post using the composer.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
        >
          <header className="mb-3">
            <p className="text-sm font-semibold text-zinc-900">
              {post.pet_profiles?.pet_name || "Pet"}
            </p>
            <p className="text-xs text-zinc-500">
              {post.pet_profiles?.breed || "Pet profile"} • {formatDate(post.created_at)}
            </p>
          </header>
          <p className="text-sm text-zinc-800">{post.caption}</p>
          {post.media_kind === "video" && post.media_url ? (
            <div className="mt-4 w-full overflow-hidden rounded-xl border border-zinc-200">
              <video src={post.media_url} controls className="h-auto max-h-[420px] w-full" />
            </div>
          ) : null}
          {(post.media_kind === "image" && post.media_url) || post.image_url ? (
            <div className="mt-4 h-72 w-full overflow-hidden rounded-xl border border-zinc-200">
              <img
                src={post.media_url || post.image_url}
                alt="Post image"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
