import QuizFlow from '@/components/quiz/QuizFlow';
import { FLAGS, type FlagEntry } from '@/data/flags';
import { T } from '@/i18n/nl';
import { flagSrc, selectFlags } from '@/lib/flag-pool';
import type { Candidates, Question } from '@/lib/question';

// Every flag, not just this round's, so a near-miss on a flag outside the
// selection is still caught by the collision check.
const CANDIDATES: Candidates = FLAGS.map((flag) => ({
  id: flag.code,
  names: [flag.name, ...(flag.aliases ?? [])],
}));

function toQuestion(flag: FlagEntry): Question {
  return { id: flag.code, answer: flag.name, flag: flag.code };
}

/** The flag → country quiz. */
export default function FlagQuiz() {
  return (
    <QuizFlow
      quiz="vlaggen"
      overview="/vlaggen/overzicht/"
      title={T.quizzes.vlaggen.title}
      select={selectFlags}
      extras={['microstates', 'disputed', 'territories', 'organisations']}
      unit={T.units.flags}
      questionsFor={(flags) => flags.map(toQuestion)}
      candidates={CANDIDATES}
      prompt={(question) => (
        <img
          key={question.id}
          src={flagSrc(question.id)}
          alt={T.quiz.flagAlt}
          className="max-h-full min-h-0 max-w-full rounded object-contain shadow-md ring-1 ring-slate-900/10"
        />
      )}
      placeholder={T.quiz.placeholder}
    />
  );
}
