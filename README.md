# 🗳️ SmolyanVote

![Java](https://img.shields.io/badge/Java-17-blue?logo=java) 
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.4-brightgreen?logo=springboot) 
![Thymeleaf](https://img.shields.io/badge/Thymeleaf-HTML-orange?logo=thymeleaf) 
![License](https://img.shields.io/badge/License-MIT-green) 
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-95%25-green)

---

## От Хората. За Хората. С мисъл За Града.

---

## 🚀 Използвани технологии и архитектура

Проектът **SmolyanVote** е реализиран като уеб-приложение на Java със **Spring Boot**.  
В главния клас се използват анотациите:

- `@SpringBootApplication`  
- `@EnableJpaRepositories`  
- `@EntityScan`

Те активират авто-конфигурацията на Spring Boot и показват, че проектът използва Spring Data JPA за достъп до база данни.

### Архитектура

SmolyanVote следва класическа многослойна архитектура (MVC):

| Слой               | Описание                     |
|--------------------|------------------------------|
| Представяне        | Controllers                  |
| Бизнес логика      | Services                    |
| Достъп до данни    | Repositories                |

---

## 🛠️ Технологии

- Spring Boot  
- Spring MVC  
- Spring Data JPA (Hibernate)  
- Spring Security  
- Thymeleaf (server-side шаблони)  
- CSS / HTML  

---

## 📦 Основни компоненти

### Контролери (Controllers):

- `EmailConfirmationController`
- `EventsController`
- `RegisterController`  
...и други.

### Репозитории (Repositories):

- `UserRepository`
- `EventRepository`
- `CommentsRepository`
- `VoteRepository`  
...и други.

### Сервизи (Services):

- `VoteService`
- `VoteServiceImpl`
- `UserServiceImpl`
- `EventServiceImpl`  
...и други.

### Шаблони (Thymeleaf):

HTML изгледи в `resources/templates`, напр.:

- `mainEventPage.html`  
- `eventDetailView.html`  
- `userProfile.html`  

### Модели и ентитети (Models):

- JPA ентитети като `User`, `Event`, `Comment`, `Vote` и други.  
- DTO и mapper-и (`services/Mappers`) за frontend показване.

---

## 🗃️ Модели на данни и обектна структура

| Модел     | Описание                                               |
|-----------|--------------------------------------------------------|
| `User`    | Потребителска информация (име, имейл, парола и др.)   |
| `Event`   | Изборно събитие или кампания                           |
| `Comment` | Коментари, свързани със събитие и потребител          |
| `Vote`    | Гласуване на потребител за опция                        |
| `VoteIP`  | Ограничение за многократно гласуване от един IP адрес |
| `BaseEntity` | Общ базов клас с ID и timestamps                      |

---

## 🔗 Контролери и REST маршрути

| Контролер                | Функция                                |
|-------------------------|---------------------------------------|
| `RegisterController`    | Регистрация на нов потребител          |
| `LoginController`       | Вход с персонализирана форма           |
| `EmailConfirmationController` | Потвърждение на имейл регистрация  |
| `EventsController`      | Показване на събития, гласуване, коментари |
| `MainController`        | Основна начална страница (`index.html`)  |

REST маршрутите използват Spring MVC анотации:

- `@GetMapping`  
- `@PostMapping`  
- `@ModelAttribute`  
- `@Valid`  

---

## 🔐 Сигурност и управление на потребители

- Защита на URL пътища (public vs protected) с Spring Security  
- Персонализирана логин форма (`/login`) с `permitAll()`  
- Създаване на сесия при успешен вход  
- `UserDetailsServiceImpl` зарежда потребители от базата данни  
- Роли: `ROLE_USER` и други  
- Поддръжка на logout с персонализирана логика  
- CSRF защита и HTTP security headers  
- Активация чрез имейл потвърждение  

---

## 🗳️ Логика на гласуване и коментари

- Всеки потребител може да гласува веднъж за дадено събитие  
- Използване на `VoteService` и `VoteRepository` за съхранение на гласове  
- `VoteIP` проверява за повторно гласуване от един и същ IP  
- Коментари реализирани с `CommentService` и `CommentRepository`  
- Thymeleaf фрагменти за списък с коментари  
- Форми и валидация чрез Spring Binding и JSR-303 анотации  

---

## 🖥️ Шаблони и фронтенд

Основни шаблони:

- `index.html` – начална страница  
- `mainEventPage.html` – списък с избори  
- `eventDetailView.html` – детайлно събитие  

Използване на:

- Thymeleaf фрагменти  
- CSS (включително Bootstrap)  
- HTML input полета с `th:field`, `th:if` и други атрибути  
- Валидирани съобщения в шаблоните  

---

## 📋 Обработка на форми и валидация

- HTML форми обработени чрез Spring MVC  
- JSR-303 анотации: `@NotNull`, `@Size`, `@Email` и др.  
- Използване на `@Valid` в контролерите + `BindingResult` за грешки  
- Примерни проверки: пароли, избор на опции, валидна регистрация  

---

## 🔗 Външни услуги и интеграции

- Имейл услуга чрез `EmailService`
- SendGrid / Mailjet  
- Възможности за OAuth и външни API интеграции  

---

## 🔮 Подобрение и бъдещи насоки

- REST API с JSON отговори за външни и мобилни клиенти  
- Мобилна версия / PWA с responsive дизайн  
- Графики с Chart.js / D3.js за визуализация на резултати  
- 2FA и мобилна верификация за подобрена сигурност  
- Международна поддръжка (i18n) – преводи на различни езици  
- Мониторинг с Spring Boot Actuator, ELK Stack и др.  
- CI/CD и тестове чрез Docker/Kubernetes и автоматизация  

---

## 🌟 PR/HR и Инвестиционна визия

### Приложение с мисия

SmolyanVote е създадено, за да подобри комуникацията между местната администрация и гражданите на Смолян.  
Платформата осигурява лесен достъп до информация, прозрачност и ангажираност на общността.

### Перспективи за разширение

- Мащабируемо  
- Сигурно  
- Гъвкаво за други региони и общини  

### Защо да инвестирате?

- Устойчив модел и сигурна архитектура  
- Широко приложение – включително за корпоративни анкети  
- Лесно надграждане с нови функционалности  
- Социална стойност – принос към демокрацията и гражданската активност  

### PR/HR възможности

- Вътрешни анкети за служители  
- Инициативи и кампании за ангажиране на екипи  
- Анонимна обратна връзка по важни теми  

---

## ❓ Защо SmolyanVote е различно?

- Прозрачност с проверка и валидиране на гласове  
- Сигурност: хеширане, роли и защита от уязвимости  
- Модерна архитектура: Spring Boot + JPA + Thymeleaf  
- Реално гражданско участие и платформа за местна демокрация  

---

> **SmolyanVote** – дигиталната платформа, която свързва хората с техния град.  

---

## 📂 Проектни ресурси

- [Документация](https://example.com/docs)  
- [Инсталация и настройка](https://example.com/install)  
- [Контакт](mailto:contact@smolyanvote.bg)

---

*Лиценз: MIT © 2025 SmolyanVote Team*

