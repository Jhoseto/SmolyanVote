import Link from "next/link";
import { Container } from "@/shared/ui";
import { TermsSection } from "./TermsSection";
import { TermsToc } from "./TermsToc";

/** 1:1 content parity with v1 `terms-and-conditions.html`. */
export function TermsAndConditions() {
  return (
    <Container className="py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-[240px_1fr] md:items-start">
        <div className="md:sticky md:top-[calc(var(--navbar-height)+20px)]">
          <TermsToc />
        </div>

        <div className="min-w-0">
          <article>
            <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-bold text-[color:var(--color-text-heading)]">
              УСЛОВИЯ ЗА ПОЛЗВАНЕ (SmolyanVote.com)
            </h1>
            <p className="mt-2 text-sm font-semibold text-[color:var(--color-text-muted)]">
              Последна актуализация: 30.06.2025г.
            </p>

            <div className="mt-6 divide-y divide-border-default/60">
              <TermsSection id="general" title="1. ОБЩИ ПОЛОЖЕНИЯ">
                <p>
                  <strong>1.1.</strong> Този документ урежда условията за използване на интернет платформата
                  SmolyanVote.com (наричана по-долу &bdquo;Платформата&rdquo;), която представлява неофициална
                  гражданска инициатива за споделяне на обществено мнение относно регионални въпроси в област
                  Смолян.
                </p>
                <p>
                  <strong>1.2.</strong> Платформата не е свързана с държавни или общински органи и не представлява
                  официален канал за провеждане на избори, референдуми или събиране на подписи с правна тежест.
                </p>
                <p>
                  <strong>1.3.</strong> Всички изразени мнения и резултати от гласувания в платформата са с
                  неофициален и информативен характер и не подлежат на използване като официална обществена
                  позиция или институционален резултат.
                </p>
                <p>
                  <strong>1.4.</strong> С достъпа и използването на сайта Вие приемате настоящите условия. Ако не
                  сте съгласни с тях, моля, не използвайте Платформата.
                </p>
              </TermsSection>

              <TermsSection id="registration" title="2. РЕГИСТРАЦИЯ И ДОСТЪП ДО УСЛУГИТЕ">
                <p>
                  <strong>2.1.</strong> Достъпът до определени функционалности на Платформата изисква регистрация
                  с валиден имейл адрес и силна парола, съдържаща малки и големи букви, цифри и символи.
                </p>
                <p>
                  <strong>2.2.</strong> Паролите се съхраняват в хеширан вид съгласно най-добрите практики за
                  информационна сигурност и изискванията на член 32 от Регламент (ЕС) 2016/679 (GDPR).
                </p>
                <p>
                  <strong>2.3.</strong> Имейлът се използва единствено за потвърждение на регистрацията,
                  комуникация с потребителя при необходимост и не се използва за маркетинг, освен при изрично
                  съгласие.
                </p>
                <p>
                  <strong>2.4.</strong> Потребителите имат право да създават следните видове събития:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Опростено събитие (гласуване с &bdquo;За&rdquo;, &bdquo;Против&rdquo; или &bdquo;Неутрален&rdquo;)</li>
                  <li>Референдум (до 10 опции, избира се 1)</li>
                  <li>Анкета с множествен избор (до 10 опции, максимум 3 избора)</li>
                  <li>Публикация (свободна форма, подобна на публикации в социални мрежи)</li>
                </ul>
                <p>
                  <strong>2.5.</strong> Потребителите могат да публикуват коментари под всяко събитие, като
                  отговарят за съдържанието им в съответствие с настоящите условия и закона.
                </p>
              </TermsSection>

              <TermsSection id="data-protection" title="3. ЗАЩИТА НА ЛИЧНИТЕ ДАННИ">
                <p>Вижте отделната секция Политика за поверителност по-долу.</p>
              </TermsSection>

              <TermsSection id="content-rules" title="4. ПРАВИЛА ЗА СЪДЪРЖАНИЕТО">
                <p>
                  <strong>4.1.</strong> Потребителите носят пълна отговорност за публикуваното от тях съдържание и
                  се задължават да не разпространяват информация, която:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Нарушава действащото българско законодателство</li>
                  <li>Подбужда към насилие, дискриминация или омраза</li>
                  <li>Включва обидно или клеветническо съдържание</li>
                  <li>Създава фалшиво впечатление за официална позиция или институционално становище</li>
                </ul>
                <p>
                  <strong>4.2.</strong> Администраторите могат по своя преценка да премахват или ограничават
                  достъпа до съдържание, което противоречи на горното.
                </p>
              </TermsSection>

              <TermsSection id="disclaimer" title="5. ОТКАЗ ОТ ОТГОВОРНОСТ">
                <p>
                  <strong>5.1.</strong> SmolyanVote.com е гражданска инициатива без правомощия на държавна или
                  общинска институция.
                </p>
                <p>
                  <strong>5.2.</strong> Всички резултати, анкети и публикации на платформата са с неофициален
                  характер и не пораждат правни последици.
                </p>
                <p>
                  <strong>5.3.</strong> Администраторите не носят отговорност за:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Действия на потребителите в резултат на информация от сайта</li>
                  <li>Точността и истинността на потребителски публикации</li>
                  <li>Прекъсвания на достъп или загуба на данни по технически причини</li>
                </ul>
              </TermsSection>

              <TermsSection id="intellectual-property" title="6. ИНТЕЛЕКТУАЛНА СОБСТВЕНОСТ">
                <p>
                  <strong>6.1.</strong> Всички елементи на платформата (код, дизайн, текстове, интерфейс) са
                  защитени от авторското право съгласно ЗАПСП.
                </p>
                <p>
                  <strong>6.2.</strong> Публикуваното от потребителите съдържание остава тяхна собственост, но чрез
                  качването му те предоставят неизключително, безсрочно, безвъзмездно и неотменимо право на
                  платформата да го показва публично.
                </p>
              </TermsSection>

              <TermsSection id="final-provisions" title="7. ЗАКЛЮЧИТЕЛНИ РАЗПОРЕДБИ">
                <p>
                  <strong>7.1.</strong> Платформата не е регистрирано търговско дружество, не генерира приходи и не
                  извършва стопанска дейност.
                </p>
                <p>
                  <strong>7.2.</strong> Настоящите условия могат да бъдат актуализирани по всяко време. При
                  значителни промени потребителите ще бъдат информирани чрез системно съобщение или по имейл.
                </p>
                <p>
                  <strong>7.3.</strong> Всички спорове, свързани с използването на платформата, се решават по реда
                  на действащото законодателство на Република България.
                </p>
              </TermsSection>
            </div>

            <div className="mt-6 rounded-[var(--radius-md)] bg-[color:var(--color-surface-light)] p-4 text-sm">
              <p>
                <strong>Контакт за въпроси:</strong>{" "}
                <a href="mailto:smolyanvote@gmail.com" className="text-primary underline">
                  smolyanvote@gmail.com
                </a>
              </p>
              <p className="mt-1">
                <strong>Контакт за защита на личните данни:</strong>{" "}
                <a href="mailto:smolyanvote@gmail.com" className="text-primary underline">
                  smolyanvote@gmail.com
                </a>
              </p>
            </div>
          </article>

          <hr className="my-10 border-border-default/60" />

          <article>
            <h1
              id="privacy"
              className="target-highlight text-[clamp(1.5rem,3.5vw,2rem)] font-bold text-[color:var(--color-text-heading)]"
            >
              ПОЛИТИКА ЗА ПОВЕРИТЕЛНОСТ (SmolyanVote.com)
            </h1>
            <p className="mt-2 text-sm font-semibold text-[color:var(--color-text-muted)]">
              Последна актуализация: 30.06.2025
            </p>

            <div className="mt-6 divide-y divide-border-default/60">
              <TermsSection title="1. Кой обработва Вашите лични данни?">
                <p>
                  Администратор на лични данни е гражданската инициатива зад SmolyanVote.com. Данните се съхраняват
                  и обработват единствено за целите, описани по-долу.
                </p>
              </TermsSection>

              <TermsSection title="2. Какви лични данни събираме?">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Имейл адрес (за регистрация и комуникация)</li>
                  <li>Хеширана парола</li>
                  <li>IP адрес</li>
                  <li>Псевдоним (потребителско име)</li>
                  <li>Профилна снимка (ако се качи доброволно)</li>
                  <li>Данни за действия в платформата: събития, гласувания, коментари</li>
                  <li>Бисквитки и логове от сесии</li>
                </ul>
              </TermsSection>

              <TermsSection title="3. С каква цел събираме лични данни?">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Регистрация и удостоверяване на потребител</li>
                  <li>Поддръжка на сигурността на платформата</li>
                  <li>Предотвратяване на злоупотреби и атаки</li>
                  <li>Статистически анализ (напр. чрез Google Analytics)</li>
                  <li>Комуникация с потребителя при нужда</li>
                </ul>
              </TermsSection>

              <TermsSection title="4. На какво правно основание?">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Член 6, параграф 1, буква а) GDPR – съгласие</li>
                  <li>Член 6, параграф 1, буква б) GDPR – изпълнение на договор</li>
                  <li>Член 6, параграф 1, буква е) GDPR – легитимен интерес за сигурност</li>
                </ul>
              </TermsSection>

              <TermsSection title="5. Колко дълго съхраняваме данните?">
                <ul className="list-disc space-y-1 pl-5">
                  <li>До закриване на акаунта</li>
                  <li>До упражняване на правото &bdquo;да бъдеш забравен&rdquo;</li>
                  <li>Максимум 5 години при липса на активност</li>
                </ul>
              </TermsSection>

              <TermsSection title="6. С кой може да се споделят данни?">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Не се споделят с трети лица, освен при законово изискване</li>
                  <li>Възможни са автоматични статистики с анонимизирани данни (напр. брой потребители)</li>
                </ul>
              </TermsSection>

              <TermsSection title="7. Как защитаваме данните?">
                <ul className="list-disc space-y-1 pl-5">
                  <li>SSL криптиране</li>
                  <li>Ограничен достъп до базата данни</li>
                  <li>Хеширане на паролите (необратимо)</li>
                  <li>Регулярни проверки за уязвимости</li>
                </ul>
              </TermsSection>

              <TermsSection title="8. Права на потребителите:">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Право на достъп до собствените данни</li>
                  <li>Право на корекция</li>
                  <li>Право на изтриване (&bdquo;да бъдеш забравен&rdquo;)</li>
                  <li>Право на ограничаване на обработката</li>
                  <li>Право на възражение срещу обработка</li>
                  <li>Право на преносимост на данни</li>
                  <li>
                    Право на жалба до КЗЛД (
                    <a
                      href="https://www.cpdp.bg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      www.cpdp.bg
                    </a>
                    )
                  </li>
                </ul>
              </TermsSection>

              <TermsSection id="cookies" title="9. Бисквитки (Cookies)">
                <p>SmolyanVote.com използва:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Сесийни бисквитки (необходими за вход и сигурност)</li>
                  <li>Аналитични бисквитки (Google Analytics, при съгласие)</li>
                </ul>
              </TermsSection>

              <TermsSection title="10. Контакт по въпросите на поверителността">
                <p>
                  Можете да се свържете с нас чрез{" "}
                  <Link href="/contacts" className="text-primary underline">
                    формата за контакти
                  </Link>{" "}
                  или на:{" "}
                  <a href="mailto:smolyanvote@gmail.com" className="text-primary underline">
                    smolyanvote@gmail.com
                  </a>
                  .
                </p>
                <p>Отговор ще получите в срок до 30 дни, съгласно чл. 12, пар. 3 от GDPR.</p>
              </TermsSection>
            </div>

            <p className="mt-6 text-sm font-semibold text-[color:var(--color-text-heading)]">
              Настоящата Политика за поверителност е неразделна част от Условията за ползване.
            </p>
          </article>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border-default/60 pt-6">
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              ← Към началната страница
            </Link>
            <Link href="/about" className="text-sm font-medium text-primary hover:underline">
              За нас →
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
