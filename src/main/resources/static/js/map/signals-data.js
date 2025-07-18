// ===== SIGNAL CATEGORIES CONFIGURATION =====
const SIGNAL_CATEGORIES = {
    // Инфраструктура
    road_damage: {
        name: 'Дупки в пътищата',
        icon: 'bi-cone-striped',
        color: '#ef4444'
    },
    sidewalk_damage: {
        name: 'Счупени тротоари',
        icon: 'bi-bricks',
        color: '#f97316'
    },
    lighting: {
        name: 'Неработещо осветление',
        icon: 'bi-lightbulb',
        color: '#eab308'
    },
    traffic_signs: {
        name: 'Повредени пътни знаци',
        icon: 'bi-sign-stop',
        color: '#dc2626'
    },
    water_sewer: {
        name: 'Водопровод/канализация',
        icon: 'bi-droplet-fill',
        color: '#2563eb'
    },

    // Околна среда
    waste_management: {
        name: 'Замърсяване на околната среда',
        icon: 'bi-trash3',
        color: '#16a34a'
    },
    illegal_dumping: {
        name: 'Незаконно изхвърляне на отпадъци',
        icon: 'bi-exclamation-triangle',
        color: '#dc2626'
    },
    tree_issues: {
        name: 'Проблеми с дървета и растителност',
        icon: 'bi-tree',
        color: '#059669'
    },
    air_pollution: {
        name: 'Замърсяване на въздуха',
        icon: 'bi-cloud-haze',
        color: '#6b7280'
    },
    noise_pollution: {
        name: 'Шумово замърсяване',
        icon: 'bi-volume-up',
        color: '#7c3aed'
    },

    // Обществени услуги
    healthcare: {
        name: 'Здравеопазване',
        icon: 'bi-hospital',
        color: '#dc2626'
    },
    education: {
        name: 'Образование',
        icon: 'bi-mortarboard',
        color: '#2563eb'
    },
    transport: {
        name: 'Обществен транспорт',
        icon: 'bi-bus-front',
        color: '#059669'
    },
    parking: {
        name: 'Паркиране',
        icon: 'bi-car-front',
        color: '#ea580c'
    },

    // Обществена безопасност
    security: {
        name: 'Обществена безопасност',
        icon: 'bi-shield-exclamation',
        color: '#dc2626'
    },
    vandalism: {
        name: 'Вандализъм',
        icon: 'bi-hammer',
        color: '#991b1b'
    },
    accessibility: {
        name: 'Достъпност',
        icon: 'bi-universal-access',
        color: '#7c3aed'
    },

    // Други
    other: {
        name: 'Други',
        icon: 'bi-three-dots',
        color: '#6b7280'
    }
};

// ===== URGENCY LEVELS CONFIGURATION =====
const URGENCY_LEVELS = {
    low: {
        name: 'Ниска',
        icon: 'bi-circle',
        color: '#10b981'
    },
    medium: {
        name: 'Средна',
        icon: 'bi-exclamation-circle',
        color: '#f59e0b'
    },
    high: {
        name: 'Висока',
        icon: 'bi-exclamation-triangle-fill',
        color: '#ef4444'
    }
};

// ===== SAMPLE SIGNALS DATA =====
const SAMPLE_SIGNALS = [
    {
        id: 1,
        title: 'Голяма дупка на главната улица',
        category: 'road_damage',
        description: 'Има опасна дупка на ул. "Дряново" пред блок 15. Много автомобили я заобикалят и се създава опасност за пешеходците.',
        coordinates: [41.5766, 24.7014],
        urgency: 'high',
        imageUrl: null, // Няма снимка
        author: {
            id: 12,
            username: 'ivan_petrov',
            imageUrl: '/images/avatars/user12.jpg'
        },
        createdAt: '2024-11-25T08:30:00.000Z'
    },
    {
        id: 2,
        title: 'Неработещо улично осветление',
        category: 'lighting',
        description: 'Уличните лампи в района на парк "Кукери" не светят от над седмица. Създава се проблем за нощното движение.',
        coordinates: [41.5741, 24.7053],
        urgency: 'medium',
        imageUrl: '/images/signals/signal_2_lighting.jpg',
        author: {
            id: 8,
            username: 'maria_dimitrova',
            imageUrl: null // Ще се покажат инициали
        },
        createdAt: '2024-11-24T19:45:00.000Z'
    },
    {
        id: 3,
        title: 'Затруднено паркиране пред болницата',
        category: 'parking',
        description: 'Няма достатъчно паркоместа пред МБАЛ - Смолян. Пациентите и придружаващите ги лица трудно намират място за паркиране.',
        coordinates: [41.5698, 24.7089],
        urgency: 'medium',
        imageUrl: '/images/signals/signal_3_parking.jpg',
        author: {
            id: 15,
            username: 'dr_georgiev',
            imageUrl: '/images/avatars/user15.jpg'
        },
        createdAt: '2024-11-24T14:20:00.000Z'
    },
    {
        id: 4,
        title: 'Повреден пътен знак на кръстовището',
        category: 'traffic_signs',
        description: 'Знакът "Стоп" на кръстовището при центъра е наклонен и трудно се вижда. Създава се опасност за движението.',
        coordinates: [41.5751, 24.7025],
        urgency: 'high',
        imageUrl: null,
        author: {
            id: 3,
            username: 'transport_admin',
            imageUrl: '/images/avatars/user3.jpg'
        },
        createdAt: '2024-11-24T11:15:00.000Z'
    },
    {
        id: 5,
        title: 'Проблеми с водопровода в квартал "Райково"',
        category: 'water_sewer',
        description: 'От два дни няма вода в апартаментите в кв. Райково. Водопроводната мрежа се нуждае от спешен ремонт.',
        coordinates: [41.5823, 24.7156],
        urgency: 'high',
        imageUrl: '/images/signals/signal_5_water.jpg',
        author: {
            id: 7,
            username: 'anastasia_45',
            imageUrl: null
        },
        createdAt: '2024-11-23T16:30:00.000Z'
    },
    {
        id: 6,
        title: 'Незаконно депо за отпадъци',
        category: 'illegal_dumping',
        description: 'Край реката има образувано незаконно депо за отпадъци. Замърсява околната среда и създава лоша миризма.',
        coordinates: [41.5689, 24.6934],
        urgency: 'medium',
        imageUrl: '/images/signals/signal_6_dump.jpg',
        author: {
            id: 22,
            username: 'eco_warrior',
            imageUrl: '/images/avatars/user22.jpg'
        },
        createdAt: '2024-11-23T09:45:00.000Z'
    },
    {
        id: 7,
        title: 'Недостъпен вход за хора с увреждания',
        category: 'accessibility',
        description: 'Входът на общинската сграда няма рампа за инвалидни колички. Хората с увреждания не могат да влязат самостоятелно.',
        coordinates: [41.5755, 24.7019],
        urgency: 'medium',
        imageUrl: null,
        author: {
            id: 11,
            username: 'accessibility_advocate',
            imageUrl: null
        },
        createdAt: '2024-11-22T13:20:00.000Z'
    },
    {
        id: 8,
        title: 'Счупен тротоар при автогарата',
        category: 'sidewalk_damage',
        description: 'Тротоарът при автогарата е много повреден с дупки и счупени плочки. Опасно е за пешеходците, особено в тъмното.',
        coordinates: [41.5778, 24.7089],
        urgency: 'medium',
        imageUrl: '/images/signals/signal_8_sidewalk.jpg',
        author: {
            id: 9,
            username: 'stefan_blogger',
            imageUrl: '/images/avatars/user9.jpg'
        },
        createdAt: '2024-11-22T07:50:00.000Z'
    },
    {
        id: 9,
        title: 'Шумна машина работи през нощта',
        category: 'noise_pollution',
        description: 'В строителния обект до болницата работи машина и през нощта. Пациентите и живущите наоколо не могат да спят.',
        coordinates: [41.5701, 24.7078],
        urgency: 'high',
        imageUrl: null,
        author: {
            id: 18,
            username: 'night_shift_nurse',
            imageUrl: null
        },
        createdAt: '2024-11-21T23:30:00.000Z'
    },
    {
        id: 10,
        title: 'Повредени дървета в парка',
        category: 'tree_issues',
        description: 'След вчерашната буря няколко дървета в централния парк са паднали и блокират алеите.',
        coordinates: [41.5745, 24.7041],
        urgency: 'medium',
        imageUrl: '/images/signals/signal_10_trees.jpg',
        author: {
            id: 25,
            username: 'park_volunteer',
            imageUrl: '/images/avatars/user25.jpg'
        },
        createdAt: '2024-11-21T15:10:00.000Z'
    },
    // Още сигнали за демонстрация...
    {
        id: 11,
        title: 'Проблем с автобусната спирка',
        category: 'transport',
        description: 'Автобусната спирка при центъра няма навес и пейки. Хората чакат на дъжд и сняг.',
        coordinates: [41.5762, 24.7033],
        urgency: 'low',
        imageUrl: null,
        author: {
            id: 5,
            username: 'commuter_daily',
            imageUrl: null
        },
        createdAt: '2024-11-21T12:15:00.000Z'
    },
    {
        id: 12,
        title: 'Вандализъм в училищния двор',
        category: 'vandalism',
        description: 'Неизвестни лица са счупили прозорци и изрисували стените на ОУ "Неофит Рилски".',
        coordinates: [41.5777, 24.6997],
        urgency: 'medium',
        imageUrl: '/images/signals/signal_12_vandalism.jpg',
        author: {
            id: 14,
            username: 'school_director',
            imageUrl: '/images/avatars/user14.jpg'
        },
        createdAt: '2024-11-20T16:45:00.000Z'
    }
];

// Export the data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SAMPLE_SIGNALS, SIGNAL_CATEGORIES, URGENCY_LEVELS };
}