export default function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
      {/* Thumbnail area */}
      <div className="h-48 skeleton-shimmer" />

      {/* Content area */}
      <div className="p-5 space-y-3">
        {/* Category pill */}
        <div className="h-5 w-20 rounded-full skeleton-shimmer" />

        {/* Title lines */}
        <div className="h-5 w-full rounded-lg skeleton-shimmer" />
        <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />

        {/* Instructor */}
        <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />

        {/* Meta row */}
        <div className="flex gap-3 pt-1">
          <div className="h-3.5 w-16 rounded skeleton-shimmer" />
          <div className="h-3.5 w-14 rounded skeleton-shimmer" />
          <div className="h-3.5 w-12 rounded skeleton-shimmer" />
        </div>

        {/* Star rating */}
        <div className="flex gap-1 pt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3.5 w-3.5 rounded skeleton-shimmer" />
          ))}
          <div className="h-3.5 w-8 rounded ml-1 skeleton-shimmer" />
        </div>

        {/* Button */}
        <div className="h-10 w-full rounded-xl skeleton-shimmer mt-2" />
      </div>
    </div>
  );
}
