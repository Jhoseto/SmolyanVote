// ===== РЕАЛНИ ДАННИ ЗА СИГНАЛИ В СМОЛЯН =====

const SAMPLE_SIGNALS = [
    {
        id: 1,
        title: 'Голяма дупка на ул. Доктор Петър Берон',
        category: 'road_damage',
        description: 'Опасна дупка в средата на главната улица пред Lidl, която може да повреди автомобили. Дупката е дълбока около 30 см и широка 1 метър.',
        coordinates: [41.5766, 24.7014],
        urgency: 'high',
        reporter: 'Георги Петров',
        createdAt: '2025-01-15T10:30:00.000Z'
    },
    {
        id: 61,
        title: 'Дупки на главния път във Златоград',
        category: 'road_damage',
        description: 'На главната улица в Златоград има множество дупки, които затрудняват движението.',
        coordinates: [41.3824, 25.0944],
        urgency: 'medium',
        reporter: 'Златоградчани',
        createdAt: '2024-11-16T08:00:00.000Z'
    },
    {
        id: 62,
        title: 'Неработещо осветление в центъра на Рудозем',
        category: 'lighting',
        description: 'Уличното осветление в центъра на Рудозем не работи от дни.',
        coordinates: [41.4890, 24.8320],
        urgency: 'medium',
        reporter: 'Жители на Рудозем',
        createdAt: '2024-11-15T19:30:00.000Z'
    },
    {
        id: 63,
        title: 'Проблем с водопровода в Мадан',
        category: 'water_sewer',
        description: 'В центъра на Мадан водопроводът е аварийно, няма вода от сутринта.',
        coordinates: [41.4848, 24.9275],
        urgency: 'high',
        reporter: 'Общ Мадан',
        createdAt: '2024-11-14T07:30:00.000Z'
    },
    {
        id: 64,
        title: 'Замърсяване на реката в Девин',
        category: 'waste_management',
        description: 'Река Девинска е замърсена с отпадъци и пластмасови бутилки.',
        coordinates: [41.7421, 24.4017],
        urgency: 'medium',
        reporter: 'Еколози Девин',
        createdAt: '2024-11-13T14:20:00.000Z'
    },
    {
        id: 65,
        title: 'Счупен ски лифт в Чепеларе',
        category: 'public_transport',
        description: 'Ски лифтът в Чепеларе не работи поради техническа повреда.',
        coordinates: [41.7275, 24.6950],
        urgency: 'high',
        reporter: 'Ски курорт Чепеларе',
        createdAt: '2024-11-12T10:15:00.000Z'
    },
    {
        id: 66,
        title: 'Опасно дърво в Неделино',
        category: 'tree_issues',
        description: 'Голямо дърво се е наклонило опасно над главната улица в Неделино.',
        coordinates: [41.6830, 24.8730],
        urgency: 'high',
        reporter: 'Кметство Неделино',
        createdAt: '2024-11-11T12:45:00.000Z'
    },
    {
        id: 67,
        title: 'Препълнени контейнери в Ардино',
        category: 'waste_collection',
        description: 'Контейнерите за боклук в Ардино не се изпразват редовно.',
        coordinates: [41.5832, 25.1347],
        urgency: 'medium',
        reporter: 'Жители на Ардино',
        createdAt: '2024-11-10T16:00:00.000Z'
    },
    {
        id: 68,
        title: 'Неработещ семафор в Доспат',
        category: 'traffic_signs',
        description: 'Единственият семафор в Доспат не работи от седмици.',
        coordinates: [41.6389, 24.1583],
        urgency: 'medium',
        reporter: 'Местна полиция',
        createdAt: '2024-11-09T11:30:00.000Z'
    },
    {
        id: 69,
        title: 'Изоставени автомобили в Борино',
        category: 'abandoned_vehicles',
        description: 'В Борино има няколко изоставени автомобила по главната улица.',
        coordinates: [41.6167, 24.2833],
        urgency: 'low',
        reporter: 'Общинска администрация',
        createdAt: '2024-11-08T13:20:00.000Z'
    },
    {
        id: 70,
        title: 'Шум от каменна кариера край Рудозем',
        category: 'noise_pollution',
        description: 'Каменната кариера край Рудозем работи и през нощта, създавайки шум.',
        coordinates: [41.4750, 24.8500],
        urgency: 'medium',
        reporter: 'Съседни села',
        createdAt: '2024-11-07T22:00:00.000Z'
    },
    {
        id: 71,
        title: 'Липсва достъп за инвалиди в Златоград',
        category: 'accessibility',
        description: 'Общинската сграда в Златоград няма рампа за инвалидни колички.',
        coordinates: [41.3820, 25.0940],
        urgency: 'medium',
        reporter: 'Хора с увреждания',
        createdAt: '2024-11-06T15:45:00.000Z'
    },
    {
        id: 72,
        title: 'Вандализъм в парка на Девин',
        category: 'vandalism',
        description: 'Пейките в градския парк на Девин са изрисувани и счупени.',
        coordinates: [41.7400, 24.4000],
        urgency: 'low',
        reporter: 'Градинар',
        createdAt: '2024-11-05T09:10:00.000Z'
    },
    {
        id: 73,
        title: 'Протекъл водопровод в село Триград',
        category: 'water_sewer',
        description: 'В село Триград има голям протекъл водопровод на главния път.',
        coordinates: [41.6150, 24.3630],
        urgency: 'high',
        reporter: 'Кмет на село',
        createdAt: '2024-11-04T06:30:00.000Z'
    },
    {
        id: 74,
        title: 'Агресивни бездомни кучета в Мадан',
        category: 'stray_animals',
        description: 'В центъра на Мадан има група агресивни бездомни кучета.',
        coordinates: [41.4850, 24.9270],
        urgency: 'high',
        reporter: 'Граждани',
        createdAt: '2024-11-03T14:00:00.000Z'
    },
    {
        id: 75,
        title: 'Дупки на пътя към Ягодина',
        category: 'road_damage',
        description: 'Пътят от Борино към пещера Ягодина е в много лошо състояние.',
        coordinates: [41.6100, 24.3200],
        urgency: 'medium',
        reporter: 'Туроператори',
        createdAt: '2024-11-02T12:30:00.000Z'
    },
    {
        id: 76,
        title: 'Неработещи лампи на ски пистата в Чепеларе',
        category: 'lighting',
        description: 'Нощното осветление на ски пистата "Студенец" не работи.',
        coordinates: [41.7250, 24.6900],
        urgency: 'medium',
        reporter: 'Ски инструктори',
        createdAt: '2024-11-01T18:45:00.000Z'
    },
    {
        id: 77,
        title: 'Замърсяване от мина в Мадан',
        category: 'air_pollution',
        description: 'Миньорската дейност в Мадан създава прах и замърсява въздуха.',
        coordinates: [41.4900, 24.9350],
        urgency: 'medium',
        reporter: 'Местни жители',
        createdAt: '2024-10-31T16:20:00.000Z'
    },
    {
        id: 78,
        title: 'Обрушен мост в село Широка лъка',
        category: 'traffic_signs',
        description: 'Малкият мост в Широка лъка е частично обрушен и опасен.',
        coordinates: [41.6483, 24.6833],
        urgency: 'high',
        reporter: 'Селяни',
        createdAt: '2024-10-30T08:15:00.000Z'
    },
    {
        id: 79,
        title: 'Проблем с автобусния транспорт до Златоград',
        category: 'public_transport',
        description: 'Автобусът до Златоград закъснява постоянно с часове.',
        coordinates: [41.3800, 25.0900],
        urgency: 'medium',
        reporter: 'Пътници',
        createdAt: '2024-10-29T17:30:00.000Z'
    },
    {
        id: 80,
        title: 'Опасна детска площадка в Рудозем',
        category: 'playgrounds',
        description: 'Детската площадка в Рудозем има счупени съоръжения.',
        coordinates: [41.4880, 24.8310],
        urgency: 'high',
        reporter: 'Родители',
        createdAt: '2024-10-28T11:00:00.000Z'
    },
    {
        id: 31,
        title: 'Дупка на пътя към село Славейно',
        category: 'road_damage',
        description: 'На изхода към село Славейно има опасна дупка, която повредила няколко автомобила.',
        coordinates: [41.5810, 24.7070],
        urgency: 'high',
        reporter: 'Шофьор Петко',
        createdAt: '2024-12-16T14:20:00.000Z'
    },
    {
        id: 32,
        title: 'Неработещо осветление при автогарата Смолян',
        category: 'lighting',
        description: 'Осветлението около автогарата не работи, създавайки проблеми за пътниците вечер.',
        coordinates: [41.5745, 24.7041],
        urgency: 'medium',
        reporter: 'Автогара Смолян',
        createdAt: '2024-12-15T19:30:00.000Z'
    },
    {
        id: 33,
        title: 'Счупени стъпала при детската градина в кв. Райково',
        category: 'sidewalk_damage',
        description: 'Стъпалата пред детската градина в квартал Райково са счупени и хлъзгави.',
        coordinates: [41.5772, 24.7016],
        urgency: 'medium',
        reporter: 'Родители',
        createdAt: '2024-12-14T10:15:00.000Z'
    },
    {
        id: 34,
        title: 'Паднал знак "Внимание деца" при детска градина',
        category: 'traffic_signs',
        description: 'Пътният знак пред детската градина в кв. Устово е паднал и създава опасност.',
        coordinates: [41.5765, 24.6980],
        urgency: 'high',
        reporter: 'Директорка на градината',
        createdAt: '2024-12-13T08:45:00.000Z'
    },
    {
        id: 35,
        title: 'Протекъл водопровод при МБАЛ Смолян',
        category: 'water_sewer',
        description: 'Големи протечки пред болницата на бул. България създават локви и проблеми за пациентите.',
        coordinates: [41.5738, 24.7056],
        urgency: 'high',
        reporter: 'Болнично ръководство',
        createdAt: '2024-12-12T11:00:00.000Z'
    },
    {
        id: 36,
        title: 'Незаконно сметище в околностите на Смолян',
        category: 'illegal_dumping',
        description: 'Близо до квартал Райково има голямо незаконно сметище със строителни отпадъци.',
        coordinates: [41.5820, 24.6950],
        urgency: 'medium',
        reporter: 'Горски стопани',
        createdAt: '2024-12-11T16:30:00.000Z'
    },
    {
        id: 37,
        title: 'Опасен клон над детска градина в кв. Устово',
        category: 'tree_issues',
        description: 'Голям клон виси опасно над двора на детска градина в квартал Устово.',
        coordinates: [41.5763, 24.6978],
        urgency: 'high',
        reporter: 'Градинско ръководство',
        createdAt: '2024-12-10T09:20:00.000Z'
    },
    {
        id: 38,
        title: 'Замърсяване в жк "Епископ Константин"',
        category: 'air_pollution',
        description: 'Силен тютюнев мирис в жк "Епископ Константин" от близката цигарена фабрика.',
        coordinates: [41.5730, 24.7080],
        urgency: 'medium',
        reporter: 'Жители на квартала',
        createdAt: '2024-12-09T18:45:00.000Z'
    },
    {
        id: 39,
        title: 'Изоставена кола в центъра до общината',
        category: 'abandoned_vehicles',
        description: 'Стар Mercedes без регистрация паркиран пред общинската сграда от месеци.',
        coordinates: [41.5769, 24.7011],
        urgency: 'low',
        reporter: 'Общински служители',
        createdAt: '2024-12-08T13:15:00.000Z'
    },
    {
        id: 40,
        title: 'Неизпразени контейнери в жк "Устово"',
        category: 'waste_collection',
        description: 'В жк "Устово" контейнерите не се изпразват от седмица и боклукът се разсипва.',
        coordinates: [41.5718, 24.7058],
        urgency: 'high',
        reporter: 'Жители на Устово',
        createdAt: '2024-12-07T15:00:00.000Z'
    },
    {
        id: 41,
        title: 'Счупена люлка в детската площадка при спортния комплекс',
        category: 'playgrounds',
        description: 'Люлката в детската площадка при спортния комплекс е счупена и има остри метални части.',
        coordinates: [41.5785, 24.7025],
        urgency: 'high',
        reporter: 'Родители',
        createdAt: '2024-12-06T12:30:00.000Z'
    },
    {
        id: 42,
        title: 'Силен шум от нощни заведения в центъра',
        category: 'noise_pollution',
        description: 'Нощните заведения в центъра правят силен шум до късно и нарушават спокойствието.',
        coordinates: [41.5771, 24.7013],
        urgency: 'medium',
        reporter: 'Съседи',
        createdAt: '2024-12-05T02:15:00.000Z'
    },
    {
        id: 43,
        title: 'Няма рампи на централната поща',
        category: 'accessibility',
        description: 'Централната поща няма достъп за инвалидни колички - само стълби.',
        coordinates: [41.5767, 24.7009],
        urgency: 'medium',
        reporter: 'Хора с увреждания',
        createdAt: '2024-12-04T11:45:00.000Z'
    },
    {
        id: 44,
        title: 'Графити по сградата на общината',
        category: 'vandalism',
        description: 'Общинската сграда е изрисувана с графити и непристойни надписи.',
        coordinates: [41.5768, 24.7012],
        urgency: 'low',
        reporter: 'Общински служители',
        createdAt: '2024-12-03T14:20:00.000Z'
    },
    {
        id: 45,
        title: 'Аварийна канализация при спортния комплекс',
        category: 'water_sewer',
        description: 'Канализацията при спортния комплекс е аварийна и създава миризма.',
        coordinates: [41.5781, 24.7022],
        urgency: 'high',
        reporter: 'Спортен клуб',
        createdAt: '2024-12-02T10:00:00.000Z'
    },
    {
        id: 46,
        title: 'Наклонено дърво край СУ "Св. Св. Кирил и Методий"',
        category: 'tree_issues',
        description: 'Голямо дърво се е наклонило и заплашва да падне върху учебната сграда.',
        coordinates: [41.5779, 24.7001],
        urgency: 'high',
        reporter: 'Училищен директор',
        createdAt: '2024-12-01T07:30:00.000Z'
    },
    {
        id: 47,
        title: 'Неработещ семафор при Сводестия мост',
        category: 'traffic_signs',
        description: 'Семафорът при историческия Сводест мост не работи и създава задръствания.',
        coordinates: [41.5758, 24.7014],
        urgency: 'high',
        reporter: 'Пътна полиция',
        createdAt: '2024-11-30T16:45:00.000Z'
    },
    {
        id: 48,
        title: 'Агресивни улични кучета в близост до техникума',
        category: 'stray_animals',
        description: 'В района на професионалната гимназия има група от 4-5 агресивни бездомни кучета.',
        coordinates: [41.5750, 24.7035],
        urgency: 'high',
        reporter: 'Ученици',
        createdAt: '2024-11-29T08:15:00.000Z'
    },
    {
        id: 49,
        title: 'Счупен тротоар при банката в центъра',
        category: 'sidewalk_damage',
        description: 'Тротоарът пред банката в центъра е изцяло разрушен и опасен за пешеходци.',
        coordinates: [41.5766, 24.7007],
        urgency: 'medium',
        reporter: 'Банкови служители',
        createdAt: '2024-11-28T13:00:00.000Z'
    },
    {
        id: 50,
        title: 'Спрян автобусен транспорт до село Момчиловци',
        category: 'public_transport',
        description: 'Автобусната линия до село Момчиловци не работи от дни.',
        coordinates: [41.5748, 24.7026],
        urgency: 'medium',
        reporter: 'Селяни от Момчиловци',
        createdAt: '2024-11-27T09:30:00.000Z'
    },
    {
        id: 51,
        title: 'Замърсена река Арда от промишлени отпадъци',
        category: 'waste_management',
        description: 'Река Арда е замърсена с химикали от местната фабрика - водата е оцветена.',
        coordinates: [41.5755, 24.7017],
        urgency: 'high',
        reporter: 'Еколозите от Смолян',
        createdAt: '2024-11-26T14:45:00.000Z'
    },
    {
        id: 52,
        title: 'Липсващи предпазители в жилищен блок',
        category: 'security_issues',
        description: 'В жилищен блок в кв. Невяста липсват предпазни парапети на няколко балкона.',
        coordinates: [41.5722, 24.7062],
        urgency: 'high',
        reporter: 'Жилищна управа',
        createdAt: '2024-11-25T17:20:00.000Z'
    },
    {
        id: 53,
        title: 'Дупки на пътя към Рудозем',
        category: 'road_damage',
        description: 'На изхода към Рудозем има серия от дупки, които правят пътуването опасно.',
        coordinates: [41.5795, 24.6920],
        urgency: 'medium',
        reporter: 'Превозвачи',
        createdAt: '2024-11-24T11:10:00.000Z'
    },
    {
        id: 54,
        title: 'Неработещи лампи в подлеза при железопътната гара',
        category: 'lighting',
        description: 'Подлезът при железопътната гара е тъмен и опасен - всички лампи са счупени.',
        coordinates: [41.5740, 24.7047],
        urgency: 'medium',
        reporter: 'БДЖ служители',
        createdAt: '2024-11-23T20:00:00.000Z'
    },
    {
        id: 55,
        title: 'Изтичане на мазут в подземен гараж',
        category: 'security_issues',
        description: 'В подземния гараж под жилищен блок в кв. Устово изтича мазут и създава пожароопасност.',
        coordinates: [41.5726, 24.7068],
        urgency: 'high',
        reporter: 'Жители на блока',
        createdAt: '2024-11-22T15:30:00.000Z'
    },
    {
        id: 56,
        title: 'Прах от строителството на Retail Park',
        category: 'air_pollution',
        description: 'Строителството на Retail Park Smolyan създава много прах в целия квартал.',
        coordinates: [41.5775, 24.7040],
        urgency: 'low',
        reporter: 'Местни жители',
        createdAt: '2024-11-21T12:15:00.000Z'
    },
    {
        id: 57,
        title: 'Блокирана канализация при търговския център',
        category: 'water_sewer',
        description: 'Канализацията при търговския център е блокирана и създава наводнения.',
        coordinates: [41.5749, 24.7029],
        urgency: 'high',
        reporter: 'Търговци',
        createdAt: '2024-11-20T06:45:00.000Z'
    },
    {
        id: 58,
        title: 'Изрязани дървета в парк "Чинарът"',
        category: 'vandalism',
        description: 'Някой е изрязал и повредил младите дръвчета в природния парк "Чинарът".',
        coordinates: [41.5773, 24.7021],
        urgency: 'medium',
        reporter: 'Градски градинар',
        createdAt: '2024-11-19T08:30:00.000Z'
    },
    {
        id: 59,
        title: 'Препречен достъп до ДКЦ',
        category: 'accessibility',
        description: 'Паркирани коли препречват достъпа до ДКЦ на ул. "Хаджи Христо поп Георгиев" за хора с инвалидни колички.',
        coordinates: [41.5764, 24.7004],
        urgency: 'medium',
        reporter: 'Медицински персонал',
        createdAt: '2024-11-18T16:00:00.000Z'
    },
    {
        id: 60,
        title: 'Неработещ водопровод в ОУ "Проф. д-р Асен Златаров"',
        category: 'water_sewer',
        description: 'В основното училище няма вода от сутринта - счупена главна тръба.',
        coordinates: [41.5777, 24.6997],
        urgency: 'high',
        reporter: 'Училищен персонал',
        createdAt: '2024-11-17T07:00:00.000Z'
    },
    {
        id: 2,
        title: 'Неработещо улично осветление в кв. Райково',
        category: 'lighting',
        description: 'Уличното осветление в квартал Райково не работи от седмица. Създава опасност за пешеходците вечер.',
        coordinates: [41.5750, 24.7030],
        urgency: 'medium',
        reporter: 'Мария Иванова',
        createdAt: '2025-01-14T18:45:00.000Z'
    },
    {
        id: 3,
        title: 'Счупени тротоарни плочки пред СУ "Св. Св. Кирил и Методий"',
        category: 'sidewalk_damage',
        description: 'Счупени плочки пред средното училище създават опасност за учениците. Няколко плочки са изцяло изпочупени.',
        coordinates: [41.5780, 24.7000],
        urgency: 'high',
        reporter: 'Иван Стоянов',
        createdAt: '2025-01-13T14:20:00.000Z'
    },
    {
        id: 4,
        title: 'Повреден пътен знак на бул. България',
        category: 'traffic_signs',
        description: 'Знакът "Стоп" пред МБАЛ е счупен и накривен след вчерашната буря. Създава опасност за движението към болницата.',
        coordinates: [41.5738, 24.7056],
        urgency: 'high',
        reporter: 'Петър Димитров',
        createdAt: '2025-01-12T09:15:00.000Z'
    },
    {
        id: 5,
        title: 'Течове в канализацията при автогарата',
        category: 'water_sewer',
        description: 'Миризма и течове от канализацията в района на автогарата. Проблемът продължава от няколко дни.',
        coordinates: [41.5745, 24.7041],
        urgency: 'medium',
        reporter: 'Стефан Николов',
        createdAt: '2025-01-11T16:30:00.000Z'
    },
    {
        id: 6,
        title: 'Натрупани отпадъци в парка "Чинарът"',
        category: 'illegal_dumping',
        description: 'В природния парк "Чинарът" има натрупани строителни отпадъци и стари мебели, които някой е изхвърлил незаконно.',
        coordinates: [41.5772, 24.7018],
        urgency: 'medium',
        reporter: 'Анна Георгиева',
        createdAt: '2025-01-10T11:45:00.000Z'
    },
    {
        id: 7,
        title: 'Опасно дърво в двора на ОУ "Проф. д-р Асен Златаров"',
        category: 'tree_issues',
        description: 'Голям клон от дърво в двора на основното училище виси опасно и може да падне върху децата по време на игра.',
        coordinates: [41.5788, 24.6995],
        urgency: 'high',
        reporter: 'Учителка Милена',
        createdAt: '2025-01-09T08:20:00.000Z'
    },
    {
        id: 8,
        title: 'Силен мирис от фабриката в жк "Устово"',
        category: 'air_pollution',
        description: 'В жк "Устово" се усеща силен химически мирис, вероятно от някоя от фабриките в района.',
        coordinates: [41.5720, 24.7060],
        urgency: 'medium',
        reporter: 'Жители на Устово',
        createdAt: '2025-01-08T19:00:00.000Z'
    },
    {
        id: 9,
        title: 'Изоставен автомобил на ул. Хаджи Христо поп Георгиев',
        category: 'abandoned_vehicles',
        description: 'Стар автомобил без номера стои паркиран пред ДКЦ от месеци и пречи на пациентите. Има следи от ръжда.',
        coordinates: [41.5755, 24.7045],
        urgency: 'low',
        reporter: 'Димитър Василев',
        createdAt: '2025-01-07T15:30:00.000Z'
    },
    {
        id: 10,
        title: 'Препълнени контейнери в кв. "Невяста"',
        category: 'waste_collection',
        description: 'Контейнерите в квартал "Невяста" не се изпразват редовно и боклукът се разсипва по улицата.',
        coordinates: [41.5760, 24.7050],
        urgency: 'medium',
        reporter: 'Жители на кв. Невяста',
        createdAt: '2025-01-06T12:00:00.000Z'
    },
    {
        id: 11,
        title: 'Счупена детска пързалка до читалище "Христо Ботев"',
        category: 'playgrounds',
        description: 'Пързалката в детската площадка до читалището е счупена и опасна за използване. Има остри краища.',
        coordinates: [41.5775, 24.7020],
        urgency: 'high',
        reporter: 'Майка на дете',
        createdAt: '2025-01-05T10:15:00.000Z'
    },
    {
        id: 12,
        title: 'Шум от нощен бар в центъра',
        category: 'noise_pollution',
        description: 'В центъра на града се извършват строителни дейности и през нощта, което нарушава спокойствието на жителите.',
        coordinates: [41.5770, 24.7010],
        urgency: 'medium',
        reporter: 'Стоян Петков',
        createdAt: '2025-01-04T23:45:00.000Z'
    },
    {
        id: 13,
        title: 'Няма достъп за инвалидни колички до общината',
        category: 'accessibility',
        description: 'Входът на общината няма рампа за хора в инвалидни колички. Има само стълби.',
        coordinates: [41.5768, 24.7012],
        urgency: 'medium',
        reporter: 'Организация за хора с увреждания',
        createdAt: '2025-01-03T14:30:00.000Z'
    },
    {
        id: 14,
        title: 'Вандализъм на автобусна спирка при МБАЛ',
        category: 'vandalism',
        description: 'Автобусната спирка при болницата е изрисувана с графити и стъклото е счупено.',
        coordinates: [41.5740, 24.7055],
        urgency: 'low',
        reporter: 'Анонимно',
        createdAt: '2025-01-02T16:20:00.000Z'
    },
    {
        id: 15,
        title: 'Протекъл водопровод на ул. България',
        category: 'water_sewer',
        description: 'Голям протекъл водопровод на бул. България създава локва и проблеми за движението към болницата.',
        coordinates: [41.5790, 24.7035],
        urgency: 'high',
        reporter: 'Иван Маринов',
        createdAt: '2025-01-01T07:30:00.000Z'
    },
    {
        id: 16,
        title: 'Паднало дърво блокира тротоара в кв. Райково',
        category: 'tree_issues',
        description: 'След вчерашната буря дърво е паднало и блокира изцяло тротоара в квартал Райково.',
        coordinates: [41.5765, 24.6990],
        urgency: 'high',
        reporter: 'Николай Стоев',
        createdAt: '2024-12-31T08:45:00.000Z'
    },
    {
        id: 17,
        title: 'Неработящ светофар при Сводестия мост',
        category: 'traffic_signs',
        description: 'Светофарът при историческия Сводест мост не работи от сутринта. Създава хаос в движението.',
        coordinates: [41.5762, 24.7008],
        urgency: 'high',
        reporter: 'Полицай Георги',
        createdAt: '2024-12-30T09:00:00.000Z'
    },
    {
        id: 18,
        title: 'Глутница бездомни кучета при Retail Park',
        category: 'stray_animals',
        description: 'В района на Retail Park Smolyan има глутница от 5-6 бездомни кучета, които могат да бъдат агресивни.',
        coordinates: [41.5748, 24.7028],
        urgency: 'medium',
        reporter: 'Пазарджии',
        createdAt: '2024-12-29T13:15:00.000Z'
    },
    {
        id: 19,
        title: 'Счупени стъпала на моста над река Черна',
        category: 'sidewalk_damage',
        description: 'Стъпалата на моста над река Черна са счупени и хлъзгави. Опасно за възрастни хора.',
        coordinates: [41.5735, 24.7042],
        urgency: 'medium',
        reporter: 'Пенсионер Стоян',
        createdAt: '2024-12-28T17:30:00.000Z'
    },
    {
        id: 20,
        title: 'Проблем с автобусния транспорт до село Момчиловци',
        category: 'public_transport',
        description: 'Автобусът до село Момчиловци не спира на спирката при поликлиниката вече втори ден.',
        coordinates: [41.5752, 24.7022],
        urgency: 'medium',
        reporter: 'Пътници',
        createdAt: '2024-12-27T15:45:00.000Z'
    },
    {
        id: 21,
        title: 'Замърсяване на река Арда',
        category: 'waste_management',
        description: 'В река Арда има изхвърлени боклуци и пластмасови бутилки. Водата мирише неприятно.',
        coordinates: [41.5758, 24.7015],
        urgency: 'medium',
        reporter: 'Еколози',
        createdAt: '2024-12-26T11:20:00.000Z'
    },
    {
        id: 22,
        title: 'Липсващи предпазни огради при Хаджиивановата къща',
        category: 'security_issues',
        description: 'При историческата Хаджииванова къща в кв. Устово липсват предпазни огради. Опасно особено за деца.',
        coordinates: [41.5773, 24.7005],
        urgency: 'high',
        reporter: 'Родители',
        createdAt: '2024-12-25T14:00:00.000Z'
    },
    {
        id: 23,
        title: 'Дупки в асфалта към село Чокманово',
        category: 'road_damage',
        description: 'Множество дупки на пътя към село Чокманово създават опасност за автомобилите.',
        coordinates: [41.5795, 24.7038],
        urgency: 'medium',
        reporter: 'Шофьор',
        createdAt: '2024-12-24T12:30:00.000Z'
    },
    {
        id: 24,
        title: 'Неработещо осветление в подлеза при жп гарата',
        category: 'lighting',
        description: 'Подлезът при железопътната гара е тъмен и опасен вечер. Всички лампи са изгорели.',
        coordinates: [41.5742, 24.7048],
        urgency: 'medium',
        reporter: 'Пътници',
        createdAt: '2024-12-23T20:15:00.000Z'
    },
    {
        id: 25,
        title: 'Изтичане на газ в жк "Епископ Константин"',
        category: 'security_issues',
        description: 'В жилищен блок в жк "Епископ Константин" се усеща мирис на газ във входа. Възможен протекъл.',
        coordinates: [41.5725, 24.7065],
        urgency: 'high',
        reporter: 'Жилищна управа',
        createdAt: '2024-12-22T18:00:00.000Z'
    },
    {
        id: 26,
        title: 'Замърсяване от строителство на новия търговски парк',
        category: 'air_pollution',
        description: 'Строителството на новия търговски парк създава много прах и мръсотия в околността.',
        coordinates: [41.5780, 24.7045],
        urgency: 'low',
        reporter: 'Съседи',
        createdAt: '2024-12-21T16:45:00.000Z'
    },
    {
        id: 27,
        title: 'Липсваща канализационна капачка в кв. "Нов център"',
        category: 'water_sewer',
        description: 'В квартал "Нов център" липсва капачка на канализацията. Изключително опасно за пешеходци.',
        coordinates: [41.5767, 24.6985],
        urgency: 'high',
        reporter: 'Местен жител',
        createdAt: '2024-12-20T13:30:00.000Z'
    },
    {
        id: 28,
        title: 'Счупени пейки в градинката до читалището',
        category: 'vandalism',
        description: 'В градинката до читалище "Христо Ботев" повечето пейки са счупени или изрисувани.',
        coordinates: [41.5771, 24.7017],
        urgency: 'low',
        reporter: 'Посетители на градинката',
        createdAt: '2024-12-19T10:00:00.000Z'
    },
    {
        id: 29,
        title: 'Препречен тротоар от паркирани коли при МБАЛ',
        category: 'accessibility',
        description: 'Автомобили паркират на тротоара пред болницата и пречат на пациентите, особено на хора с инвалидни колички.',
        coordinates: [41.5756, 24.7032],
        urgency: 'medium',
        reporter: 'Пациенти',
        createdAt: '2024-12-18T15:20:00.000Z'
    },
    {
        id: 30,
        title: 'Неработещ кран в природния парк "Чинарът"',
        category: 'water_sewer',
        description: 'Чешмата в парк "Чинарът" не работи от месеци. Хората не могат да се освежат през лятото.',
        coordinates: [41.5774, 24.7019],
        urgency: 'low',
        reporter: 'Спортисти',
        createdAt: '2024-12-17T12:45:00.000Z'
    },
    {
        id: 31,
        title: 'Дупка на пътя към Малко Търново',
        category: 'road_damage',
        description: 'На изхода към Малко Търново има опасна дупка, която повредила няколко автомобила.',
        coordinates: [41.5810, 24.7070],
        urgency: 'high',
        reporter: 'Шофьор Петко',
        createdAt: '2024-12-16T14:20:00.000Z'
    },
    {
        id: 32,
        title: 'Неработещо осветление при автогарата',
        category: 'lighting',
        description: 'Осветлението около автогарата не работи, създавайки проблеми за пътниците вечер.',
        coordinates: [41.5745, 24.7041],
        urgency: 'medium',
        reporter: 'Автогара Смолян',
        createdAt: '2024-12-15T19:30:00.000Z'
    },
    {
        id: 33,
        title: 'Счупени стъпала при читалището',
        category: 'sidewalk_damage',
        description: 'Стъпалата пред читалище "Отец Паисий" са счупени и хлъзгави.',
        coordinates: [41.5772, 24.7016],
        urgency: 'medium',
        reporter: 'Читатели',
        createdAt: '2024-12-14T10:15:00.000Z'
    },
    {
        id: 34,
        title: 'Паднал знак "Внимание деца"',
        category: 'traffic_signs',
        description: 'Пътният знак пред детската градина е паднал и създава опасност.',
        coordinates: [41.5765, 24.6980],
        urgency: 'high',
        reporter: 'Детска градина',
        createdAt: '2024-12-13T08:45:00.000Z'
    },
    {
        id: 35,
        title: 'Протекъл водопровод при болницата',
        category: 'water_sewer',
        description: 'Големи протечки пред болницата създават локви и проблеми за пациентите.',
        coordinates: [41.5738, 24.7056],
        urgency: 'high',
        reporter: 'Болнично ръководство',
        createdAt: '2024-12-12T11:00:00.000Z'
    },
    {
        id: 36,
        title: 'Незаконно сметище в гората',
        category: 'illegal_dumping',
        description: 'В близо до квартал Райково има голямо незаконно сметище със строителни отпадъци.',
        coordinates: [41.5820, 24.6950],
        urgency: 'medium',
        reporter: 'Горски стопани',
        createdAt: '2024-12-11T16:30:00.000Z'
    },
    {
        id: 37,
        title: 'Опасен клон над детска градина',
        category: 'tree_issues',
        description: 'Голям клон виси опасно над двора на детска градина "Звездица".',
        coordinates: [41.5763, 24.6978],
        urgency: 'high',
        reporter: 'Директорка на градината',
        createdAt: '2024-12-10T09:20:00.000Z'
    },
    {
        id: 38,
        title: 'Замърсяване от цигарени фабрики',
        category: 'air_pollution',
        description: 'Силен тютюнев мирис в жк "Епископ Константин" от близката фабрика.',
        coordinates: [41.5730, 24.7080],
        urgency: 'medium',
        reporter: 'Жители на квартала',
        createdAt: '2024-12-09T18:45:00.000Z'
    },
    {
        id: 39,
        title: 'Изоставена кола в центъра',
        category: 'abandoned_vehicles',
        description: 'Стар Mercedes без регистрация паркиран пред ресторант "Родопа" от месеци.',
        coordinates: [41.5769, 24.7011],
        urgency: 'low',
        reporter: 'Собственик на ресторант',
        createdAt: '2024-12-08T13:15:00.000Z'
    },
    {
        id: 40,
        title: 'Неизпразени контейнери в Устово',
        category: 'waste_collection',
        description: 'В жк "Устово" контейнерите не се изпразват от седмица и боклукът се разсипва.',
        coordinates: [41.5718, 24.7058],
        urgency: 'high',
        reporter: 'Жители на Устово',
        createdAt: '2024-12-07T15:00:00.000Z'
    },
    {
        id: 41,
        title: 'Счупена люлка в детския парк',
        category: 'playgrounds',
        description: 'Люлката в парка до стадиона е счупена и има остри метални части.',
        coordinates: [41.5785, 24.7025],
        urgency: 'high',
        reporter: 'Родители',
        createdAt: '2024-12-06T12:30:00.000Z'
    },
    {
        id: 42,
        title: 'Силен шум от нощен бар',
        category: 'noise_pollution',
        description: 'Бар "Пещера" в центъра прави силен шум до късно и нарушава спокойствието.',
        coordinates: [41.5771, 24.7013],
        urgency: 'medium',
        reporter: 'Съседи',
        createdAt: '2024-12-05T02:15:00.000Z'
    },
    {
        id: 43,
        title: 'Няма рампи на пощата',
        category: 'accessibility',
        description: 'Централната поща няма достъп за инвалидни колички - само стълби.',
        coordinates: [41.5767, 24.7009],
        urgency: 'medium',
        reporter: 'Хора с увреждания',
        createdAt: '2024-12-04T11:45:00.000Z'
    },
    {
        id: 44,
        title: 'Графити по сградата на общината',
        category: 'vandalism',
        description: 'Общинската сграда е изрисувана с графити и непристойни надписи.',
        coordinates: [41.5768, 24.7012],
        urgency: 'low',
        reporter: 'Служители',
        createdAt: '2024-12-03T14:20:00.000Z'
    },
    {
        id: 45,
        title: 'Аварийна канализация при спортната зала',
        category: 'water_sewer',
        description: 'Канализацията при спортната зала е аварийна и създава миризма.',
        coordinates: [41.5781, 24.7022],
        urgency: 'high',
        reporter: 'Спортен клуб',
        createdAt: '2024-12-02T10:00:00.000Z'
    },
    {
        id: 46,
        title: 'Наклонено дърво край училището',
        category: 'tree_issues',
        description: 'Голямо дърво се е наклонило и заплашва да падне върху учебната сграда.',
        coordinates: [41.5779, 24.7001],
        urgency: 'high',
        reporter: 'Училищен директор',
        createdAt: '2024-12-01T07:30:00.000Z'
    },
    {
        id: 47,
        title: 'Неработещ семафор при моста',
        category: 'traffic_signs',
        description: 'Семафорът при моста над реката не работи и създава задръствания.',
        coordinates: [41.5758, 24.7014],
        urgency: 'high',
        reporter: 'Пътна полиция',
        createdAt: '2024-11-30T16:45:00.000Z'
    },
    {
        id: 48,
        title: 'Агресивни улични кучета',
        category: 'stray_animals',
        description: 'В района на техникума има група от 4-5 агресивни бездомни кучета.',
        coordinates: [41.5750, 24.7035],
        urgency: 'high',
        reporter: 'Ученици',
        createdAt: '2024-11-29T08:15:00.000Z'
    },
    {
        id: 49,
        title: 'Счупен тротоар при банката',
        category: 'sidewalk_damage',
        description: 'Тротоарът пред ЕИБанк е изцяло разрушен и опасен за пешеходци.',
        coordinates: [41.5766, 24.7007],
        urgency: 'medium',
        reporter: 'Банкови служители',
        createdAt: '2024-11-28T13:00:00.000Z'
    },
    {
        id: 50,
        title: 'Спрян автобус номер 5',
        category: 'public_transport',
        description: 'Автобусната линия номер 5 до село Момчиловци не работи от дни.',
        coordinates: [41.5748, 24.7026],
        urgency: 'medium',
        reporter: 'Селяни от Момчиловци',
        createdAt: '2024-11-27T09:30:00.000Z'
    },
    {
        id: 51,
        title: 'Замърсена река от фабриката',
        category: 'waste_management',
        description: 'Река Арда е замърсена с химикали от местната фабрика - водата е оцветена.',
        coordinates: [41.5755, 24.7017],
        urgency: 'high',
        reporter: 'Еколозите от Смолян',
        createdAt: '2024-11-26T14:45:00.000Z'
    },
    {
        id: 52,
        title: 'Липсващи предпазители на балкони',
        category: 'security_issues',
        description: 'В жилищен блок 12 липсват предпазни парапети на няколко балкона.',
        coordinates: [41.5722, 24.7062],
        urgency: 'high',
        reporter: 'Жилищна управа',
        createdAt: '2024-11-25T17:20:00.000Z'
    },
    {
        id: 53,
        title: 'Дупки на пътя към Рудозем',
        category: 'road_damage',
        description: 'На изхода към Рудозем има серия от дупки, които правят пътуването опасно.',
        coordinates: [41.5795, 24.6920],
        urgency: 'medium',
        reporter: 'Превозвачи',
        createdAt: '2024-11-24T11:10:00.000Z'
    },
    {
        id: 54,
        title: 'Неработещи лампи в подлеза',
        category: 'lighting',
        description: 'Подлезът при жп гарата е тъмен и опасен - всички лампи са счупени.',
        coordinates: [41.5740, 24.7047],
        urgency: 'medium',
        reporter: 'БДЖ служители',
        createdAt: '2024-11-23T20:00:00.000Z'
    },
    {
        id: 55,
        title: 'Изтичане на мазут в гаража',
        category: 'security_issues',
        description: 'В подземния гараж под блок 6 изтича мазут и създава пожароопасност.',
        coordinates: [41.5726, 24.7068],
        urgency: 'high',
        reporter: 'Жители на блока',
        createdAt: '2024-11-22T15:30:00.000Z'
    },
    {
        id: 56,
        title: 'Прах от строителството',
        category: 'air_pollution',
        description: 'Строителството на новия мол създава много прах в целия квартал.',
        coordinates: [41.5775, 24.7040],
        urgency: 'low',
        reporter: 'Местни жители',
        createdAt: '2024-11-21T12:15:00.000Z'
    },
    {
        id: 57,
        title: 'Блокирана канализация при пазара',
        category: 'water_sewer',
        description: 'Канализацията при централния пазар е блокирана и създава наводнения.',
        coordinates: [41.5749, 24.7029],
        urgency: 'high',
        reporter: 'Пазарни търговци',
        createdAt: '2024-11-20T06:45:00.000Z'
    },
    {
        id: 58,
        title: 'Изрязани дървета в парка',
        category: 'vandalism',
        description: 'Някой е изрязал и повредил младите дръвчета в новозасадения парк.',
        coordinates: [41.5773, 24.7021],
        urgency: 'medium',
        reporter: 'Градски градинар',
        createdAt: '2024-11-19T08:30:00.000Z'
    },
    {
        id: 59,
        title: 'Препречен достъп до аптеката',
        category: 'accessibility',
        description: 'Паркирани коли препречват достъпа до аптеката за хора с инвалидни колички.',
        coordinates: [41.5764, 24.7004],
        urgency: 'medium',
        reporter: 'Фармацевти',
        createdAt: '2024-11-18T16:00:00.000Z'
    },
    {
        id: 60,
        title: 'Неработещ водопровод в училището',
        category: 'water_sewer',
        description: 'В СОУ "Димитър Благоев" няма вода от сутринта - счупена главна тръба.',
        coordinates: [41.5777, 24.6997],
        urgency: 'high',
        reporter: 'Училищен персонал',
        createdAt: '2024-11-17T07:00:00.000Z'
    }
];

// Export the data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SAMPLE_SIGNALS;
}