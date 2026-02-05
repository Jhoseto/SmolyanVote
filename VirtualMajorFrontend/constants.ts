
import { CityResources, Region, Investment } from './types';

export const INITIAL_RESOURCES: CityResources = {
  budget: 2800000,
  trust: 55,
  infrastructure: 65,
  eco: 85,
  population: 27500,
  innovation: 35
};

export const REGIONS: Region[] = [
  {
    id: 'nov_centur',
    name: 'Нов Център',
    description: 'Административно ядро. Нуждае се от модернизация на градската среда и паркинги.',
    stats: { trust: 5, budget: -100000 },
    color: '#06b6d4',
    status: 'normal'
  },
  {
    id: 'star_centur',
    name: 'Стар Център',
    description: 'Исторически дух. Калдъръмените улици и старите сгради изискват скъпа поддръжка.',
    stats: { infrastructure: -15, trust: 10 },
    color: '#3b82f6',
    status: 'normal'
  },
  {
    id: 'gorno_raikovo',
    name: 'Горно Райково',
    description: 'Архитектурен резерват. Културното наследство е ключът към високия клас туризъм.',
    stats: { trust: 15, eco: 5 },
    color: '#8b5cf6',
    status: 'normal'
  },
  {
    id: 'dolno_raikovo',
    name: 'Долно Райково',
    description: 'Гъсто населен жилищен район. Проблеми с трафика и междублоковите пространства.',
    stats: { infrastructure: -8, budget: 50000 },
    color: '#a855f7',
    status: 'normal'
  },
  {
    id: 'ustovo',
    name: 'Устово',
    description: 'Търговският център. Гръбнакът на икономиката, но със стара ВиК мрежа.',
    stats: { budget: 180000, eco: -10 },
    color: '#f59e0b',
    status: 'normal'
  },
  {
    id: 'neviastata',
    name: 'Невястата',
    description: 'Природна перла. Потенциал за еко-пътеки и алпинизъм.',
    stats: { eco: 20, innovation: 5 },
    color: '#10b981',
    status: 'normal'
  },
  {
    id: 'kaptaja',
    name: 'Каптажа',
    description: 'Висока зона. Критична точка за водоснабдяването на целия град.',
    stats: { infrastructure: -20, eco: 10 },
    color: '#14b8a6',
    status: 'normal'
  },
  {
    id: 'stanevska',
    name: 'Станевска махала',
    description: 'Периферен жилищен квартал. Нуждае се от по-чест градски транспорт.',
    stats: { population: 200, infrastructure: -10 },
    color: '#6366f1',
    status: 'normal'
  },
  {
    id: 'ezerovo',
    name: 'Езерово',
    description: 'Смолянските езера. Идеално място за привличане на млади семейства и remote workers.',
    stats: { eco: 15, trust: 10 },
    color: '#0ea5e9',
    status: 'normal'
  }
];

export const ALL_POTENTIAL_PROJECTS: Investment[] = [
  // TIER 1 - Оцеляване и База
  { id: 'waste_optimization', name: 'Оптимизация на сметосъбирането', cost: 150000, description: 'Нови контейнери и по-ефективни маршрути за почистване.', impact: { eco: 10, trust: 5, budget: 10000 }, tier: 1, built: false, currentStep: 0, totalSteps: 1, isStarted: false },
  { id: 'water_leaks', name: 'Авариен ремонт на ВиК', cost: 500000, description: 'Намаляване на огромните загуби на вода в Каптажа и Устово.', impact: { infrastructure: 25, budget: 40000 }, tier: 1, built: false, currentStep: 0, totalSteps: 3, isStarted: false },
  { id: 'chitalishta', name: 'Ремонт на Читалища', cost: 300000, description: 'Възстановяване на средищата на културата в кварталите.', impact: { trust: 25, population: 50 }, tier: 1, built: false, currentStep: 0, totalSteps: 2, isStarted: false },
  { id: 'led_street', name: 'LED Улично осветление', cost: 400000, description: 'Подмяна на старите лампи с енергоспестяващи в целия град.', impact: { budget: 35000, infrastructure: 10, eco: 5 }, tier: 1, built: false, currentStep: 0, totalSteps: 2, isStarted: false },
  { id: 'river_cleaning', name: 'Почистване на река Черна', cost: 200000, description: 'Премахване на наносите и отпадъците от коритото на реката.', impact: { eco: 20, infrastructure: 5 }, tier: 1, built: false, currentStep: 0, totalSteps: 1, isStarted: false },
  { id: 'shelter_dogs', name: 'Общински приют за кучета', cost: 250000, description: 'Хуманно решаване на проблема с бездомните животни.', impact: { trust: 15, infrastructure: 5 }, tier: 1, built: false, currentStep: 0, totalSteps: 2, isStarted: false },

  // TIER 2 - Развитие и Хора
  { id: 'visit_smolyan', name: 'Бранд "Посети Смолян"', cost: 800000, description: 'Мащабна кампания за привличане на целогодишни туристи.', impact: { budget: 120000, trust: 10, population: 100 }, tier: 2, built: false, currentStep: 0, totalSteps: 3, isStarted: false },
  { id: 'co_working', name: 'Общински Ко-уъркинг център', cost: 1200000, description: 'Превръщане на стара административна сграда в хъб за фрийлансъри.', impact: { innovation: 35, population: 400, budget: 20000 }, tier: 2, built: false, currentStep: 0, totalSteps: 3, isStarted: false },
  { id: 'bike_lanes', name: 'Велоалеи и пешеходни зони', cost: 950000, description: 'Свързване на Нов център със Стар център по екологичен начин.', impact: { eco: 20, trust: 15, infrastructure: 5 }, tier: 2, built: false, currentStep: 0, totalSteps: 4, isStarted: false },
  { id: 'local_food', name: 'Пазар за местни производители', cost: 600000, description: 'Модерно тържище за чиста родопска продукция в Устово.', impact: { budget: 50000, trust: 10, eco: 10 }, tier: 2, built: false, currentStep: 0, totalSteps: 2, isStarted: false },
  { id: 'youth_center', name: 'Младежки център с кино', cost: 1500000, description: 'Пространство за култура, изкуство и забавление на младите.', impact: { innovation: 20, population: 300, trust: 20 }, tier: 2, built: false, currentStep: 0, totalSteps: 4, isStarted: false },
  { id: 'hospice_care', name: 'Модерен Хоспис', cost: 1100000, description: 'Грижа за възрастните хора в достойна среда.', impact: { trust: 30, infrastructure: 10 }, tier: 2, built: false, currentStep: 0, totalSteps: 3, isStarted: false },
  { id: 'sport_complex', name: 'Спортен комплекс "Родопи"', cost: 1800000, description: 'Модерни игрища за футбол, тенис и лека атлетика.', impact: { population: 200, trust: 15, innovation: 5 }, tier: 2, built: false, currentStep: 0, totalSteps: 5, isStarted: false },
  { id: 'museum_upgrade', name: 'Интерактивен Исторически Музей', cost: 700000, description: 'Дигитализация на експозициите за привличане на младите.', impact: { innovation: 25, trust: 10, budget: 30000 }, tier: 2, built: false, currentStep: 0, totalSteps: 2, isStarted: false },

  // TIER 3 - Стратегическа трансформация
  { id: 'planetarium_full', name: 'Нов дигитален Планетариум', cost: 2500000, description: 'Пълно технологично обновяване за превръщане в световна атракция.', impact: { trust: 20, innovation: 50, budget: 150000 }, tier: 3, built: false, currentStep: 0, totalSteps: 5, isStarted: false },
  { id: 'eco_transport', name: 'Електрически градски флот', cost: 4000000, description: 'Пълна подмяна на старите автобуси с модерни електробуси.', impact: { eco: 50, infrastructure: 20, innovation: 20 }, tier: 3, built: false, currentStep: 0, totalSteps: 6, isStarted: false },
  { id: 'old_town_regeneration', name: 'Регенерация на Горно Райково', cost: 3200000, description: 'Цялостна реставрация на фасади и калдъръм за елитен туризъм.', impact: { trust: 40, budget: 200000, eco: 10 }, tier: 3, built: false, currentStep: 0, totalSteps: 7, isStarted: false },
  { id: 'digital_smolyan', name: 'Електронна община 2.0', cost: 1500000, description: 'Пълна дигитализация на услугите за граждани и бизнес.', impact: { innovation: 60, budget: 80000, trust: 15 }, tier: 3, built: false, currentStep: 0, totalSteps: 3, isStarted: false },
  { id: 'solar_park', name: 'Общински Соларен Парк', cost: 5000000, description: 'Енергийна независимост на общината и ниски сметки.', impact: { budget: 400000, eco: 40, innovation: 15 }, tier: 3, built: false, currentStep: 0, totalSteps: 8, isStarted: false },
  { id: 'smolyan_university', name: 'Филиал на Технически Университет', cost: 6000000, description: 'Връщане на младите хора чрез качествено образование.', impact: { population: 2000, innovation: 100, trust: 30 }, tier: 3, built: false, currentStep: 0, totalSteps: 10, isStarted: false },
  { id: 'mountain_resort_upgrade', name: 'Модернизация на Смолянски езера', cost: 3500000, description: 'Еко-курорт от нов тип със защитена природа.', impact: { budget: 250000, eco: 30, population: 500 }, tier: 3, built: false, currentStep: 0, totalSteps: 6, isStarted: false },
  { id: 'industrial_zone_2', name: 'Технологична зона "Устово"', cost: 4500000, description: 'Инфраструктура за нови High-tech производства.', impact: { budget: 350000, innovation: 40, population: 800 }, tier: 3, built: false, currentStep: 0, totalSteps: 5, isStarted: false }
];
