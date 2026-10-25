import { useState } from 'react';

import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import { T } from '@/i18n/nl';
import {
  asksCountry,
  countryOf,
  DIRECTIONS,
  factCandidates,
  factQuestion,
  selectFacts,
  shownFor,
  type Direction,
} from '@/lib/fact-pool';
import { flagSrc } from '@/lib/flag-pool';
import type { Question } from '@/lib/question';
import { moveKey, readJson, writeJson } from '@/lib/storage';

const QUIZ = 'landenweetjes';
const DIRECTION_KEY = `quiz:${QUIZ}:direction`;

// The capitals quiz became this one (Steve, 25-10-2026). Its ids are kept, so
// its setup, direction and history move along the first time this loads.
function moveCapitalsQuiz() {
  for (const suffix of ['setup', 'direction', 'history']) {
    moveKey(`quiz:hoofdsteden:${suffix}`, `quiz:${QUIZ}:${suffix}`);
  }
}

function FactPrompt({ question, direction }: { question: Question; direction: Direction }) {
  const code = question.flag!;
  if (asksCountry(direction)) {
    // No flag here: it would give the country away.
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p
          className={
            direction === 'plate'
              ? 'rounded-[50%] border-4 border-slate-900 bg-white px-8 py-3 text-5xl font-bold tracking-wide'
              : 'text-4xl font-bold tracking-tight'
          }
        >
          {shownFor(code, direction)}
        </p>
        <p className="text-slate-500">{T.facts.askCountry[direction]}</p>
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
        <p className="text-slate-500">{T.facts.askAbout[direction]}</p>
        <p className="text-4xl font-bold tracking-tight">{countryOf(code)!.name}?</p>
      </div>
    </div>
  );
}

/** Country facts: capital, inhabitants, adjective and currency, or the country behind a capital, extension or plate. */
export default function FactQuiz() {
  // Runs before QuizFlow reads the setup: a parent's state starts before its children's.
  const [direction, setDirection] = useState<Direction>(() => {
    moveCapitalsQuiz();
    const saved = readJson<Direction>(DIRECTION_KEY, 'capital');
    return DIRECTIONS.includes(saved) ? saved : 'capital';
  });

  function choose(next: Direction) {
    setDirection(next);
    writeJson(DIRECTION_KEY, next);
  }

  return (
    <QuizFlow
      quiz={QUIZ}
      overview="/landenweetjes/overzicht/"
      title={T.quizzes.landenweetjes.title}
      select={(setup) => selectFacts(setup, direction)}
      extras={['microstates', 'disputed', 'territories']}
      unit={T.units.countries}
      before={
        <Panel title={T.facts.direction}>
          <ul className="divide-y divide-slate-200" role="radiogroup">
            {DIRECTIONS.map((option) => (
              <CheckRow
                key={option}
                radio
                on={direction === option}
                label={T.facts.options[option].label}
                detail={T.facts.options[option].detail}
                onClick={() => choose(option)}
              />
            ))}
          </ul>
        </Panel>
      }
      questionsFor={(flags) => flags.map((flag) => factQuestion(flag, direction))}
      candidates={factCandidates(direction)}
      prompt={(question) => <FactPrompt question={question} direction={direction} />}
      placeholder={T.facts.placeholder[direction]}
    />
  );
}
