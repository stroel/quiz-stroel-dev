import { useState } from 'react';

import Icon from '@/components/Icon';
import Panel from '@/components/Panel';
import CheckRow from '@/components/quiz/CheckRow';
import QuizFlow from '@/components/quiz/QuizFlow';
import { QUOTE_GROUPS, QUOTES, type Quote, type QuoteGroup } from '@/data/quotes';
import { T } from '@/i18n/nl';
import type { Candidates, Question } from '@/lib/question';
import { readJson, writeJson } from '@/lib/storage';

const GROUPS_KEY = 'quiz:citaten:groups';

// Long enough to recognise the quote in the results list, short enough for one or two lines.
const LABEL_LENGTH = 60;

const BY_ID = new Map(QUOTES.map((quote) => [quote.id, quote]));

// Every answer in the dataset, so a near-miss on another person is still caught.
// One person with five quotes is five candidates with the same names: the
// matcher accepts a tie.
const CANDIDATES: Candidates = QUOTES.map((quote) => ({
  id: quote.id,
  names: [quote.by, ...(quote.also ?? [])],
}));

// A few names per series, to show what it holds.
function examples(group: QuoteGroup): string {
  return [...new Set(QUOTES.filter((quote) => quote.group === group).map((quote) => quote.by))]
    .slice(0, 3)
    .join(', ');
}

function shorten(text: string): string {
  return text.length <= LABEL_LENGTH ? text : `${text.slice(0, LABEL_LENGTH - 1).trimEnd()}…`;
}

function toQuestion(quote: Quote): Question {
  return {
    id: quote.id,
    answer: quote.by,
    label: `${quote.by}: ${shorten(quote.text)}`,
    note: T.quotes.note(quote.year, quote.context),
  };
}

function QuotePrompt({ quote }: { quote: Quote }) {
  return (
    <figure className="flex max-w-2xl flex-col items-center gap-4 text-center">
      <Icon name="quote" className="h-8 w-8 text-slate-400" />
      <blockquote lang={quote.lang} className="text-2xl font-semibold tracking-tight md:text-3xl">
        {quote.text}
      </blockquote>
      {quote.translation && <p className="text-slate-500">{quote.translation}</p>}
    </figure>
  );
}

/** Quotes: read what was said, type who said it (or the film or series it is from). */
export default function QuoteQuiz() {
  const [groups, setGroups] = useState<QuoteGroup[]>(() => {
    const saved = readJson<QuoteGroup[]>(GROUPS_KEY, QUOTE_GROUPS);
    return Array.isArray(saved)
      ? saved.filter((group) => QUOTE_GROUPS.includes(group))
      : QUOTE_GROUPS;
  });

  function toggle(group: QuoteGroup) {
    const next = groups.includes(group)
      ? groups.filter((g) => g !== group)
      : QUOTE_GROUPS.filter((g) => g === group || groups.includes(g));
    setGroups(next);
    writeJson(GROUPS_KEY, next);
  }

  return (
    <QuizFlow
      quiz="citaten"
      overview="/citaten/overzicht/"
      title={T.quizzes.citaten.title}
      select={() => QUOTES.filter((quote) => groups.includes(quote.group))}
      regions={false}
      extras={[]}
      unit={T.units.quotes}
      before={
        <Panel title={T.quotes.groupsTitle}>
          <ul className="divide-y divide-slate-200">
            {QUOTE_GROUPS.map((group) => (
              <CheckRow
                key={group}
                on={groups.includes(group)}
                label={T.quotes.groups[group]}
                detail={examples(group)}
                count={QUOTES.filter((quote) => quote.group === group).length}
                onClick={() => toggle(group)}
              />
            ))}
          </ul>
        </Panel>
      }
      questionsFor={(quotes) => quotes.map(toQuestion)}
      candidates={CANDIDATES}
      prompt={(question) => <QuotePrompt quote={BY_ID.get(question.id)!} />}
      placeholder={(question) => T.quotes.placeholder[BY_ID.get(question.id)!.kind]}
    />
  );
}
