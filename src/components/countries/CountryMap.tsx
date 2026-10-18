import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';

import HighlightMap from '@/components/countries/HighlightMap';
import { useWorld } from '@/components/countries/world';
import { T } from '@/i18n/nl';

// Never tighter than this (degrees), or a microstate fills the screen and shows nothing around it.
const MIN_RADIUS = 7;

/** The world around one country, with that country filled in. */
export default function CountryMap({ code }: { code: string }) {
  const countries = useWorld();
  const target = useMemo<FeatureCollection | null>(
    () =>
      countries && {
        type: 'FeatureCollection',
        features: countries.filter((country) => country.id === code),
      },
    [countries, code],
  );
  return (
    <HighlightMap
      target={target}
      kind="land"
      exclude={code}
      minRadius={MIN_RADIUS}
      label={T.countries.mapLabel}
    />
  );
}
