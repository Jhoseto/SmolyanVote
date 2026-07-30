/** Shared info copy for desktop accordion and mobile bottom sheet. */
export function SignalsInfoContent() {
  return (
    <div className="space-y-4 text-sm text-[color:var(--color-text-secondary)]">
      <section>
        <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Какво е това?</h3>
        <p>
          Тук подавате сигнал за проблем в Смолян — счупен тротоар, липсващо осветление, незаконно паркиране и др.
          Сигналът се показва на картата и става видим за всички съграждани.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Защо е важно?</h3>
        <p>
          Колективният глас привлича внимание към реални проблеми. Колкото повече хора подкрепят един сигнал, толкова
          по-висок става неговият приоритет — така най-спешните казуси излизат на преден план.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Как да подадеш сигнал</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Натисни „Подай сигнал“ и позволи достъп до локацията си (или избери точка на картата).</li>
          <li>Добави ясно заглавие, описание и категория.</li>
          <li>Прикачи снимка — силно помага за идентификация на проблема.</li>
        </ol>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Вдигане на приоритет</h3>
        <p>
          Вместо „харесване“, можеш да <strong>вдигнеш приоритета</strong> на сигнал, който смяташ за важен. Всеки
          сигнал има 3 нива — ниско, средно и високо — изчислени{" "}
          <strong>спрямо другите активни сигнали от същата категория</strong>.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Карта и списък</h3>
        <p>
          Превключи между картата и списъка отгоре. Докосни маркер или ред, за да видиш детайли. Сподели линка, за да
          ангажираш съседи.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Съвети за телефон</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Използвай GPS на открито за по-точна локация.</li>
          <li>Снимай проблема отблизо и отдалечено.</li>
          <li>Провери дали точката е в границите на област Смолян.</li>
        </ul>
      </section>
    </div>
  );
}
