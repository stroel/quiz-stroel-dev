import { useEffect, useState } from 'react';

import { loadWorld } from '@/components/countries/world';
import GeoMap, { loadGeo } from '@/components/geo/GeoMap';
import GeoTapMap from '@/components/geo/GeoTapMap';
import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import type { Tapping, TapState } from '@/components/quiz/QuizRound';
import { GEO, GEO_GROUPS, type GeoEntry, type GeoGroup } from '@/data/geo';
import { T } from '@/i18n/nl';
import type { Candidates, Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';

const GROUPS_KEY = 'quiz:aardrijkskunde:groups';
const DIRECTION_KEY = 'quiz:aardrijkskunde:direction';

/** What the player gives: the name of a marked place, or the place of a name. */
type Direction = 'name' | 'place';

// Tap questions get their own ids, so the history keeps naming and finding apart.
const PLACE_PREFIX = 'place:';

const BY_ID = new Map(GEO.map((entry) => [entry.id, entry]));

// Every name in the dataset, so a near-miss on another river is still caught.
const CANDIDATES: Candidates = GEO.map((entry) => ({
  id: entry.id,
  names: [entry.name, ...(entry.aliases ?? [])],
}));

// A few names per series, to show what it holds.
function examples(group: GeoGroup): string {
  return GEO.filter((entry) => entry.group === group)
    .slice(0, 3)
    .map((entry) => entry.name)
    .join(', ');
}

function toQuestion(entry: GeoEntry, direction: Direction): Question {
  return {
    id: direction === 'place' ? `${PLACE_PREFIX}${entry.id}` : entry.id,
    answer: entry.name,
  };
}

function entryOf(question: Question): GeoEntry {
  return BY_ID.get(question.id.replace(PLACE_PREFIX, ''))!;
}

const TAPPING: Tapping = {
  label: (question) => question.answer,
  maxHints: 3,
  wrongText: (id) => T.geo.wrongPick(BY_ID.get(id.slice(PLACE_PREFIX.length))?.name ?? ''),
};

/** The map hands out entry ids; the round thinks in question ids. */
function tapFor(tap: TapState): TapState {
  return {
    ...tap,
    pick: (id) => tap.pick(`${PLACE_PREFIX}${id}`),
    picked: tap.picked.map((id) => id.slice(PLACE_PREFIX.length)),
  };
}

/** Seas, rivers and mountain ranges: name the one marked on the map, or tap the one named. */
export default function GeoQuiz() {
  const [groups, setGroups] = useState<GeoGroup[]>(() => {
    const saved = readJson<GeoGroup[]>(GROUPS_KEY, GEO_GROUPS);
    return Array.isArray(saved) ? saved.filter((group) => GEO_GROUPS.includes(group)) : GEO_GROUPS;
  });

  const [direction, setDirection] = useState<Direction>(() =>
    readJson<Direction>(DIRECTION_KEY, 'name') === 'place' ? 'place' : 'name',
  );

  function choose(next: Direction) {
    setDirection(next);
    writeJson(DIRECTION_KEY, next);
  }

  // Start fetching both maps while the player is still on the setup screen.
  useEffect(() => {
    loadWorld().catch((error: unknown) => console.error(error));
    loadGeo().catch((error: unknown) => console.error(error));
  }, []);

  function toggle(group: GeoGroup) {
    const next = groups.includes(group)
      ? groups.filter((g) => g !== group)
      : GEO_GROUPS.filter((g) => g === group || groups.includes(g));
    setGroups(next);
    writeJson(GROUPS_KEY, next);
  }

  return (
    <QuizFlow
      quiz="aardrijkskunde"
      title={T.quizzes.aardrijkskunde.title}
      select={() => GEO.filter((entry) => groups.includes(entry.group))}
      regions={false}
      extras={[]}
      unit={T.units.questions}
      before={
        <>
          <Panel title={T.geo.direction}>
            <ul className="divide-y divide-slate-200" role="radiogroup">
              <CheckRow
                radio
                on={direction === 'name'}
                label={T.geo.toName}
                detail={T.geo.toNameDetail}
                onClick={() => choose('name')}
              />
              <CheckRow
                radio
                on={direction === 'place'}
                label={T.geo.toPlace}
                detail={T.geo.toPlaceDetail}
                onClick={() => choose('place')}
              />
            </ul>
          </Panel>
          <Panel title={T.geo.groupsTitle}>
            <ul className="divide-y divide-slate-200">
              {GEO_GROUPS.map((group) => (
                <CheckRow
                  key={group}
                  on={groups.includes(group)}
                  label={T.geo.groups[group]}
                  detail={examples(group)}
                  count={GEO.filter((entry) => entry.group === group).length}
                  onClick={() => toggle(group)}
                />
              ))}
            </ul>
          </Panel>
        </>
      }
      questionsFor={(entries) => entries.map((entry) => toQuestion(entry, direction))}
      candidates={CANDIDATES}
      prompt={(question, tap) => {
        const entry = entryOf(question);
        return direction === 'place' ? (
          <GeoTapMap key={question.id} entry={entry} tap={tapFor(tap)} />
        ) : (
          <GeoMap key={question.id} entry={entry} />
        );
      }}
      placeholder={(question) => T.geo.placeholder[entryOf(question).kind]}
      tapping={direction === 'place' ? TAPPING : undefined}
    />
  );
}
