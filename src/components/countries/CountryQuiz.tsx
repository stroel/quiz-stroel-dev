import { useEffect, useState } from 'react';

import CountryMap from '@/components/countries/CountryMap';
import TapMap from '@/components/countries/TapMap';
import { loadWorld } from '@/components/countries/world';
import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import type { Tapping, TapState } from '@/components/quiz/QuizRound';
import { ATLAS_SHAPES } from '@/data/atlas-shapes';
import { FLAGS, type FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';
import { selectFlags, type FlagSetup } from '@/lib/flag-pool';
import type { Candidates, Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';

/** What the player gives: the name of a marked country, or its place on the map. */
type Direction = 'name' | 'place';

const DIRECTION_KEY = 'quiz:landen:direction';

// Tap questions get their own ids, so the history keeps naming a country and
// finding it apart.
const PLACE_PREFIX = 'place:';

const FLAG_BY_CODE = new Map(FLAGS.map((flag) => [flag.code, flag]));

// Every country name, so a near-miss on a country outside the selection is
// still caught by the collision check.
const CANDIDATES: Candidates = FLAGS.filter((flag) => flag.kind !== 'organisatie').map((flag) => ({
  id: flag.code,
  names: [flag.name, ...(flag.aliases ?? [])],
}));

/** Countries and territories with a shape on the map; organisations have none. */
function selectCountries(setup: FlagSetup): FlagEntry[] {
  return selectFlags({ ...setup, organisations: false }).filter(
    (flag) => flag.code in ATLAS_SHAPES,
  );
}

function toQuestion(flag: FlagEntry, direction: Direction): Question {
  const id = direction === 'place' ? `${PLACE_PREFIX}${flag.code}` : flag.code;
  return { id, answer: flag.name, flag: flag.code };
}

const TAPPING: Tapping = {
  label: (question) => question.answer,
  maxHints: 3,
  wrongText: (id) =>
    T.countries.wrongPick(FLAG_BY_CODE.get(id.slice(PLACE_PREFIX.length))?.name ?? ''),
};

/** The map hands out flag codes; the round thinks in question ids. */
function tapFor(tap: TapState): TapState {
  return {
    ...tap,
    pick: (code) => tap.pick(`${PLACE_PREFIX}${code}`),
    picked: tap.picked.map((id) => id.slice(PLACE_PREFIX.length)),
  };
}

/** The map quiz: name the marked country, or find a named country on the map. */
export default function CountryQuiz() {
  const [direction, setDirection] = useState<Direction>(() =>
    readJson<Direction>(DIRECTION_KEY, 'name') === 'place' ? 'place' : 'name',
  );

  // Start fetching the map while the player is still on the setup screen.
  useEffect(() => {
    loadWorld().catch((error: unknown) => console.error(error));
  }, []);

  function choose(next: Direction) {
    setDirection(next);
    writeJson(DIRECTION_KEY, next);
  }

  return (
    <QuizFlow
      quiz="landen"
      title={T.quizzes.landen.title}
      select={selectCountries}
      extras={['microstates', 'disputed', 'territories']}
      unit={T.units.countries}
      before={
        <Panel title={T.countries.direction}>
          <ul className="divide-y divide-slate-200" role="radiogroup">
            <CheckRow
              radio
              on={direction === 'name'}
              label={T.countries.toName}
              detail={T.countries.toNameDetail}
              onClick={() => choose('name')}
            />
            <CheckRow
              radio
              on={direction === 'place'}
              label={T.countries.toPlace}
              detail={T.countries.toPlaceDetail}
              onClick={() => choose('place')}
            />
          </ul>
        </Panel>
      }
      questionsFor={(flags) => flags.map((flag) => toQuestion(flag, direction))}
      candidates={CANDIDATES}
      prompt={(question, tap) => {
        const code = question.flag!;
        if (direction === 'name') return <CountryMap key={question.id} code={code} />;
        const region = FLAG_BY_CODE.get(code)?.regions[0] ?? 'europa';
        return <TapMap key={question.id} code={code} region={region} tap={tapFor(tap)} />;
      }}
      placeholder={T.countries.placeholder}
      tapping={direction === 'place' ? TAPPING : undefined}
    />
  );
}
