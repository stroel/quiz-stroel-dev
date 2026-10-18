import { FLAGS, REGIONS, type FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';

export interface OverviewSection {
  title: string;
  entries: FlagEntry[];
}

function byName(a: FlagEntry, b: FlagEntry): number {
  return a.name.localeCompare(b.name, 'nl');
}

/**
 * The flags grouped the way the setup screen offers them: countries per region
 * (a transcontinental country under each of its regions), then the disputed
 * areas, territories and organisations as sections of their own. Alphabetical
 * inside each section.
 */
export function overviewSections(
  options: { organisations: boolean },
  keep: (flag: FlagEntry) => boolean = () => true,
): OverviewSection[] {
  const flags = FLAGS.filter(keep);
  const sections: OverviewSection[] = REGIONS.map((region) => ({
    title: T.regions[region],
    entries: flags.filter((f) => f.kind === 'land' && f.regions.includes(region)).sort(byName),
  }));
  sections.push(
    {
      title: T.setup.disputed,
      entries: flags.filter((f) => f.kind === 'betwist').sort(byName),
    },
    {
      title: T.setup.territories,
      entries: flags.filter((f) => f.kind === 'gebied').sort(byName),
    },
  );
  if (options.organisations) {
    sections.push({
      title: T.setup.organisations,
      entries: flags.filter((f) => f.kind === 'organisatie').sort(byName),
    });
  }
  return sections.filter((section) => section.entries.length > 0);
}
