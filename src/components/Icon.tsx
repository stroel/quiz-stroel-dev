import { ICON_PATHS } from '@/lib/icon-paths';

/**
 * React equivalent of Icon.astro — renders a Lucide icon by name using the
 * shared ICON_PATHS map.
 */
export default function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] ?? '' }}
    />
  );
}
