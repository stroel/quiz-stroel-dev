import { useState } from 'react';

import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import { T } from '@/i18n/nl';
import {
  capitalCandidates,
  capitalOf,
  capitalQuestion,
  countryOf,
  selectCapitals,
  type Direction,
} from '@/lib/capital-pool';
import { flagSrc } from '@/lib/flag-pool';
import type { Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';

const DIRECTION_KEY = 'quiz:hoofdsteden:direction';

function CapitalPrompt({ question, direction }: { question: Question; direction: Direction }) {
  const code = question.flag!;
  if (direction === 'country') {
    // No flag here: it would give the country away.
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-4xl font-bold tracking-tight">{capitalOf(code)!.name}</p>
        <p className="text-slate-500">{T.capitals.askCountry}</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 w-full flex-col items-center gap-4 text-center">
      <img
        src={flagSrc(code)}
        alt=""
        className="min-h-0 w-full max-w-xs rounded-sm object-contain shadow-md ring-1 ring-slate-900/10"
      />
      <div className="flex flex-col gap-1">
        <p className="text-slate-500">{T.capitals.askCapital}</p>
        <p className="text-4xl font-bold tracking-tight">{countryOf(code)!.name}?</p>
      </div>
    </div>
  );
}

/** Capitals: country → capital (the main mode), or capital → country. */
export default function CapitalQuiz() {
  const [direction, setDirection] = useState<Direction>(() =>
    readJson<Direction>(DIRECTION_KEY, 'capital') === 'country' ? 'country' : 'capital',
  );

  function choose(next: Direction) {
    setDirection(next);
    writeJson(DIRECTION_KEY, next);
  }

  return (
    <QuizFlow
      quiz="hoofdsteden"
      overview="/hoofdsteden/overzicht/"
      title={T.quizzes.hoofdsteden.title}
      select={(setup) => selectCapitals(setup, direction)}
      extras={['microstates', 'disputed', 'territories']}
      unit={T.units.countries}
      before={
        <Panel title={T.capitals.direction}>
          <ul className="divide-y divide-slate-200" role="radiogroup">
            <CheckRow
              radio
              on={direction === 'capital'}
              label={T.capitals.toCapital}
              detail={T.capitals.toCapitalDetail}
              onClick={() => choose('capital')}
            />
            <CheckRow
              radio
              on={direction === 'country'}
              label={T.capitals.toCountry}
              detail={T.capitals.toCountryDetail}
              onClick={() => choose('country')}
            />
          </ul>
        </Panel>
      }
      questionsFor={(flags) => flags.map((flag) => capitalQuestion(flag, direction))}
      candidates={capitalCandidates(direction)}
      prompt={(question) => <CapitalPrompt question={question} direction={direction} />}
      placeholder={
        direction === 'capital' ? T.capitals.placeholderCapital : T.capitals.placeholderCountry
      }
    />
  );
}
