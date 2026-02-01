# Анализ: Входящи обаждания – аномалии и бугове

Този документ описва **откъде идват** проблемите с входящите обаждания в мобилното приложение, **без** да се пипа код. Цел: ясна картина преди корекции.

---

## 1. Две различни версии на екрана за входящо обаждане

В системата съществуват **два отделни UI-а** за входящо обаждане:

| Екран | Технология | Кога се показва | Файл |
|-------|------------|-----------------|------|
| **IncomingCallActivity** | Native Android (Kotlin) | Когато FCM получи `INCOMING_CALL` → стартира се **IncomingCallService** → директно се отваря тази Activity (Full Screen Intent). Винаги при входящо обаждане, особено когато приложението е затворено/в бекграунд. | `android/.../IncomingCallActivity.kt` |
| **IncomingCallScreen** | React Native | Показва се като **overlay** в `AppNavigator`, когато `showCallScreen && isRinging` (т.е. `currentCall` е сетнат и `isRinging === true`). | `src/screens/calls/IncomingCallScreen.tsx` |

**Последователност при потребителско действие:**

1. Входящо обаждане → FCM → **IncomingCallService** → отваря се **IncomingCallActivity** (нативен екран).
2. Потребителят натиска **„Приеми“** в нативния екран.
3. IncomingCallActivity затваря се, стартира се **MainActivity** с intent `action=accept_call`.
4. MainActivity изпраща към React Native събитие **`IncomingCallAction`** с `action: 'accept_call'`.
5. В **usePushNotifications** listener-ът:
   - извиква `setIncomingCall(...)` (ако `currentCall` е бил null) → в store-а се сетват `currentCall` и `isRinging: true`;
   - веднага след това извиква **`answerCall()`**.
6. **AppNavigator** вече има `isRinging === true` → показва **IncomingCallScreen** (React) като overlay.

Така потребителят вижда **първо нативния екран**, после **втори екран** – React „Входящо обаждане...“ с бутони „Приеми“/„Откажи“. Това е източникът на объркването „два екрана“.

---

## 2. Защо нативният екран изглежда „свит“ (schupen)

- **IncomingCallActivity** строи UI-а **програмно** в `createCallUI()`: `LinearLayout`, `RelativeLayout`, фиксирани размери в `dpToPx()` (напр. аватар 160dp, бутони 88dp), padding 24/40dp.
- Няма адаптация за:
  - различни размери на екрана (малки телефони, таблети);
  - notch / status bar / навигационна лента;
  - системен font/display scaling.
- Липсва изрично използване на `WindowInsets` или constraint-и за безопасни зони, което при някои устройства води до „свит“, претъпкан или отрязан вид.

Ефектът „свит“ идва от **един и същ** източник: само native layout в `IncomingCallActivity.kt` без responsive дизайн.

---

## 3. Защо от другата страна продължава да звъни (accept не стига до подателя)

При натискане на **„Приеми“** в **нативния** екран се случва следното:

1. **IncomingCallActivity** → `startActivity(MainActivity)` с `action=accept_call`, после `finish()`.
2. **MainActivity** → `handleIncomingCallAction()` → `emit("IncomingCallAction", { action: 'accept_call', conversationId, participantId })`.
3. В **usePushNotifications** (React):
   - първо се извиква `setIncomingCall(...)` → Zustand store се обновява (**currentCall** и **isRinging: true**);
   - **в същия синхронен call stack** се извиква **`answerCall()`**.

**Проблемът:**  
`answerCall()` е **handleAnswerCall** от `useCalls.ts`. Той е дефиниран с `useCallback` и затваря **`currentCall`** и **`isRinging`** от **момента на последния render**. Когато event-ът пристигне:

- Store-ът вече е обновен (има текущо обаждане и `isRinging: true`).
- React **още не е направил re-render**.
- Извикваният **handleAnswerCall** е от **предишния** render → в него **currentCall** и **isRinging** са още **старите** стойности (напр. `null` и `false`).

В началото на **handleAnswerCall** има проверка:

```ts
if (!currentCall || !isRinging) {
  logger.warn('⚠️ Cannot answer - no incoming call');
  return;
}
```

С тези „стари“ стойности условието е истина → функцията **излиза без да прави нищо** → **CALL_ACCEPT** никога не се изпраща по WebSocket → подателят не получава сигнал за приемане и звъненето продължава.

Ако потребителят после натисне **„Приеми“** и на **втория** (React) екран, тогава вече е минал re-render, `handleAnswerCall` вижда правилните `currentCall` и `isRinging` и тогава **CALL_ACCEPT** може да се изпрати. Това обяснява защо понякога „работи на втори път“.

**Корен на проблема:** извикване на **answerCall()** (което разчита на React state/closure) **веднага след** `setIncomingCall()` в един и същ event handler, преди React да е обновил компонентите и closure-ите.

---

## 4. Обобщение на източниците на аномалиите

| Симптом | Причина | Къде се получава |
|--------|---------|-------------------|
| Два различни екрана за входящо | 1) Native **IncomingCallActivity** (FCM/Service). 2) React **IncomingCallScreen** (overlay при `isRinging`). След Accept на нативния се отваря MainActivity, сетва се `isRinging` и се показва вторият екран. | FCM → IncomingCallService → IncomingCallActivity; после MainActivity → IncomingCallAction → setIncomingCall → AppNavigator overlay. |
| Нативният екран изглежда свит | Фиксирани размери и padding, без responsive/insets handling в **IncomingCallActivity** `createCallUI()`. | `IncomingCallActivity.kt` – layout. |
| Подателят продължава да чува звънене | **answerCall()** се извиква в същия тик като **setIncomingCall()** и използва **stale closure** (стари `currentCall`/`isRinging`) → ранно `return` → **CALL_ACCEPT** не се изпраща. | `usePushNotifications.ts` – IncomingCallAction listener; `useCalls.ts` – handleAnswerCall и неговата зависимост от state. |

---

## 5. Допълнителни бележки (без да пипаме код)

- **Един или два екрана:** Архитектурно решението е да има един каноничен източник за „входящо обаждане“ UI – или само native (когато app е затворен/background), или само React overlay (когато app е отворен), или ясно разделение по app state, така че да не се показват двата един след друг при един и същ accept.
- **Accept да стига до подателя:** Accept логиката трябва да не зависи от React state в момента на event-а – напр. да се изпраща **CALL_ACCEPT** въз основа на данни от **event-а** или директно от **store** (getState()) в момента на извикване, а не от closure в **handleAnswerCall**.
- **Нативен layout:** Подобрение на „свития“ вид изисква преглед на **IncomingCallActivity** (размери, padding, insets, различни екрани).

Този документ служи като основа за следващи решения и корекции в кода.
