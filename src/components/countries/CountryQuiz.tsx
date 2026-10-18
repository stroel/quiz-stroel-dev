import { useEffect } from 'react';

import CountryMap, { loadWorld } from '@/components/countries/CountryMap';
import QuizFlow from '@/components/quiz/QuizFlow';
import { ATLAS_SHAPES } from '@/data/atlas-shapes';
import { FLAGS, type FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';
import { selectFlags, type FlagSetup } from '@/lib/flag-pool';
import type { Candidates, Question } from '@/lib/question';

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

function toQuestion(flag: FlagEntry): Question {
  return { id: flag.code, answer: flag.name, flag: flag.code };
}

/** The map quiz: a country is filled in on the map, the player types its name. */
export default function CountryQuiz() {
  // Start fetching the map while the player is still on the setup screen.
  useEffect(() => {
    loadWorld().catch((error: unknown) => console.error(error));
  }, []);

  return (
    <QuizFlow
      quiz="landen"
      title={T.quizzes.landen.title}
      select={selectCountries}
      extras={['microstates', 'disputed', 'territories']}
      unit={T.units.countries}
      questionsFor={(flags) => flags.map(toQuestion)}
      candidates={CANDIDATES}
      prompt={(question) => <CountryMap key={question.id} code={question.id} />}
      placeholder={T.countries.placeholder}
    />
  );
}
