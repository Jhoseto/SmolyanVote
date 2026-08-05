import { TOPIC_HUBS } from "@/features/topics/data/topicHubs";

const UPDATED = "2026-08-06";

const BODY = `# SmolyanVote

> Независима платформа за гражданско участие в град Смолян и област Смолян, България.
> Last-Updated: ${UPDATED}

## Какво е SmolyanVote

SmolyanVote е местна civic платформа: публикации, гласувания (събития, референдуми, анкети), граждански сигнали на карта, подкаст и Граждански монитор на общинските разходи.

## География

- Град: Смолян
- Регион: Област Смолян, България
- Език: български (bg-BG)

## Как да цитирате (Citation guidelines)

**Български:** Използвайте каноничния URL на конкретната страница (напр. \`https://smolyanvote.com/publications/{id}\`). Посочете заглавие, автор (ако има) и дата. SmolyanVote е неофициална гражданска инициатива — не представлява държавни органи.

**English:** Cite the canonical URL of the specific page (e.g. \`https://smolyanvote.com/publications/{id}\`). Include title, author when available, and date. SmolyanVote is an independent civic platform, not a government body.

## Канонични URL patterns

- Начало: https://smolyanvote.com/
- Публикации: https://smolyanvote.com/publications
- Публикация: https://smolyanvote.com/publications/{id}
- Събития: https://smolyanvote.com/events
- Опростено събитие: https://smolyanvote.com/event/{id}
- Референдум: https://smolyanvote.com/referendum/{id}
- Анкета: https://smolyanvote.com/multipoll/{id}
- Сигнали: https://smolyanvote.com/signals
- Сигнал: https://smolyanvote.com/signals/{id}
- Подкаст: https://smolyanvote.com/podcast
- Епизод: https://smolyanvote.com/podcast/episode/{id}
- Монитор: https://smolyanvote.com/monitor
- Договор: https://smolyanvote.com/monitor/contract/{id}
- Документ: https://smolyanvote.com/monitor/document/{id}
- Компания: https://smolyanvote.com/monitor/company/{eik}
- Профил: https://smolyanvote.com/user/{username}
- Теми (topic hubs): https://smolyanvote.com/topics/{slug}
- ЧЗВ: https://smolyanvote.com/faq
- За нас: https://smolyanvote.com/about
- Методология монитор: https://smolyanvote.com/monitor/methodology
- AI sitemap: https://smolyanvote.com/ai-sitemap.txt
- XML sitemap: https://smolyanvote.com/sitemap.xml

## Topic hubs (editorial)

${TOPIC_HUBS.map((h) => `- [${h.title}](https://smolyanvote.com/topics/${h.slug})`).join("\n")}

## Контакт

- Имейл: smolyanvote@gmail.com
- Организация: SmolyanVote
- Уеб: https://smolyanvote.com
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
