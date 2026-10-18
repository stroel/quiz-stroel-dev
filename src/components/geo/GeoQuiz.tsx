import { useEffect, useState } from 'react';

import { loadWorld } from '@/components/countries/world';
import GeoMap, { loadGeo } from '@/components/geo/GeoMap';
import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import { GEO, GEO_GROUPS, type GeoEntry, type GeoGroup } from '@/data/geo';
import { T } from '@/i18n/nl';
import type { Candidates, Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';

const GROUPS_KEY = 'quiz:aardrijkskunde:groups';

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

function toQuestion(entry: GeoEntry): Question {
  return { id: entry.id, answer: entry.name };
}

/** Seas, rivers and mountain ranges: one is highlighted on the map, the player types its name. */
export default function GeoQuiz() {
  const [groups, setGroups] = useState<GeoGroup[]>(() => {
    const saved = readJson<GeoGroup[]>(GROUPS_KEY, GEO_GROUPS);
    return Array.isArray(saved) ? saved.filter((group) => GEO_GROUPS.includes(group)) : GEO_GROUPS;
  });

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
      }
      questionsFor={(entries) => entries.map(toQuestion)}
      candidates={CANDIDATES}
      prompt={(question) => {
        const entry = BY_ID.get(question.id)!;
        return <GeoMap key={question.id} entry={entry} />;
      }}
      placeholder={(question) => T.geo.placeholder[BY_ID.get(question.id)!.kind]}
    />
  );
}
