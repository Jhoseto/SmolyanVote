const BODY = `# SmolyanVote

> Независима платформа за гражданско участие в град Смолян и област Смолян, България.

## Какво е SmolyanVote
SmolyanVote е местна социална и civic платформа: публикации (новини и мнения), гласувания (събития, референдуми, анкети), сигнали на карта, подкаст и дискусии между жители.

## География
- Град: Смолян
- Регион: Област Смолян, България
- Език на съдържанието: български (bg-BG)

## Канонични URL шаблони
- Начало: https://smolyanvote.com/
- Публикации (лента): https://smolyanvote.com/publications
- Единична публикация (цитируема): https://smolyanvote.com/publications/{id}
- Профил: https://smolyanvote.com/user/{username}
- Събития / гласуване: https://smolyanvote.com/events
- Сигнали: https://smolyanvote.com/signals
- Подкаст: https://smolyanvote.com/podcast

## Как да цитирате
Използвайте стабилния URL \`/publications/{id}\` за конкретна публикация. Заглавието, авторът и датата са в HTML и JSON-LD (SocialMediaPosting). Не разчитайте само на \`?openModal=\` query параметри — те са за UI, не за каноничен адрес.

## Контакт
- Сайт: https://smolyanvote.com/contacts
- Организация: SmolyanVote
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
