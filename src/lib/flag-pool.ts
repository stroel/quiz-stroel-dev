import { FLAGS, type FlagEntry, type Region } from '@/data/flags';

export interface FlagSetup {
  regions: Region[];
  microstates: boolean;
  disputed: boolean;
  territories: boolean;
  organisations: boolean;
  /** Empty means every flag in the selection. */
  count: number | null;
  /** Seconds per flag; null means no time limit. */
  timer: number | null;
}

/**
 * The flags a setup selects. Disputed areas and territories follow the chosen
 * regions; microstates and organisations are series of their own and come in
 * regardless of region.
 */
export function selectFlags(setup: FlagSetup): FlagEntry[] {
  return FLAGS.filter((flag) => {
    const inRegion = flag.regions.some((region) => setup.regions.includes(region));
    if (flag.microstate && setup.microstates) return true;
    switch (flag.kind) {
      case 'land':
        return inRegion;
      case 'betwist':
        return inRegion && setup.disputed;
      case 'gebied':
        return inRegion && setup.territories;
      case 'organisatie':
        return setup.organisations;
    }
  });
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function drawFlags(setup: FlagSetup): FlagEntry[] {
  const shuffled = shuffle(selectFlags(setup));
  return setup.count === null ? shuffled : shuffled.slice(0, setup.count);
}

/** Flag SVGs are copied from flag-icons into `public/flags/` by the flag-assets integration. */
export function flagSrc(code: string): string {
  return `/flags/${code}.svg`;
}
