import { stageAccentOrder } from '@/lib/design/stage-accents';

/**
 * Development seed content.
 *
 * DEMO DATA — everything in this file is placeholder material for local
 * development and design review. Lesson `vimeoVideoId` values are deliberately
 * left empty so nothing pretends to be a real video; add the real ids from the
 * admin dashboard (Courses → Stage → Lesson) once they are available.
 */

export type SeedLesson = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationSeconds: number;
  vimeoVideoId?: string | null;
  vimeoHash?: string | null;
};

export type SeedStage = {
  number: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  accent: string;
  lessons: SeedLesson[];
};

const lessonTitles: Record<number, [string, string][]> = {
  1: [
    ['مقدمة المرحلة وخارطة الطريق', 'Stage introduction and roadmap'],
    ['المصطلحات الأساسية', 'Core terminology'],
    ['الأدوات والتجهيزات', 'Instruments and setup'],
    ['بروتوكولات السلامة', 'Safety protocols'],
    ['التشريح التطبيقي — الجزء الأول', 'Applied anatomy — part one'],
    ['التشريح التطبيقي — الجزء الثاني', 'Applied anatomy — part two'],
    ['أساسيات التشخيص', 'Diagnostic fundamentals'],
    ['قراءة الحالة السريرية', 'Reading the clinical case'],
    ['توثيق الحالات', 'Case documentation'],
    ['مراجعة المرحلة الأولى', 'First stage review'],
  ],
  2: [
    ['ESP 1 / Recorde Base', 'ESP 1 / Recorde Base'],
    ['ESP 2 / Bite Rim', 'ESP 2 / Bite Rim'],
    ['ESP 3 / Articulator Mounting', 'ESP 3 / Articulator Mounting'],
    ['ESP 4 / Upper Anterior Arrangement', 'ESP 4 / Upper Anterior Arrangement'],
    ['ESP 5 / Lower Anterior Arrangement', 'ESP 5 / Lower Anterior Arrangement'],
    ['ESP 6 / Upper posterior Arrangement', 'ESP 6 / Upper posterior Arrangement'],
    ['ESP 7 / Lower posterior Arrangement', 'ESP 7 / Lower posterior Arrangement'],
    ['ESP 8 / waxing', 'ESP 8 / waxing'],
    ['ESP 9 / Upper arch Festooning', 'ESP 9 / Upper arch Festooning'],
    ['ESP 10 / Lower arch Festooning', 'ESP 10 / Lower arch Festooning'],
  ],
  3: [
    ['class I pt 1', 'class I pt 1'],
    ['class I pt 2', 'class I pt 2'],
    ['class I pt 3', 'class I pt 3'],
    ['class I pt 4', 'class I pt 4'],
    ['class I pt 5', 'class I pt 5'],
    ['Class ll - Part 1', 'Class ll - Part 1'],
    ['Class ll - Part 2', 'Class ll - Part 2'],
    ['Class ll - Part 3', 'Class ll - Part 3'],
    ['Class ll - Part 4', 'Class ll - Part 4'],
    ['Class ll - Part 5', 'Class ll - Part 5'],
  ],
  4: [
    ['part 1', 'part 1'],
    ['part 2', 'part 2'],
    ['part 3', 'part 3'],
    ['الإجراءات المتقدمة — الجزء الثاني', 'Advanced procedures — part two'],
    ['الحالات المركّبة', 'Complex combined cases'],
    ['تجنّب الأخطاء الشائعة', 'Avoiding common errors'],
    ['المراجعة العلمية والأدلة', 'Evidence and literature review'],
    ['بناء سمعة مهنية', 'Building a professional reputation'],
    ['ورشة عملية', 'Practical workshop'],
    ['مراجعة المرحلة الرابعة', 'Fourth stage review'],
  ],
  5: [
    ['الإتقان — نظرة شاملة', 'Mastery — the complete picture'],
    ['الحالات النادرة', 'Rare presentations'],
    ['اتخاذ القرار تحت الضغط', 'Decision-making under pressure'],
    ['إدارة العيادة', 'Practice management'],
    ['التعليم والإشراف', 'Teaching and supervision'],
    ['البحث والتطوير المهني', 'Research and professional development'],
    ['حالة شاملة — الجزء الأول', 'Comprehensive case — part one'],
    ['حالة شاملة — الجزء الثاني', 'Comprehensive case — part two'],
    ['الاستعداد للاعتماد المهني', 'Preparing for certification'],
    ['ختام البرنامج', 'Programme conclusion'],
  ],
};

const stageMeta: Omit<SeedStage, 'lessons' | 'accent'>[] = [
  {
    number: 1,
    slug: 'stage-1',
    titleAr: 'المرحلة الأولى',
    titleEn: 'First Stage',
    subtitleAr: 'الأساسيات',
    subtitleEn: 'Foundations',
    descriptionAr:
      'حجر الأساس للبرنامج بأكمله: المصطلحات، الأدوات، بروتوكولات السلامة، والتشريح التطبيقي الذي تُبنى عليه كل مرحلة تالية.',
    descriptionEn:
      'The bedrock of the whole programme: terminology, instruments, safety protocols and the applied anatomy every later stage is built on.',
  },
  {
    number: 2,
    slug: 'stage-2',
    titleAr: 'المرحلة الثانية',
    titleEn: 'Second Stage',
    subtitleAr: 'الأساسيات السريرية',
    subtitleEn: 'Clinical Basics',
    descriptionAr:
      'الانتقال من النظري إلى العيادة: تقييم المريض، التخطيط المبدئي، إدارة الألم، والتواصل الذي يصنع الفارق.',
    descriptionEn:
      'The move from theory to the chair: patient assessment, initial planning, pain management and the communication that makes the difference.',
  },
  {
    number: 3,
    slug: 'stage-3',
    titleAr: 'المرحلة الثالثة',
    titleEn: 'Third Stage',
    subtitleAr: 'الممارسة التطبيقية',
    subtitleEn: 'Applied Practice',
    descriptionAr:
      'الإجراءات المتوسطة خطوة بخطوة، مع اختيار المواد، وضبط الجودة، وإدارة الوقت داخل العيادة.',
    descriptionEn:
      'Intermediate procedures step by step, with material selection, quality control and clinical time management.',
  },
  {
    number: 4,
    slug: 'stage-4',
    titleAr: 'المرحلة الرابعة',
    titleEn: 'Fourth Stage',
    subtitleAr: 'التقنيات المتقدمة',
    subtitleEn: 'Advanced Techniques',
    descriptionAr:
      'التخطيط الرقمي، الإجراءات المتقدمة، والحالات المركّبة — مع تركيز صريح على تجنّب الأخطاء الشائعة.',
    descriptionEn:
      'Digital planning, advanced procedures and complex combined cases — with an explicit focus on avoiding common errors.',
  },
  {
    number: 5,
    slug: 'stage-5',
    titleAr: 'المرحلة الخامسة',
    titleEn: 'Fifth Stage',
    subtitleAr: 'الإتقان والحالات',
    subtitleEn: 'Mastery & Cases',
    descriptionAr:
      'المستوى الذي يجمع كل ما سبق: الحالات النادرة، القرار تحت الضغط، إدارة العيادة، والإشراف والتعليم.',
    descriptionEn:
      'The level that ties everything together: rare presentations, decisions under pressure, practice management, teaching and supervision.',
  },
];

const stageSpotlightr: Record<number, Record<number, string>> = {
  2: {
    0: 'https://videos.cdn.spotlightr.com/watch/MTkwMDg3OQ==?fallback=true',
    1: 'https://videos.cdn.spotlightr.com/watch/MTkwMDg4MA==?fallback=true',
    2: 'https://videos.cdn.spotlightr.com/watch/MTkwMDg4MQ==?fallback=true',
    3: 'https://videos.cdn.spotlightr.com/watch/MTg5MDc5NQ==?fallback=true',
    4: 'https://videos.cdn.spotlightr.com/watch/MTg5MDgwOQ==?fallback=true',
    5: 'https://videos.cdn.spotlightr.com/watch/MTg5MTAwNw==?fallback=true',
    6: 'https://videos.cdn.spotlightr.com/watch/MTg5MDc1Mw==?fallback=true',
    7: 'https://videos.cdn.spotlightr.com/watch/MTg5MDc0NA==?fallback=true',
    8: 'https://videos.cdn.spotlightr.com/watch/MTg5MDk5NA==?fallback=true',
    9: 'https://videos.cdn.spotlightr.com/watch/MTg5MDUxMw==?fallback=true',
  },
  3: {
    0: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU1MQ==?fallback=true',
    1: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU3Mw==?fallback=true',
    2: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU3Mg==?fallback=true',
    3: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU5MA==?fallback=true',
    4: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU5Mg==?fallback=true',
    5: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU5OQ==?fallback=true',
    6: 'https://videos.cdn.spotlightr.com/watch/MTg5MDU5Nw==?fallback=true',
    7: 'https://videos.cdn.spotlightr.com/watch/MTg5MDYwMA==?fallback=true',
    8: 'https://videos.cdn.spotlightr.com/watch/MTg5MDY1OQ==?fallback=true',
    9: 'https://videos.cdn.spotlightr.com/watch/MTg5MDY2MA==?fallback=true',
  },
  4: {
    0: 'https://videos.cdn.spotlightr.com/watch/MTg5MTAwMw==?fallback=true',
    1: 'https://videos.cdn.spotlightr.com/watch/MTg5MTAzNA==?fallback=true',
    2: 'https://videos.cdn.spotlightr.com/watch/MTg5MTAzNw==?fallback=true',
  },
};

export const seedStages: SeedStage[] = stageMeta.map((stage, index) => ({
  ...stage,
  accent: stageAccentOrder[index] ?? 'orange',
  lessons: (lessonTitles[stage.number] ?? []).map(([titleAr, titleEn], lessonIndex) => ({
    titleAr,
    titleEn,
    descriptionAr: `محاضرة ${lessonIndex + 1} ضمن ${stage.titleAr}.`,
    descriptionEn: `Lesson ${lessonIndex + 1} of the ${stage.titleEn.toLowerCase()}.`,
    // Realistic-looking runtimes so the UI can be judged; replace with the real
    // durations, which are read from Vimeo once a video id is set.
    durationSeconds: 900 + ((lessonIndex * 437) % 2100),
    ...(stage.number === 1 && lessonIndex === 0
      ? { vimeoVideoId: '1186033159', vimeoHash: 'fe27f5bb82' }
      : {}),
    ...(stageSpotlightr[stage.number]?.[lessonIndex]
      ? { vimeoVideoId: stageSpotlightr[stage.number][lessonIndex] }
      : {}),
  })),
}));

/** Whole Iraqi dinars, stored in the existing minor-unit column (dinars × 100). */
function iqd(dinars: number): number {
  return dinars * 100;
}

type SeedProduct = {
  slug: string;
  categorySlug: string;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  shortEn: string;
  descAr: string;
  descEn: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  featured: boolean;
  isNew: boolean;
  comingSoon?: boolean;
  salesCount: number;
  image: string;
  specs?: { labelAr: string; labelEn: string; valueAr: string; valueEn: string }[];
};

const steel = {
  labelAr: 'المادة',
  labelEn: 'Material',
  valueAr: 'فولاذ مقاوم للصدأ بدرجة طبية',
  valueEn: 'Medical-grade stainless steel',
} as const;

export const seedCategories = [
  {
    slug: 'stage-1',
    nameAr: 'أدوات المرحلة الأولى',
    nameEn: 'Stage 1 instruments',
    descriptionAr: 'أدوات الفحص والتحضير الأساسي: المرآة، المجس، المسبر، والملقط.',
    descriptionEn: 'Examination and foundation kit: mirror, explorer, probe and pliers.',
    image: '/store/instruments/mouth-mirror.jpg',
  },
  {
    slug: 'stage-2',
    nameAr: 'أدوات المرحلة الثانية',
    nameEn: 'Stage 2 instruments',
    descriptionAr: 'أدوات العيادة الأولى: التخدير، المصفوفة، والترميميّات الأساسية.',
    descriptionEn: 'First clinic kit: anaesthesia, matrix and basic restorative work.',
    image: '/store/instruments/aspirating-syringe.png',
  },
  {
    slug: 'stage-3',
    nameAr: 'أدوات المرحلة الثالثة',
    nameEn: 'Stage 3 instruments',
    descriptionAr: 'الحاجز المطاطي، الأدوات اللبيّة، وأدوات الكمبوزيت.',
    descriptionEn: 'Rubber dam, endodontic files and composite instruments.',
    image: '/store/instruments/rubber-dam-kit.png',
  },
  {
    slug: 'stage-4',
    nameAr: 'أدوات المرحلة الرابعة',
    nameEn: 'Stage 4 instruments',
    descriptionAr: 'كلابات القلع، الروافع، وطوابع الطبعات.',
    descriptionEn: 'Extraction forceps, elevators and impression trays.',
    image: '/store/instruments/extraction-forceps.jpg',
  },
  {
    slug: 'stage-5',
    nameAr: 'أدوات المرحلة الخامسة',
    nameEn: 'Stage 5 instruments',
    descriptionAr: 'الأدوات الجراحية ونظارات التكبير للإتقان السريري.',
    descriptionEn: 'Surgical instruments and loupes for clinical mastery.',
    image: '/store/instruments/clinical-loupes.png',
  },
  {
    slug: 'patience',
    nameAr: 'منتجات PATIENCE',
    nameEn: 'PATIENCE products',
    descriptionAr: 'قطع الهوية الرسمية — تُطرح قريباً.',
    descriptionEn: 'Official brand pieces — launching soon.',
    image: '/store/product-scrubs.svg',
  },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: 'mouth-mirror-no-5',
    categorySlug: 'stage-1',
    nameAr: 'مرآة الفم رقم 5',
    nameEn: 'Mouth Mirror No. 5',
    shortAr: 'مرآة فحص بسطح عاكس ومقبض مخروطي.',
    shortEn: 'Front-surface examination mirror with a cone-socket handle.',
    descAr:
      'مرآة فم قياسية رقم 5 بسطح أمامي يقلّل الصورة المزدوجة. مقبض من الفولاذ المقاوم للصدأ بدرجة طبية، مناسب للفحص اليومي في المرحلة الأولى.',
    descEn:
      'Standard No. 5 front-surface mouth mirror that reduces double image. Medical-grade stainless handle for daily examination work in stage one.',
    priceCents: iqd(12_000),
    compareAtCents: iqd(15_000),
    stock: 80,
    featured: true,
    isNew: false,
    salesCount: 214,
    image: '/store/instruments/mouth-mirror.jpg',
    specs: [steel, { labelAr: 'المقاس', labelEn: 'Size', valueAr: 'رقم 5', valueEn: 'No. 5' }],
  },
  {
    slug: 'explorer-no-23',
    categorySlug: 'stage-1',
    nameAr: 'مجس رقم 23 (Shepherd’s Hook)',
    nameEn: 'Explorer No. 23 (Shepherd’s Hook)',
    shortAr: 'مجس منجلي لكشف النخور والشقوق.',
    shortEn: 'Sickle explorer for caries and fissure detection.',
    descAr:
      'مجس Explorer رقم 23 بطرف منجلي حاد يعطي إحساساً لمسياً دقيقاً عند فحص الوهاد والشقوق والحواف الترميمية.',
    descEn:
      'No. 23 shepherd’s-hook explorer with a fine sickle tip for tactile detection of pits, fissures and restoration margins.',
    priceCents: iqd(12_000),
    compareAtCents: null,
    stock: 75,
    featured: true,
    isNew: false,
    salesCount: 198,
    image: '/store/instruments/explorer.jpg',
    specs: [steel, { labelAr: 'الطرف', labelEn: 'Tip', valueAr: 'منجلي #23', valueEn: 'Sickle #23' }],
  },
  {
    slug: 'williams-periodontal-probe',
    categorySlug: 'stage-1',
    nameAr: 'مسبار ويليامز اللثوي',
    nameEn: 'Williams Periodontal Probe',
    shortAr: 'مسبار مدرّج لقياس عمق الجيب اللثوي.',
    shortEn: 'Graduated probe for measuring pocket depth.',
    descAr:
      'مسبار ويليامز بعلامات 1–2–3–5–7–8–9–10 مم. الأداة الأساسية لتسجيل فحوص اللثة في المرحلة الأولى.',
    descEn:
      'Williams probe marked 1–2–3–5–7–8–9–10 mm. The foundation instrument for periodontal charting in stage one.',
    priceCents: iqd(15_000),
    compareAtCents: iqd(18_000),
    stock: 60,
    featured: true,
    isNew: false,
    salesCount: 176,
    image: '/store/instruments/periodontal-probe.jpg',
    specs: [steel, { labelAr: 'التدريج', labelEn: 'Markings', valueAr: '1–10 مم', valueEn: '1–10 mm' }],
  },
  {
    slug: 'cotton-pliers',
    categorySlug: 'stage-1',
    nameAr: 'ملقط القطن (College)',
    nameEn: 'Cotton Pliers (College)',
    shortAr: 'ملقط طويل لالتقاط القطن واللفائف.',
    shortEn: 'Long college tweezers for cotton and rolls.',
    descAr:
      'ملقط College بأطراف مسنّنة خفيفة يمسك القطن واللفائف والمواد الصغيرة داخل الفم دون انزلاق.',
    descEn:
      'College cotton pliers with lightly serrated beaks for cotton pellets, rolls and small materials inside the mouth.',
    priceCents: iqd(12_000),
    compareAtCents: null,
    stock: 90,
    featured: true,
    isNew: false,
    salesCount: 241,
    image: '/store/instruments/cotton-pliers.png',
    specs: [steel],
  },
  {
    slug: 'spoon-excavator',
    categorySlug: 'stage-1',
    nameAr: 'الحفّار الملعقي',
    nameEn: 'Spoon Excavator',
    shortAr: 'حفّار ثنائي الطرف لإزالة العاج الليّن.',
    shortEn: 'Double-ended excavator for soft dentine.',
    descAr:
      'حفّار ملعقي مزدوج الطرف يُستخدم لإزالة العاج النخر الليّن يدوياً قبل الترميم، من أدوات المرحلة الأولى الأساسية.',
    descEn:
      'Double-ended spoon excavator for hand removal of soft carious dentine before restoration — a core stage-one instrument.',
    priceCents: iqd(18_000),
    compareAtCents: null,
    stock: 55,
    featured: false,
    isNew: false,
    salesCount: 132,
    image: '/store/instruments/spoon-excavator.png',
    specs: [steel],
  },
  {
    slug: 'sickle-scaler',
    categorySlug: 'stage-1',
    nameAr: 'المقشطة المنجلية',
    nameEn: 'Sickle Scaler',
    shortAr: 'مقشطة لإزالة القلح فوق اللثوي.',
    shortEn: 'Scaler for supragingival calculus.',
    descAr:
      'مقشطة منجلية بطرف مدبّب لإزالة القلح فوق اللثوي من الأسطح المينائية في فحوص المرحلة الأولى.',
    descEn:
      'Pointed sickle scaler for removing supragingival calculus from enamel surfaces during stage-one examinations.',
    priceCents: iqd(18_000),
    compareAtCents: iqd(22_000),
    stock: 50,
    featured: false,
    isNew: false,
    salesCount: 121,
    image: '/store/instruments/scaler.jpg',
    specs: [steel],
  },
  {
    slug: 'cement-spatula',
    categorySlug: 'stage-1',
    nameAr: 'ملعقة الإسمنت',
    nameEn: 'Cement Spatula',
    shortAr: 'ملعقة مزج للإسمنت والمواد الحشوية.',
    shortEn: 'Mixing spatula for cements and liners.',
    descAr:
      'ملعقة إسمنت مرنة لمزج الأسمنت الزجاجي الشاردي وماءات الكالسيوم على اللوح الزجاجي.',
    descEn:
      'Flexible cement spatula for mixing glass ionomer and calcium hydroxide on a glass slab.',
    priceCents: iqd(10_000),
    compareAtCents: null,
    stock: 70,
    featured: false,
    isNew: false,
    salesCount: 164,
    image: '/store/instruments/cement-spatula.png',
    specs: [steel],
  },
  {
    slug: 'aspirating-syringe',
    categorySlug: 'stage-2',
    nameAr: 'محقنة التخدير الشافطة',
    nameEn: 'Aspirating Cartridge Syringe',
    shortAr: 'محقنة خرطوشة مع حلقة إبهام وخطاف شفط.',
    shortEn: 'Cartridge syringe with thumb ring and harpoon.',
    descAr:
      'محقنة تخدير موضعي شافطة لخرطوشة 1.8 مل، مع حلقة إبهام وخطاف (harpoon) للتحقق من عدم الحقن داخل وعاء دموي.',
    descEn:
      'Aspirating local-anaesthetic syringe for 1.8 ml cartridges, with thumb ring and harpoon so you can test you are not intravascular.',
    priceCents: iqd(35_000),
    compareAtCents: iqd(42_000),
    stock: 35,
    featured: true,
    isNew: false,
    salesCount: 97,
    image: '/store/instruments/aspirating-syringe.png',
    specs: [steel, { labelAr: 'الخرطوشة', labelEn: 'Cartridge', valueAr: '1.8 مل', valueEn: '1.8 ml' }],
  },
  {
    slug: 'tofflemire-retainer',
    categorySlug: 'stage-2',
    nameAr: 'حامل المصفوفة توفلماير',
    nameEn: 'Tofflemire Matrix Retainer',
    shortAr: 'مثبّت عالمي لأشرطة المصفوفة.',
    shortEn: 'Universal retainer for matrix bands.',
    descAr:
      'حامل Tofflemire العالمي يثبّت شريط المصفوفة حول السن أثناء الترميمات الصنف الثاني في المرحلة الثانية.',
    descEn:
      'Universal Tofflemire retainer that locks a matrix band around the tooth for class II restorations in stage two.',
    priceCents: iqd(22_000),
    compareAtCents: null,
    stock: 48,
    featured: false,
    isNew: false,
    salesCount: 88,
    image: '/store/instruments/tofflemire.png',
    specs: [steel],
  },
  {
    slug: 'amalgam-condenser',
    categorySlug: 'stage-2',
    nameAr: 'مكثّف الأملغم',
    nameEn: 'Amalgam Condenser',
    shortAr: 'مكثّف لتعبئة الأملغم داخل الحفرة.',
    shortEn: 'Plugger for packing amalgam into the cavity.',
    descAr:
      'مكثّف أملغم بطرف دائري مسطّح لتعبئة المادة على طبقات داخل التحضير.',
    descEn:
      'Flat-faced amalgam condenser (plugger) for packing restorative material in increments.',
    priceCents: iqd(18_000),
    compareAtCents: null,
    stock: 52,
    featured: false,
    isNew: false,
    salesCount: 79,
    image: '/store/instruments/amalgam-condenser.png',
    specs: [steel],
  },
  {
    slug: 'hollenback-carver',
    categorySlug: 'stage-2',
    nameAr: 'كاشط هولنبِك',
    nameEn: 'Hollenback Carver',
    shortAr: 'كاشط لنحت الإطباق والحواف.',
    shortEn: 'Carver for occlusal anatomy and margins.',
    descAr:
      'كاشط Hollenback ثنائي الطرف لنحت التشريح الإطباقي وإزالة الزوائد من حواف الترميم.',
    descEn:
      'Double-ended Hollenback carver for occlusal anatomy and clearing excess at restoration margins.',
    priceCents: iqd(20_000),
    compareAtCents: null,
    stock: 44,
    featured: false,
    isNew: false,
    salesCount: 71,
    image: '/store/instruments/hollenback-carver.png',
    specs: [steel],
  },
  {
    slug: 'ball-burnisher',
    categorySlug: 'stage-2',
    nameAr: 'الملمّع الكروي',
    nameEn: 'Ball Burnisher',
    shortAr: 'ملمّع كروي لتنعيم سطح الترميم.',
    shortEn: 'Ball tip for smoothing restorations.',
    descAr:
      'ملمّع كروي يُستخدم لتكييف وتنعيم سطح الأملغم أو الكمبوزيت بعد الرص.',
    descEn:
      'Ball burnisher used to adapt and smooth amalgam or composite after condensation.',
    priceCents: iqd(17_000),
    compareAtCents: null,
    stock: 46,
    featured: false,
    isNew: false,
    salesCount: 66,
    image: '/store/instruments/ball-burnisher.png',
    specs: [steel],
  },
  {
    slug: 'articulating-paper-forceps',
    categorySlug: 'stage-2',
    nameAr: 'ملقط ورق العض',
    nameEn: 'Articulating Paper Forceps',
    shortAr: 'ملقط ميلر لإمساك ورق الإطباق.',
    shortEn: 'Miller forceps for articulating paper.',
    descAr:
      'ملقط ورق إطباق بأطراف عريضة يمسك ورقة العض لفحص نقاط الإطباق بعد الترميم.',
    descEn:
      'Wide-beak Miller forceps that hold articulating paper for checking occlusal contacts after restoration.',
    priceCents: iqd(15_000),
    compareAtCents: null,
    stock: 58,
    featured: false,
    isNew: true,
    salesCount: 54,
    image: '/store/instruments/articulating-forceps.png',
    specs: [steel],
  },
  {
    slug: 'rubber-dam-kit',
    categorySlug: 'stage-3',
    nameAr: 'طقم الحاجز المطاطي',
    nameEn: 'Rubber Dam Kit',
    shortAr: 'ثاقب، كلابات، إطار، وملاقط الحاجز.',
    shortEn: 'Punch, clamp forceps, frame and clamps.',
    descAr:
      'طقم عزل كامل: ثاقب الحاجز، ملقط الكلابات، إطار Young، ومجموعة كلابات. أساس العمل اللبيّ والترميمي في المرحلة الثالثة.',
    descEn:
      'Complete isolation kit: dam punch, clamp forceps, Young frame and a set of clamps. Foundation for endodontic and restorative work in stage three.',
    priceCents: iqd(65_000),
    compareAtCents: iqd(80_000),
    stock: 22,
    featured: true,
    isNew: true,
    salesCount: 48,
    image: '/store/instruments/rubber-dam-kit.png',
    specs: [steel],
  },
  {
    slug: 'dg16-endodontic-explorer',
    categorySlug: 'stage-3',
    nameAr: 'مجس لبي DG16',
    nameEn: 'DG16 Endodontic Explorer',
    shortAr: 'مجس طويل لفتحات الأقنية.',
    shortEn: 'Long explorer for locating canal orifices.',
    descAr:
      'مجس DG16 بطرفين طويلين مستقيمين تقريباً لاستكشاف أرضية الحجرة اللبية وتحديد فوهات الأقنية.',
    descEn:
      'DG16 explorer with long, nearly straight tips for probing the pulp-chamber floor and locating canal orifices.',
    priceCents: iqd(20_000),
    compareAtCents: null,
    stock: 40,
    featured: false,
    isNew: false,
    salesCount: 41,
    image: '/store/instruments/probe-no6.jpg',
    specs: [steel, { labelAr: 'النوع', labelEn: 'Type', valueAr: 'DG16', valueEn: 'DG16' }],
  },
  {
    slug: 'k-files',
    categorySlug: 'stage-3',
    nameAr: 'مبارد K اللبيّة',
    nameEn: 'Endodontic K-Files',
    shortAr: 'مجموعة مبارد يدوية لتنظيف الأقنية.',
    shortEn: 'Hand files for cleaning and shaping canals.',
    descAr:
      'مجموعة مبارد K بأحجام ISO متدرّجة لتنظيف وتشكيل الأقنية الجذرية يدوياً في المرحلة الثالثة.',
    descEn:
      'Set of ISO-sized K-files for hand cleaning and shaping of root canals in stage three.',
    priceCents: iqd(28_000),
    compareAtCents: iqd(35_000),
    stock: 38,
    featured: false,
    isNew: true,
    salesCount: 63,
    image: '/store/instruments/k-files.png',
    specs: [
      steel,
      { labelAr: 'المقاسات', labelEn: 'Sizes', valueAr: 'ISO متدرّج', valueEn: 'Assorted ISO' },
    ],
  },
  {
    slug: 'composite-instrument',
    categorySlug: 'stage-3',
    nameAr: 'أداة وضع الكمبوزيت',
    nameEn: 'Composite Placement Instrument',
    shortAr: 'أداة غير لاصقة لتشكيل الكمبوزيت.',
    shortEn: 'Non-stick paddles for placing composite.',
    descAr:
      'أداة كمبوزيت بطرفين مسطّحين مطليّين لتقليل التصاق الراتنج أثناء الرص والتشكيل.',
    descEn:
      'Double-ended composite instrument with coated paddles that reduce resin stick during placement and contouring.',
    priceCents: iqd(38_000),
    compareAtCents: null,
    stock: 30,
    featured: false,
    isNew: true,
    salesCount: 57,
    image: '/store/instruments/composite-instrument.png',
    specs: [steel],
  },
  {
    slug: 'plastic-filling-instrument',
    categorySlug: 'stage-3',
    nameAr: 'أداة الحشو البلاستيكية',
    nameEn: 'Plastic Filling Instrument',
    shortAr: 'أداة مسطّحة لوضع المواد الحشوية.',
    shortEn: 'Flat paddles for placing filling materials.',
    descAr:
      'أداة حشو بلاستيكية كلاسيكية لوضع الإسمنت والبطانات والمواد الترميمية داخل التحضير.',
    descEn:
      'Classic plastic filling instrument for placing cements, liners and restorative materials into the preparation.',
    priceCents: iqd(16_000),
    compareAtCents: null,
    stock: 42,
    featured: false,
    isNew: false,
    salesCount: 39,
    image: '/store/instruments/plastic-filling.png',
    specs: [steel],
  },
  {
    slug: 'forceps-150',
    categorySlug: 'stage-4',
    nameAr: 'كلاب قلع علوية #150',
    nameEn: 'Upper Universal Forceps #150',
    shortAr: 'كلاب عالمية لأسنان الفك العلوي.',
    shortEn: 'Universal forceps for maxillary teeth.',
    descAr:
      'كلاب قلع عالمية رقم 150 لأسنان الفك العلوي. مقابض عريضة ولقمة منحنية قليلاً لتطبيق قوة قلع مضبوطة في المرحلة الرابعة.',
    descEn:
      'Universal #150 extraction forceps for maxillary teeth. Broad handles and a slightly offset beak for controlled stage-four extractions.',
    priceCents: iqd(75_000),
    compareAtCents: iqd(90_000),
    stock: 18,
    featured: true,
    isNew: false,
    salesCount: 44,
    image: '/store/instruments/extraction-forceps.jpg',
    specs: [steel, { labelAr: 'الرقم', labelEn: 'Pattern', valueAr: '#150', valueEn: '#150' }],
  },
  {
    slug: 'forceps-151',
    categorySlug: 'stage-4',
    nameAr: 'كلاب قلع سفلية #151',
    nameEn: 'Lower Universal Forceps #151',
    shortAr: 'كلاب عالمية لأسنان الفك السفلي.',
    shortEn: 'Universal forceps for mandibular teeth.',
    descAr:
      'كلاب قلع عالمية رقم 151 لأسنان الفك السفلي، بلقمة منحنية للأسفل تناسب تشريح الفك السفلي.',
    descEn:
      'Universal #151 extraction forceps for mandibular teeth, with a downward-curved beak matching lower-arch anatomy.',
    priceCents: iqd(75_000),
    compareAtCents: iqd(90_000),
    stock: 18,
    featured: false,
    isNew: false,
    salesCount: 41,
    image: '/store/instruments/lower-forceps.png',
    specs: [steel, { labelAr: 'الرقم', labelEn: 'Pattern', valueAr: '#151', valueEn: '#151' }],
  },
  {
    slug: 'straight-elevator',
    categorySlug: 'stage-4',
    nameAr: 'رافعة مستقيمة',
    nameEn: 'Straight Elevator',
    shortAr: 'رافعة لخلع السن قبل الكلاب.',
    shortEn: 'Elevator to luxate the tooth before forceps.',
    descAr:
      'رافعة قلع مستقيمة (Coupland / straight) لخلع الرباط وتوسيع السنخ قبل استخدام الكلاب.',
    descEn:
      'Straight (Coupland-style) elevator used to luxate the periodontal ligament and expand the socket before forceps.',
    priceCents: iqd(45_000),
    compareAtCents: null,
    stock: 24,
    featured: false,
    isNew: false,
    salesCount: 52,
    image: '/store/instruments/elevator.jpg',
    specs: [steel],
  },
  {
    slug: 'periosteal-elevator',
    categorySlug: 'stage-4',
    nameAr: 'رافعة السمحاق (Molt)',
    nameEn: 'Periosteal Elevator (Molt)',
    shortAr: 'رافعة لرفع الشريحة والسمحاق.',
    shortEn: 'Elevator for reflecting flaps and periosteum.',
    descAr:
      'رافعة سمحاق Molt بطرف ملعقي عريض وآخر أدق لرفع الشريحة المخاطية السمحاقية في الجراحة الفموية.',
    descEn:
      'Molt periosteal elevator with a broad spoon end and a finer end for reflecting mucoperiosteal flaps in oral surgery.',
    priceCents: iqd(40_000),
    compareAtCents: null,
    stock: 26,
    featured: false,
    isNew: false,
    salesCount: 37,
    image: '/store/instruments/periosteal-elevator.png',
    specs: [steel],
  },
  {
    slug: 'impression-trays',
    categorySlug: 'stage-4',
    nameAr: 'طوابع الطبعات',
    nameEn: 'Impression Trays',
    shortAr: 'طابع علوي وسفلي مثقّب للطبعات.',
    shortEn: 'Perforated upper and lower impression trays.',
    descAr:
      'زوج طوابع معدنية مثقّبة (علوي وسفلي) لأخذ طبعات الألجينات في المرحلة الرابعة.',
    descEn:
      'Pair of perforated metal trays (upper and lower) for alginate impressions in stage four.',
    priceCents: iqd(30_000),
    compareAtCents: iqd(38_000),
    stock: 28,
    featured: false,
    isNew: true,
    salesCount: 33,
    image: '/store/instruments/impression-trays.png',
    specs: [steel],
  },
  {
    slug: 'needle-holder',
    categorySlug: 'stage-5',
    nameAr: 'حامل الإبر Mayo-Hegar',
    nameEn: 'Mayo-Hegar Needle Holder',
    shortAr: 'حامل إبر بسنّادة للخياطة الجراحية.',
    shortEn: 'Ratcheted holder for surgical suturing.',
    descAr:
      'حامل إبر Mayo-Hegar بفكوك مسنّنة وسنّادة قفل للخياطة الفموية في المرحلة الخامسة.',
    descEn:
      'Mayo-Hegar needle holder with serrated jaws and a ratchet lock for oral suturing in stage five.',
    priceCents: iqd(42_000),
    compareAtCents: null,
    stock: 20,
    featured: false,
    isNew: false,
    salesCount: 29,
    image: '/store/instruments/needle-holder.png',
    specs: [steel],
  },
  {
    slug: 'scalpel-handle-no-3',
    categorySlug: 'stage-5',
    nameAr: 'مقبض مشرط رقم 3',
    nameEn: 'Scalpel Handle No. 3',
    shortAr: 'مقبض Bard-Parker لشفرات 10–15.',
    shortEn: 'Bard-Parker handle for blades 10–15.',
    descAr:
      'مقبض مشرط رقم 3 يناسب الشفرات 10 و11 و12 و15 المستخدمة في الشقوق المخاطية.',
    descEn:
      'No. 3 scalpel handle compatible with blades 10, 11, 12 and 15 for mucosal incisions.',
    priceCents: iqd(12_000),
    compareAtCents: null,
    stock: 34,
    featured: false,
    isNew: false,
    salesCount: 36,
    image: '/store/instruments/scalpel-handle.png',
    specs: [steel, { labelAr: 'الشفرات', labelEn: 'Blades', valueAr: '10–15', valueEn: '10–15' }],
  },
  {
    slug: 'adson-tissue-forceps',
    categorySlug: 'stage-5',
    nameAr: 'ملقط أنسجة أدسون',
    nameEn: 'Adson Tissue Forceps',
    shortAr: 'ملقط 1×2 أسنان للأنسجة الرخوة.',
    shortEn: '1×2 toothed forceps for soft tissue.',
    descAr:
      'ملقط Adson بأسنان 1×2 يمسك الحافة المخاطية بلطف أثناء الشريحة والخياطة.',
    descEn:
      'Adson 1×2 tissue forceps for gently holding mucosal edges during flap reflection and suturing.',
    priceCents: iqd(22_000),
    compareAtCents: null,
    stock: 27,
    featured: false,
    isNew: false,
    salesCount: 31,
    image: '/store/instruments/adson-forceps.png',
    specs: [steel],
  },
  {
    slug: 'surgical-scissors',
    categorySlug: 'stage-5',
    nameAr: 'مقص جراحي',
    nameEn: 'Surgical Scissors',
    shortAr: 'مقص Mayo منحني للأنسجة والخيوط.',
    shortEn: 'Curved Mayo scissors for tissue and suture.',
    descAr:
      'مقص جراحي منحني لقص الأنسجة الرخوة وخيوط الجراحة الفموية.',
    descEn:
      'Curved surgical scissors for soft tissue and oral suture cutting.',
    priceCents: iqd(32_000),
    compareAtCents: null,
    stock: 22,
    featured: false,
    isNew: false,
    salesCount: 24,
    image: '/store/instruments/surgical-scissors.png',
    specs: [steel],
  },
  {
    slug: 'clinical-loupes',
    categorySlug: 'stage-5',
    nameAr: 'نظارات التكبير السريرية 3.5×',
    nameEn: 'Clinical Loupes 3.5×',
    shortAr: 'تكبير 3.5× على إطار خفيف.',
    shortEn: '3.5× magnification on a lightweight frame.',
    descAr:
      'نظارات تكبير سريرية 3.5× بمجال رؤية واسع وعمق ميدان مريح للعمل الدقيق في المرحلة الخامسة.',
    descEn:
      '3.5× surgical loupes with a wide field and comfortable depth of focus for fine stage-five work.',
    priceCents: iqd(250_000),
    compareAtCents: iqd(310_000),
    stock: 10,
    featured: true,
    isNew: true,
    salesCount: 19,
    image: '/store/instruments/clinical-loupes.png',
    specs: [
      { labelAr: 'التكبير', labelEn: 'Magnification', valueAr: '3.5×', valueEn: '3.5×' },
    ],
  },
  {
    slug: 'stage-companion-guide',
    categorySlug: 'patience',
    nameAr: 'الدليل المرافق للمراحل',
    nameEn: 'PATIENCE Stage Companion Guide',
    shortAr: 'دليل مطبوع بهوية PATIENCE.',
    shortEn: 'A printed guide in the PATIENCE identity.',
    descAr: 'دليل مطبوع يرافق المراحل الخمس. يُطرح ضمن مجموعة منتجات PATIENCE قريباً.',
    descEn: 'A printed companion to the five stages. Launching with the PATIENCE collection soon.',
    priceCents: iqd(25_000),
    compareAtCents: iqd(35_000),
    stock: 0,
    featured: false,
    isNew: false,
    comingSoon: true,
    salesCount: 0,
    image: '/store/product-guide.svg',
  },
  {
    slug: 'case-notebook',
    categorySlug: 'patience',
    nameAr: 'دفتر الحالات PATIENCE',
    nameEn: 'PATIENCE Case Notebook',
    shortAr: 'دفتر لتوثيق الحالات السريرية.',
    shortEn: 'A notebook for clinical case records.',
    descAr: 'دفتر بهوية PATIENCE لتوثيق الحالات. متاح قريباً.',
    descEn: 'A PATIENCE-branded case notebook. Available soon.',
    priceCents: iqd(12_000),
    compareAtCents: null,
    stock: 0,
    featured: false,
    isNew: false,
    comingSoon: true,
    salesCount: 0,
    image: '/store/product-notebook.svg',
  },
  {
    slug: 'patience-scrubs',
    categorySlug: 'patience',
    nameAr: 'زي PATIENCE',
    nameEn: 'PATIENCE Scrubs',
    shortAr: 'زي سريري بتطريز المصباح.',
    shortEn: 'Clinical scrubs with the lamp mark.',
    descAr: 'زي PATIENCE السريري. يُطرح قريباً.',
    descEn: 'PATIENCE clinical scrubs. Launching soon.',
    priceCents: iqd(45_000),
    compareAtCents: iqd(60_000),
    stock: 0,
    featured: false,
    isNew: false,
    comingSoon: true,
    salesCount: 0,
    image: '/store/product-scrubs.svg',
  },
  {
    slug: 'lamp-pin',
    categorySlug: 'patience',
    nameAr: 'دبّوس مصباح PATIENCE',
    nameEn: 'PATIENCE Lamp Pin',
    shortAr: 'دبّوس معدني بشعار المصباح.',
    shortEn: 'Enamel pin of the lamp mark.',
    descAr: 'دبّوس المصباح الرسمي. يُطرح قريباً.',
    descEn: 'The official lamp pin. Launching soon.',
    priceCents: iqd(8_000),
    compareAtCents: null,
    stock: 0,
    featured: false,
    isNew: false,
    comingSoon: true,
    salesCount: 0,
    image: '/store/product-pin.svg',
  },
];

