import { AnswerFirstBlock } from "@/lib/seo/components/AnswerFirstBlock";

export function MonitorSeoIntro({ title, answerFirst }: { title: string; answerFirst: string }) {
  return (
    <section className="sr-only" aria-label={title}>
      <h1>{title}</h1>
      <AnswerFirstBlock>{answerFirst}</AnswerFirstBlock>
    </section>
  );
}
