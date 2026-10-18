import { useState, type ReactNode } from 'react';

import QuizResults from '@/components/quiz/QuizResults';
import QuizRound from '@/components/quiz/QuizRound';
import QuizSetup, { type ExtraKey } from '@/components/quiz/QuizSetup';
import { REGIONS, type FlagEntry } from '@/data/flags';
import { shuffle, type FlagSetup as Setup } from '@/lib/flag-pool';
import { recordResults, type QuestionResult } from '@/lib/history';
import type { Candidates, Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';

const DEFAULT_SETUP: Setup = {
  regions: [...REGIONS],
  microstates: false,
  disputed: false,
  territories: false,
  organisations: false,
  count: null,
  timer: null,
};

type Phase =
  | { name: 'setup' }
  | { name: 'round'; questions: Question[]; round: number }
  | { name: 'results'; questions: Question[]; results: QuestionResult[] };

/**
 * A whole typed-answer quiz: setup, a round, then the results, with the setup
 * remembered and every round written to the history. The quiz itself only says
 * what it selects, how a selection becomes questions, and how a question looks.
 */
export default function QuizFlow({
  quiz,
  title,
  select,
  extras,
  unit,
  before,
  overview,
  questionsFor,
  candidates,
  prompt,
  placeholder,
}: {
  /** Key in localStorage: `quiz:<quiz>:setup` and `quiz:<quiz>:history`. */
  quiz: string;
  title: string;
  select: (setup: Setup) => FlagEntry[];
  extras: ExtraKey[];
  unit: (count: number) => string;
  before?: ReactNode;
  overview?: string;
  questionsFor: (entries: FlagEntry[]) => Question[];
  candidates: Candidates;
  prompt: (question: Question) => ReactNode;
  placeholder: string;
}) {
  const setupKey = `quiz:${quiz}:setup`;
  const [setup, setSetup] = useState<Setup>(() => ({
    ...DEFAULT_SETUP,
    ...readJson<Partial<Setup>>(setupKey, {}),
  }));
  const [phase, setPhase] = useState<Phase>({ name: 'setup' });

  function start(questions: Question[]) {
    window.scrollTo(0, 0);
    // `round` remounts the round even when the same questions are played again.
    setPhase((current) => ({
      name: 'round',
      questions,
      round: current.name === 'round' ? current.round + 1 : Date.now(),
    }));
  }

  function finish(questions: Question[], results: QuestionResult[]) {
    recordResults(quiz, results);
    window.scrollTo(0, 0);
    if (results.length === 0) setPhase({ name: 'setup' });
    else setPhase({ name: 'results', questions, results });
  }

  switch (phase.name) {
    case 'setup':
      return (
        <QuizSetup
          title={title}
          initial={setup}
          select={select}
          extras={extras}
          unit={unit}
          before={before}
          {...(overview && { overview })}
          onStart={(chosen) => {
            setSetup(chosen);
            writeJson(setupKey, chosen);
            const drawn = shuffle(select(chosen));
            start(questionsFor(chosen.count === null ? drawn : drawn.slice(0, chosen.count)));
          }}
        />
      );
    case 'round':
      return (
        <QuizRound
          key={phase.round}
          questions={phase.questions}
          candidates={candidates}
          prompt={prompt}
          placeholder={placeholder}
          timeLimit={setup.timer}
          onFinish={(results) => finish(phase.questions, results)}
        />
      );
    case 'results':
      return (
        <QuizResults
          questions={phase.questions}
          results={phase.results}
          onRetry={(questions) => start(shuffle(questions))}
          onAgain={() => setPhase({ name: 'setup' })}
        />
      );
  }
}
