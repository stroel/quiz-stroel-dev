import { useState } from 'react';

import FlagResults from '@/components/flags/FlagResults';
import FlagRound from '@/components/flags/FlagRound';
import FlagSetup from '@/components/flags/FlagSetup';
import { REGIONS, type FlagEntry } from '@/data/flags';
import { drawFlags, shuffle, type FlagSetup as Setup } from '@/lib/flag-pool';
import { recordResults, type QuestionResult } from '@/lib/history';
import { readJson, writeJson } from '@/lib/storage';

const QUIZ = 'vlaggen';
const SETUP_KEY = `quiz:${QUIZ}:setup`;

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
  | { name: 'round'; flags: FlagEntry[]; round: number }
  | { name: 'results'; flags: FlagEntry[]; results: QuestionResult[] };

/** The flag → country quiz: setup, a round of flags, then the results. */
export default function FlagQuiz() {
  const [setup, setSetup] = useState<Setup>(() => ({
    ...DEFAULT_SETUP,
    ...readJson<Partial<Setup>>(SETUP_KEY, {}),
  }));
  const [phase, setPhase] = useState<Phase>({ name: 'setup' });

  function start(flags: FlagEntry[]) {
    window.scrollTo(0, 0);
    // `round` remounts FlagRound even when the same flags are played again.
    setPhase((current) => ({
      name: 'round',
      flags,
      round: current.name === 'round' ? current.round + 1 : Date.now(),
    }));
  }

  function finish(flags: FlagEntry[], results: QuestionResult[]) {
    recordResults(QUIZ, results);
    window.scrollTo(0, 0);
    if (results.length === 0) setPhase({ name: 'setup' });
    else setPhase({ name: 'results', flags, results });
  }

  switch (phase.name) {
    case 'setup':
      return (
        <FlagSetup
          initial={setup}
          onStart={(chosen) => {
            setSetup(chosen);
            writeJson(SETUP_KEY, chosen);
            start(drawFlags(chosen));
          }}
        />
      );
    case 'round':
      return (
        <FlagRound
          key={phase.round}
          flags={phase.flags}
          timeLimit={setup.timer}
          onFinish={(results) => finish(phase.flags, results)}
        />
      );
    case 'results':
      return (
        <FlagResults
          flags={phase.flags}
          results={phase.results}
          onRetry={(flags) => start(shuffle(flags))}
          onAgain={() => setPhase({ name: 'setup' })}
        />
      );
  }
}
