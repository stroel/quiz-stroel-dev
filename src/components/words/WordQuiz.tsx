import { useState } from 'react';

import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import { T } from '@/i18n/nl';
import type { Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';
import {
  ALL_SERIES,
  promptText,
  questionsIn,
  SERIES_GROUPS,
  seriesExamples,
  toQuestion,
  WORD_BY_ID,
  WORD_CANDIDATES,
  WORD_QUESTIONS,
  type SeriesGroup,
  type WordSeries,
} from '@/lib/word-pool';

const SERIES_KEY = 'quiz:taal:series';

// A first visit plays the animals: the series the theme started from.
const DEFAULT_SERIES: WordSeries[] = [...SERIES_GROUPS.dieren];

function WordPrompt({ question }: { question: Question }) {
  const word = WORD_BY_ID.get(question.id)!;
  return (
    <div className="flex max-w-2xl flex-col items-center gap-2 text-center">
      <p className="text-slate-500">{word.ask}</p>
      <p lang={word.lang} className="text-4xl font-bold tracking-tight md:text-5xl">
        {promptText(word)}
      </p>
    </div>
  );
}

/** Language: animal names, spelling alphabets, sciences and phobias, counting words and Roman numerals. */
export default function WordQuiz() {
  const [series, setSeries] = useState<WordSeries[]>(() => {
    const saved = readJson<WordSeries[]>(SERIES_KEY, DEFAULT_SERIES);
    return Array.isArray(saved) ? saved.filter((s) => ALL_SERIES.includes(s)) : DEFAULT_SERIES;
  });

  function save(next: WordSeries[]) {
    // Kept in the order of the setup screen, whatever order they were ticked in.
    const ordered = ALL_SERIES.filter((s) => next.includes(s));
    setSeries(ordered);
    writeJson(SERIES_KEY, ordered);
  }

  function toggle(one: WordSeries) {
    save(series.includes(one) ? series.filter((s) => s !== one) : [...series, one]);
  }

  function toggleGroup(group: SeriesGroup) {
    const members: readonly WordSeries[] = SERIES_GROUPS[group];
    const allOn = members.every((s) => series.includes(s));
    save(allOn ? series.filter((s) => !members.includes(s)) : [...series, ...members]);
  }

  return (
    <QuizFlow
      quiz="taal"
      overview="/taal/overzicht/"
      title={T.quizzes.taal.title}
      select={() => WORD_QUESTIONS.filter((word) => series.includes(word.series))}
      regions={false}
      extras={[]}
      unit={T.units.questions}
      before={(Object.keys(SERIES_GROUPS) as SeriesGroup[]).map((group) => {
        const members: readonly WordSeries[] = SERIES_GROUPS[group];
        const allOn = members.every((s) => series.includes(s));
        return (
          <Panel
            key={group}
            title={T.language.groups[group]}
            action={
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="text-accent-800 -mr-2 h-10 px-2 text-sm font-semibold"
              >
                {allOn ? T.setup.none : T.setup.all}
              </button>
            }
          >
            <ul className="divide-y divide-slate-200">
              {members.map((one) => (
                <CheckRow
                  key={one}
                  on={series.includes(one)}
                  label={T.language.series[one]}
                  detail={seriesExamples(one)}
                  count={questionsIn(one).length}
                  onClick={() => toggle(one)}
                />
              ))}
            </ul>
          </Panel>
        );
      })}
      questionsFor={(words) => words.map(toQuestion)}
      candidates={WORD_CANDIDATES}
      prompt={(question) => <WordPrompt question={question} />}
      placeholder={(question) => T.language.placeholder[WORD_BY_ID.get(question.id)!.series]}
    />
  );
}
