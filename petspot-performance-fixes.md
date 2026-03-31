# PetSpot Web — Performance Fix List
> Stack: Next.js + Supabase + Tailwind CSS
> Source: Lighthouse audit on /feed page (Score: 88 → target 95+)

---

## FIX 1 — Image Optimization via Supabase Transform API
**Priority: CRITICAL | Est. savings: ~1,827 KB**

### Problem
Images are being served at full resolution but displayed at tiny sizes:
- Profile avatars: uploaded at 1200×1200px but displayed at 42×42px (99% wasted)
- Post images: uploaded at 1080×810px but displayed at 755×425px

### What to do
Create a new utility file `src/lib/imageUrl.js`:

```js
export function getOptimizedImageUrl(url, { width, height, quality = 75 } = {}) {
  if (!url || !url.includes('supabase.co')) return url;

  const storageIndex = url.indexOf('/storage/v1/object/public/');
  if (storageIndex === -1) return url;

  const pathPart = url.slice(storageIndex + '/storage/v1/object/public/'.length);
  const [bucket, ...rest] = pathPart.split('/');
  const filePath = rest.join('/');
  const base = url.split('/storage/v1/')[0];

  const params = new URLSearchParams();
  if (width) params.set('width', width);
  if (height) params.set('height', height);
  params.set('format', 'webp');
  params.set('quality', String(quality));

  return `${base}/storage/v1/render/image/public/${bucket}/${filePath}?${params}`;
}
```

Then apply it everywhere images from Supabase are rendered:

```jsx
import { getOptimizedImageUrl } from '@/lib/imageUrl';

// Small profile avatar (displayed at ~42px)
<img
  src={getOptimizedImageUrl(profile.avatar_url, { width: 84, height: 84 })}
  width={42}
  height={42}
  alt={profile.name}
/>

// Medium avatar (displayed at ~75px)
<img
  src={getOptimizedImageUrl(profile.avatar_url, { width: 150, height: 150 })}
  width={75}
  height={75}
  alt={profile.name}
/>

// Post/feed image (displayed at ~755px wide)
<img
  src={getOptimizedImageUrl(post.image_url, { width: 800 })}
  width={755}
  height={425}
  style={{ width: '100%', height: 'auto' }}
  alt="Post image"
/>
```

**Rule of thumb:** always pass `width` and `height` at 2x the CSS display size (for retina screens).

---

## FIX 2 — Skeleton Screens for Feed
**Priority: HIGH | Impact: Perceived load time (10s render delay)**

### Problem
Lighthouse detected an "Element Render Delay" of 10,830ms — the feed is blank while posts are fetching. No skeleton or placeholder is shown.

### What to do
Create `src/components/PostSkeleton.jsx`:

```jsx
export default function PostSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-4 mb-4 shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-2 bg-gray-100 rounded w-20" />
        </div>
      </div>
      {/* Text lines */}
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-4" />
      {/* Image placeholder */}
      <div className="h-52 bg-gray-200 rounded-lg" />
      {/* Action buttons row */}
      <div className="flex gap-4 mt-4">
        <div className="h-4 bg-gray-100 rounded w-12" />
        <div className="h-4 bg-gray-100 rounded w-12" />
        <div className="h-4 bg-gray-100 rounded w-12" />
      </div>
    </div>
  );
}
```

In your feed page/component, show skeletons while loading:

```jsx
import PostSkeleton from '@/components/PostSkeleton';

// In your feed component:
{isLoading ? (
  <>
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </>
) : posts.length === 0 ? (
  <p className="text-center text-gray-400">No posts yet.</p>
) : (
  posts.map(post => <PostCard key={post.id} post={post} />)
)}
```

---

## FIX 3 — Update next.config.mjs
**Priority: HIGH | Impact: Cache TTL, image formats, bundle size**

### Problem
- Images cached for only 1 hour — returning users re-download everything
- No AVIF/WebP format hints configured
- No package import optimization

### What to do
Replace the contents of `next.config.mjs` with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    minimumCacheTTL: 2592000, // 30 days
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
```

---

## FIX 4 — Add explicit width and height to all `<img>` tags
**Priority: MEDIUM | Impact: Cumulative Layout Shift (CLS), visual stability**

### Problem
Lighthouse flagged unsized images that cause layout shifts — the page "jumps" as images load in because the browser doesn't know how much space to reserve.

### What to do
Find every `<img>` tag in your components and add `width` and `height` attributes matching the CSS display size:

```jsx
// BAD — no dimensions, causes layout shift
<img src={post.image_url} className="w-full rounded-lg" />

// GOOD — explicit dimensions, no layout shift
<img
  src={post.image_url}
  width={755}
  height={425}
  className="w-full rounded-lg"
  style={{ height: 'auto' }}
  alt="Post image"
/>
```

Or switch to Next.js `<Image>` component, which handles this automatically:

```jsx
import Image from 'next/image';

<Image
  src={getOptimizedImageUrl(post.image_url, { width: 800 })}
  width={755}
  height={425}
  alt="Post image"
  className="rounded-lg"
/>
```

---

## FIX 5 — Lazy Load Off-Screen Images
**Priority: MEDIUM | Impact: Initial page load speed**

### Problem
All images in the feed are loaded immediately on page load, even ones that are far below the fold.

### What to do
Add `loading="lazy"` to all post/feed images (NOT the first visible image — keep that eager):

```jsx
// First image in feed — keep eager (it's LCP)
<img src={...} loading="eager" ... />

// All other images — lazy load
<img src={...} loading="lazy" ... />
```

Or if using Next.js `<Image>`, it lazy loads by default. For the first post's image, add `priority`:

```jsx
// First post in feed
<Image src={...} priority ... />

// All other posts
<Image src={...} ... />
```

---

## FIX 6 — Add Explicit Video Dimensions + Lazy Load
**Priority: LOW-MEDIUM | Impact: CLS, bandwidth**

### Problem
Videos from Supabase are also loaded eagerly and may lack dimensions, causing layout shift.

### What to do
For `<video>` elements in your feed:

```jsx
<video
  width={755}
  height={425}
  preload="none"          // Don't preload video data
  poster={thumbnailUrl}  // Show a thumbnail while not playing
  controls
  className="w-full rounded-lg"
>
  <source src={post.video_url} type="video/mp4" />
</video>
```

`preload="none"` is the biggest win here — it stops videos from downloading until the user interacts with them.

---

## FIX 7 — Remove Vercel Toolbar in Production
**Priority: LOW | Impact: Removes 23 KB of unnecessary 3rd party JS**

### Problem
`vercel.live/feedback/feedback.js` (23 KB) is loading on your production site. This is the Vercel feedback widget and should not be in production.

### What to do
In your Vercel project dashboard:
- Go to **Settings → General**
- Find **Vercel Toolbar** and disable it for the Production environment

Or add to `next.config.mjs`:

```js
const nextConfig = {
  // ...existing config...
  // Disable Vercel speed insights / toolbar if not needed
};
```

---

## Summary — Priority Order

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Supabase image transforms | Medium | 🔴 Massive — saves ~1.8 MB |
| 2 | Skeleton screens | Low | 🔴 High — removes blank screen |
| 3 | next.config.mjs updates | Low | 🟡 Medium — caching + formats |
| 4 | Explicit img dimensions | Low | 🟡 Medium — stops layout shift |
| 5 | Lazy load images | Low | 🟡 Medium — faster initial load |
| 6 | Video preload="none" | Low | 🟡 Medium — saves bandwidth |
| 7 | Remove Vercel toolbar | Very Low | 🟢 Minor — saves 23 KB |

---

## How to prompt Cursor

For each fix, open the relevant file in Cursor and use a prompt like:

> "Apply Fix 1 from my performance doc. Create `src/lib/imageUrl.js` with the `getOptimizedImageUrl` helper, then find every place in this file where a Supabase image URL is used and wrap it with the helper using the correct display dimensions."

---

## Repeat Navigation Checklist (for new pages)

Use this checklist before shipping any new route:

- Add `RouteSnapshotWriter` in the route page and keep snapshot payload minimal (title, avatar, first items only).
- Read snapshots with `useRouteSnapshot(routeKey)` only (TTL-protected stale-while-revalidate behavior).
- Keep first payload small:
  - feed-style pages: ~12 initial cards
  - profile-style pages: ~40 initial posts max
  - events sections: keep list limits low for first paint.
- Use intent-based prefetch only (hover/focus) and guard with connection checks (`saveData`, slow networks).
- Media policy:
  - images: use `getOptimizedImageUrl()` (feature-flagged)
  - first visible media can be eager; below-the-fold media stays lazy
  - videos use `preload="metadata"` and set `poster` when an image URL exists.
