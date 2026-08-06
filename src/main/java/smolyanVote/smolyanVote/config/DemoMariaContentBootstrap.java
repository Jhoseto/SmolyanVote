package smolyanVote.smolyanVote.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.MultiPollService;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.SimpleEventService;
import smolyanVote.smolyanVote.services.serviceImpl.ImageCloudinaryServiceImpl;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

/**
 * Seeds demo publications, simple events and multipolls for {@link DemoMariaTenevaBootstrap}.
 */
@Component
@Order(2)
public class DemoMariaContentBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoMariaContentBootstrap.class);

    private static final String IMG_BRIDGE = "seed/demo-content/bridge.jpg";
    private static final String IMG_BUDGET = "seed/demo-content/budget.jpg";
    private static final String IMG_TOURISM = "seed/demo-content/tourism.jpg";

    private final UserRepository userRepository;
    private final PublicationRepository publicationRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final MultiPollRepository multiPollRepository;
    private final PublicationService publicationService;
    private final SimpleEventService simpleEventService;
    private final MultiPollService multiPollService;
    private final ImageCloudinaryServiceImpl imageCloudinaryService;
    private final Environment environment;

    @Value("${smolyanvote.demo-users.seed-maria-content:true}")
    private boolean seedEnabled;

    public DemoMariaContentBootstrap(
            UserRepository userRepository,
            PublicationRepository publicationRepository,
            SimpleEventRepository simpleEventRepository,
            MultiPollRepository multiPollRepository,
            PublicationService publicationService,
            SimpleEventService simpleEventService,
            MultiPollService multiPollService,
            ImageCloudinaryServiceImpl imageCloudinaryService,
            Environment environment) {
        this.userRepository = userRepository;
        this.publicationRepository = publicationRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.multiPollRepository = multiPollRepository;
        this.publicationService = publicationService;
        this.simpleEventService = simpleEventService;
        this.multiPollService = multiPollService;
        this.imageCloudinaryService = imageCloudinaryService;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled || isProductionProfile()) {
            return;
        }

        UserEntity maria = userRepository
                .findByUsername(DemoMariaTenevaBootstrap.USERNAME)
                .or(() -> userRepository.findByEmail(DemoMariaTenevaBootstrap.EMAIL))
                .orElse(null);
        if (maria == null) {
            log.debug("Maria Teneva demo user not found — skipping content seed.");
            return;
        }

        runAs(maria, () -> {
            seedBridgeTopic(maria);
            seedBudgetTopic(maria);
            seedTourismTopic(maria);
        });

        log.info("Demo content for {} seeded (publications, events, polls with images).", DemoMariaTenevaBootstrap.USERNAME);
    }

    private void seedBridgeTopic(UserEntity maria) {
        String pubTitle = "45 дни без мост — какво означава това за ученици и работещи от околните села?";
        if (!hasPublication(maria, pubTitle)) {
            PublicationRequestDTO dto = new PublicationRequestDTO();
            dto.setTitle(pubTitle);
            dto.setCategory(CategoryEnum.MUNICIPAL);
            dto.setLinkUrl("https://www.bta.bg/bg/news/bulgaria/1178736-proekt-za-remont-na-most-mozhe-da-ostavi-blizo-20-naseleni-mesta-bez-pryaka-vraz");
            dto.setImageUrl(uploadPublicationImage(maria, IMG_BRIDGE));
            dto.setContent(
                    """
                    На среща, свикана от областния управител, стана ясно, че планираният ремонт на мост може \
                    да остави близо 20 населени места без пряка връзка със Смолян за около 45 дни.

                    Кметът на Смилян Чавдар Червенков предупреди, че около 80 деца всеки ден пътуват на училище \
                    в Смолян. За работещите хора и възрастните жители прекъсването не е „неудобство“ — \
                    то променя целия им ден.

                    Според мен общината и областната администрация трябва да гарантират поне един \
                    достъпен вариант: пешеходен коридор или пропускане на леки автомобили, докато тече ремонтът. \
                    Пълното затваряне без алтернатива не е приемливо.

                    Питам ви директно: живеете ли в засегнато село? Как бихте се справили 45 дни без директна \
                    връзка със Смолян? Споделете в коментарите — ще обобщя мнението и ще го изпратя като \
                    гражданско мнение.

                    Източник: БТА, 2026.
                    """);
            publicationService.create(dto, maria);
        }

        String eventTitle = "Подкрепяте ли задължителен алтернативен маршрут по време на ремонта на моста?";
        if (!hasSimpleEvent(maria, eventTitle)) {
            CreateEventView event = new CreateEventView();
            event.setTitle(eventTitle);
            event.setLocation(Locations.SMOLYAN);
            event.setDescription(
                    """
                    Областната администрация обсъжда ремонт, при който близо 20 населени места може да останат \
                    без директна връзка със Смолян. Кметът на Смилян настоява за пешеходен или лек автомобилен \
                    достъп, особено за ученици и работещи.

                    Вашият глас: трябва ли алтернативният маршрут да бъде задължително условие при одобряване \
                    на ремонта?
                    """);
            simpleEventService.createEvent(
                    event,
                    seedImageArray(IMG_BRIDGE),
                    "Да, задължително",
                    "Не, достатъчен е дългият обход",
                    "Нямам достатъчно информация");
        }

        String pollTitle = "Кой е най-засегнат от прекъсването на връзката със Смолян?";
        if (!hasMultiPoll(maria, pollTitle)) {
            CreateMultiPollView poll = new CreateMultiPollView();
            poll.setTitle(pollTitle);
            poll.setLocation(Locations.SMOLYAN);
            poll.setDescription(
                    """
                    При планирания 45-дневен ремонт на мост близо 20 села може да останат без директна връзка \
                    със Смолян. Според вас коя група е най-засегната?
                    """);
            poll.setOptions(List.of(
                    "Ученици и учители",
                    "Работещи ежедневно в Смолян",
                    "Възрастни и хронично болни",
                    "Туризъм и гости",
                    "Местен бизнес и доставки"));
            poll.setImage1(loadSeedImage(IMG_BRIDGE));
            multiPollService.createMultiPoll(poll);
        }
    }

    private void seedBudgetTopic(UserEntity maria) {
        String pubTitle = "Бюджетът вече е в евро — 5 въпроса, които задавам преди да приемем приоритетите за 2026";
        if (!hasPublication(maria, pubTitle)) {
            PublicationRequestDTO dto = new PublicationRequestDTO();
            dto.setTitle(pubTitle);
            dto.setCategory(CategoryEnum.MUNICIPAL);
            dto.setLinkUrl("https://www.smolyaninfo.com/2025/11/25/43-7-mln-evro-e-ramkata-na-proektobjudzheta-na-obshhina-smolyan-za-2026g/");
            dto.setImageUrl(uploadPublicationImage(maria, IMG_BUDGET));
            dto.setContent(
                    """
                    Проектобюджетът на Община Смолян за 2026 г. е 43,7 млн. € — първият ни бюджет в евро. \
                    Това е историческа стъпка, но и сериозен тест за прозрачност.

                    Ето 5 въпроса, които задавам като гражданка, преди да „приемем“ приоритетите наведнъж:

                    1. Кои капиталови проекти са с реален срок за 2026 г., а кои остават „на хартия“?
                    2. Как ще следим разходите в евро — ще има ли достъпен граждански отчет, не само PDF в сайта?
                    3. Новата такса смет „по брой потребители“ — кой печели и кой губи от промяната?
                    4. Колко от бюджета отива в малките населени места спрямо градския център?
                    5. Защо в София има „Решава София“, а при нас няма механизъм за директно гражданско предложение?

                    Вярвам, че SmolyanVote може да бъде мястото, където приоритетите се обсъждат преди да станат \
                    решение. Коментирайте — кой от тези 5 въпроса е най-важен за вас?

                    Източници: SmolyanInfo; Paragraf.bg (евро и такса смет).
                    """);
            publicationService.create(dto, maria);
        }

        String pollTitle = "Къде да отидат капиталовите разходи на общината през 2026?";
        if (!hasMultiPoll(maria, pollTitle)) {
            CreateMultiPollView poll = new CreateMultiPollView();
            poll.setTitle(pollTitle);
            poll.setLocation(Locations.SMOLYAN);
            poll.setDescription(
                    """
                    Проектобюджетът за 2026 г. (43,7 млн. €) поставя трудни избори. Ако вие разпределяхте \
                    капиталовите разходи, какво бихте приоритизирали?
                    """);
            poll.setOptions(List.of(
                    "Пътища и мостове",
                    "Детски и спортни площадки",
                    "Спортна инфраструктура",
                    "Култура и общностни центрове",
                    "Енергийна ефективност на сгради"));
            poll.setImage1(loadSeedImage(IMG_BUDGET));
            multiPollService.createMultiPoll(poll);
        }

        String eventTitle = "Подкрепяте ли такса смет „по потребител“, ако средствата остават в квартала?";
        if (!hasSimpleEvent(maria, eventTitle)) {
            CreateEventView event = new CreateEventView();
            event.setTitle(eventTitle);
            event.setLocation(Locations.SMOLYAN);
            event.setDescription(
                    """
                    Община Смолян обсъжда преструктуриране на такса смет — от обект към брой потребители. \
                    Кметът Мелемов заяви, че при преминаването към евро сумите ще се закръглят в полза на гражданите.

                    Въпросът е: подкрепяте ли модела „по потребител“, ако има гаранция, че събраните средства \
                    се инвестират обратно в същия квартал или село?
                    """);
            simpleEventService.createEvent(
                    event,
                    seedImageArray(IMG_BUDGET),
                    "Да, при локална отчетност",
                    "Не, предпочитам стария модел",
                    "Трябва първо публично обсъждане");
        }

        String civicPollTitle = "Коя идея бихте финансирали, ако имахме граждански бюджет в Смолян?";
        if (!hasMultiPoll(maria, civicPollTitle)) {
            CreateMultiPollView poll = new CreateMultiPollView();
            poll.setTitle(civicPollTitle);
            poll.setLocation(Locations.SMOLYAN);
            poll.setDescription(
                    """
                    В София гражданите гласуват проекти чрез „Решава София“. В Смолян такъв механизъм все още \
                    липсва. Ако имахме 200 000 лв. граждански бюджет, коя от тези идеи бихте избрали?
                    """);
            poll.setOptions(List.of(
                    "Осветление и безопасни пешеходни пътеки",
                    "Мобилен медицински кабинет за отдалечени села",
                    "Младежки coworking и учебна зона в центъра"));
            poll.setImage1(loadSeedImage(IMG_BUDGET));
            multiPollService.createMultiPoll(poll);
        }
    }

    private void seedTourismTopic(UserEntity maria) {
        String pubTitle = "Туризмът в Родопите 2026 — възможност или риск за местните цени?";
        if (!hasPublication(maria, pubTitle)) {
            PublicationRequestDTO dto = new PublicationRequestDTO();
            dto.setTitle(pubTitle);
            dto.setCategory(CategoryEnum.CULTURE);
            dto.setLinkUrl("https://www.bta.bg/bg/news/bulgaria/1118773-letniyat-sezon-v-pamporovo-shte-bade-otkrit-na-20-yuni-patniyat-dostap-do-kuror");
            dto.setImageUrl(uploadPublicationImage(maria, IMG_TOURISM));
            dto.setContent(
                    """
                    Лятният сезон в Пампорово стартира на 20 юни. Достъпът от Пловдив е нормален, но от Смолян \
                    — с обход и около 15 минути повече заради свлачището при „Райковски ливади“.

                    Секторът на хотелиерите предупреждава: разходите за персонал и доставки растат, а част от резервациите \
                    вече са отменени. От друга страна, отвореният граничен преход Рудозем–Ксанти носи надежда \
                    за повече гръцки туристи.

                    За нас, местните жители, туризмът не е само „икономика“ — той влияе на цените в магазините, \
                    на жилищния пазар и на ежедневния трафик.

                    Въпросът, който задавам: искаме ли all-season туризъм с устойчиви цени за местните, или \
                    кратък сезонен boom, който после оставя празни улици?

                    Какво мислите — възможност или риск? Споделете опит от вашия квартал или село.

                    Източник: БТА, 2026.
                    """);
            publicationService.create(dto, maria);
        }

        String pollTitle = "Кой туризъм предпочитате за региона Смолян?";
        if (!hasMultiPoll(maria, pollTitle)) {
            CreateMultiPollView poll = new CreateMultiPollView();
            poll.setTitle(pollTitle);
            poll.setLocation(Locations.SMOLYAN);
            poll.setDescription(
                    """
                    Родопите имат потенциал за различни модели на туризъм. Кой подход смятате, че носи най-голяма \
                    полза за местните общности през 2026 г.?
                    """);
            poll.setOptions(List.of(
                    "Планински и приключенски",
                    "Културен и традиционен",
                    "Гастро и локални продукти",
                    "Wellness и SPA",
                    "All-season (цялогодишен)"));
            poll.setImage1(loadSeedImage(IMG_TOURISM));
            multiPollService.createMultiPoll(poll);
        }
    }

    private String uploadPublicationImage(UserEntity user, String classpathResource) {
        try {
            MultipartFile file = loadSeedImage(classpathResource);
            if (file == null) {
                return null;
            }
            return imageCloudinaryService.savePublicationImage(file, user.getUsername());
        } catch (Exception e) {
            log.warn("Publication image upload skipped ({}): {}", classpathResource, e.getMessage());
            return null;
        }
    }

    private MultipartFile[] seedImageArray(String classpathResource) {
        MultipartFile file = loadSeedImage(classpathResource);
        return file != null ? new MultipartFile[] { file } : new MultipartFile[0];
    }

    private MultipartFile loadSeedImage(String classpathResource) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathResource);
            if (!resource.exists()) {
                log.warn("Demo seed image missing: {}", classpathResource);
                return null;
            }
            try (InputStream in = resource.getInputStream()) {
                byte[] bytes = in.readAllBytes();
                String filename = classpathResource.substring(classpathResource.lastIndexOf('/') + 1);
                return new DemoSeedMultipartFile(bytes, filename, "image/jpeg");
            }
        } catch (Exception e) {
            log.warn("Failed to load demo seed image {}: {}", classpathResource, e.getMessage());
            return null;
        }
    }

    private boolean hasPublication(UserEntity author, String title) {
        return publicationRepository.findByAuthorIdOrderByCreatedDesc(author.getId()).stream()
                .map(PublicationEntity::getTitle)
                .anyMatch(title::equals);
    }

    private boolean hasSimpleEvent(UserEntity author, String title) {
        return simpleEventRepository.findAllByCreatorName(author.getUsername()).stream()
                .map(SimpleEventEntity::getTitle)
                .anyMatch(title::equals);
    }

    private boolean hasMultiPoll(UserEntity author, String title) {
        return multiPollRepository.findAllByCreatorName(author.getUsername()).stream()
                .map(MultiPollEntity::getTitle)
                .anyMatch(title::equals);
    }

    private void runAs(UserEntity user, Runnable action) {
        SecurityContext previous = SecurityContextHolder.getContext();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
        SecurityContextHolder.setContext(context);
        try {
            action.run();
        } finally {
            SecurityContextHolder.setContext(previous);
        }
    }

    private boolean isProductionProfile() {
        return Arrays.stream(environment.getActiveProfiles()).anyMatch("prod"::equalsIgnoreCase);
    }
}
