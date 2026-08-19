import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceUrl = "https://cloud.mave.digital/34811";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "data/episodes.js");
const xml = process.env.MAVE_RSS_FILE
  ? await readFile(process.env.MAVE_RSS_FILE, "utf8")
  : await loadFeed(sourceUrl);
const manualEpisodes = [
  {
    guid: "manual-pilot-episode",
    number: "0",
    title: "Подкаст /без названия/. Пилотный выпуск. «Мстители: Финал»",
    publication: "2019-05-07",
    link: "https://geekcity.ru/podkast-bez-nazvaniya-pilotnyj-vypusk-mstiteli-final/",
    duration: null,
  },
  {
    guid: "manual-episode-3",
    number: "3",
    title: "Подкаст «Чуть Выше Плинтуса». Выпуск 3. «E3, Люди Икс и митинги»",
    publication: "2019-06-18",
    link: "",
    duration: null,
  },
];
const episodeAnnotations = new Map([
  [
    "0",
    {
      topicsSource: "https://geekcity.ru/podkast-bez-nazvaniya-pilotnyj-vypusk-mstiteli-final/",
      topics: [
        { time: "00:00:00", title: "Вступление" },
        { time: "00:01:48", title: "Что не так с возвращением Человека-Муравья" },
        { time: "00:04:28", title: "Тор и его пузо" },
        { time: "00:08:57", title: "Путешествия во времени и проблемы с этим" },
        { time: "00:13:00", title: "Сколько раз мы плакали?" },
        { time: "00:22:50", title: "Насколько достоин Капитан Америка" },
        { time: "00:27:45", title: "Возвращение старых актеров" },
        { time: "00:29:32", title: "ОПГ «Мстители» против Таноса" },
        { time: "00:33:30", title: "В фильме нет эпика?" },
        { time: "00:36:15", title: "Кого мы потеряли" },
        { time: "00:37:19", title: "Такое не повторить" },
        { time: "00:43:16", title: "Будущее MCU" },
        { time: "00:58:40", title: "Подведение итогов и прощание" },
      ],
    },
  ],
  [
    "3",
    {
      topics: [
        { time: "00:00", title: "Краткий обзор третьего сезона «Джессики Джонс»" },
        { time: "00:25", title: "Как попасть на митинге в автозак (спойлер: это легко)" },
        { time: "10:00", title: "Чем хороша Dying Light 2" },
        { time: "11:50", title: "Где игры, Konami??? (Очень нецензурный бугурт Афонина)" },
        { time: "18:35", title: "Watch Dogs Legion — выглядит свежо и интересно" },
        { time: "26:26", title: "Облачный гейминг: Google Stadia, xCloud — почему это круто и почему за этим будущее" },
        { time: "33:35", title: "Обзор игры про Мстителей по слитой экранке и превью" },
        { time: "38:41", title: "Почему провалился «Темный Феникс»" },
        { time: "49:00", title: "Почему новые «Люди в Черном» — такая ***" },
        { time: "54:15", title: "Смерть [спойлер] в «Ходячих Мертвецах»" },
      ],
    },
  ],
  [
    "10",
    {
      topicNote: "Таймкоды не публиковались: авторы сохранили цельный рассказ о киноадаптациях Человека-Паука.",
      topicsSource:
        "https://geekcity.ru/podkast-chut-vyshe-plintusa-vypusk-10-konflikt-disney-i-sony-ego-prichiny-i-posledstviya-dlya-cheloveka-pauka/",
    },
  ],
  [
    "15",
    {
      topicNote: "Таймкоды не публиковались: выпуск посвящён одной теме — фильму «Джокер».",
      topicsSource:
        "https://geekcity.ru/podkast-chut-vyshe-plintusa-vypusk-15-pochemu-dzhoker-nastolko-xorosh/",
    },
  ],
  [
    "17",
    {
      topicNote: "В статье перечислены темы выпуска без отметок времени.",
      topicsSource:
        "https://geekcity.ru/podkast-chut-vyshe-plintusa-vypusk-17-v-chem-genialnost-xranitelej/",
      topics: [
        { title: "Почему мы решили поговорить про «Хранителей»?" },
        { title: "Чем был известен Алан Мур до комикса?" },
        { title: "Что нового было в «Хранителях»?" },
        {
          title: "Почему экранизация Зака Снайдера сильно проигрывает первоисточнику и в чем ее основные проблемы?",
        },
        { title: "Before Watchmen, Doomsday Clock и другие попытки DC использовать вселенную Мура" },
      ],
    },
  ],
  [
    "18",
    {
      topicNote: "Таймкоды не публиковались: выпуск целиком посвящен фильму «Терминатор: Темные Судьбы».",
      topicsSource:
        "https://geekcity.ru/podkast-chut-vyshe-plintusa-vypusk-18-terminator-kotoryj-snova-ne-smog/",
    },
  ],
  [
    "19",
    {
      topicNote: "В статье перечислены темы выпуска без отметок времени.",
      topicsSource:
        "https://geekcity.ru/podkast-vozvrashhaetsya-obsuzhdaem-novogo-pauka-i-podvodim-itogi-goda/",
      topics: [
        { title: "«Человек-Паук: Нет пути домой» — просто ААААА" },
        { title: "Чем нам запомнились новые сериалы Marvel для Disney+" },
        { title: "«Черная вдова» — not great, not terrible" },
        { title: "Что же все-таки не так со «Снайдеркатом»?" },
        { title: "«Майор Гром: Чумной доктор» — хорошее русское кино или политическая агитка?" },
        { title: "«Дюна» — хорошо, но ждем вторую часть" },
        { title: "«Не время умирать», или как Дэниел Крейг полюбил Вархаммер (что? да!)" },
      ],
    },
  ],
  [
    "30",
    {
      topics: [
        { time: "00:00", title: "Кринжовые шутки про то, где мы были." },
        {
          time: "03:00",
          title: "восхваляем (не все) «Звездные Войны: Андор» и не можем выговорить имя Стеллан Скарсгард.",
        },
        {
          time: "23:30",
          title: "Сереже понравился Cyberpunk: Edgerunners, Ваня (который начал проходить игру) и Никита травят шутки про аниме.",
        },
        {
          time: "27:00",
          title: "Ваня плюется от Call of Duty: Modern Warfare 2, Никита почти плюется от Gotham Knights, Сережа кайфует от Ghost of Tsushima. Самые конченные шутки тут.",
        },
        { time: "41:50", title: "«Черная Пантера: Ваканда Навеки» — хорошо, но есть нюансы." },
        { time: "51:30", title: "«Черный Адам» — фильм года, который изменил иерархию нашего IQ." },
      ],
    },
  ],
  [
    "45",
    {
      topicNote:
        "Таймкодов в этот раз не будет, так как тема одна на выпуск. Но вы узнаете, как покорить женщину свиданием с походом на «Морбиуса» (она в студии и прокомментирует это), как Сережа продюсирует Киновселенную Bubble и в каких он трусах на записи, а еще что принес в студию Ваня и что не смотрел Никита.",
    },
  ],
  [
    "63",
    {
      topicNote: "Темы выпуска опубликованы без отметок времени.",
      topics: [
        { title: "Прошлое, настоящее и будущее «Сказок старой Руси»" },
        { title: "Погружение в славянскую мифологию, источники проекта и фейки" },
        { title: "Влияние «Сказок старой Руси» на популяризацию славянского фентези в стране" },
      ],
    },
  ],
  [
    "71",
    {
      topicsSource:
        "https://geekcity.ru/andor-sorvigolova-clair-obscur-expedition-33-i-odni-iz-nas-podkast-muzhchiny-v-triko/",
      topics: [
        { time: "00:00", title: "вернулись, тру-экспириенс игры S.T.A.L.K.E.R. 2 на Xbox: баги даже на консолях" },
        { time: "05:40", title: "рефлексируем о финале 1 сезона «Сорвиголова: Рожденный Заново»" },
        { time: "11:20", title: "«Звездные Войны: Андор» — лучшие Star Wars на сегодня" },
        { time: "30:22", title: "эмоциональные качели 2 сезона сериала «Одни из Нас»" },
        { time: "47:32", title: "Clair Obscur: Expedition 33 — триумф французского гейминга вне Ubisoft" },
      ],
    },
  ],
  [
    "72",
    {
      topicsSource:
        "https://geekcity.ru/gromoverzhcy-doom-the-dark-ages-minecraft-v-kino-final-andora-i-greshniki-podkast-muzhchiny-v-triko/",
      topics: [
        { time: "00:00", title: "Эксгмызационист и жизнь без Вани Скородумова" },
        { time: "04:46", title: "Никита признается в любви финалу «Андора» и рассказывает кулстори о фейле в кинотеатре" },
        { time: "09:00", title: "«Громовержцы*» — фильм Marvel, который смог через з?" },
        { time: "31:30", title: "Doom: The Dark Ages — хорошая игра, но…" },
        { time: "46:30", title: "«Грешники» — режиссерский триумф Райана Куглера" },
        { time: "56:37", title: "«Minecraft в кино» — 2 часа брейнрота, отвратительно, фильм года" },
      ],
    },
  ],
]);

const channel = xml.replace(/<item>[\s\S]*$/u, "");
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gu)].map((match) => match[1]);
const rssEpisodes = items
  .map((item) => {
    const topics = extractTopics(tag(item, "itunes:summary") || tag(item, "description"));
    return {
      guid: tag(item, "guid"),
      number: tag(item, "itunes:episode"),
      title: tag(item, "title"),
      publication: toIsoDate(tag(item, "pubDate")),
      link: tag(item, "link"),
      duration: Number(tag(item, "itunes:duration")) || null,
      ...(topics.length ? { topics } : {}),
    };
  })
  .filter((episode) => episode.title && episode.publication);
const episodes = [
  ...rssEpisodes.map(annotateEpisode),
  ...manualEpisodes
    .filter((manual) => !rssEpisodes.some((episode) => episode.number === manual.number))
    .map(annotateEpisode),
]
  .sort((left, right) => left.publication.localeCompare(right.publication))
  .map(renumberEpisode);

if (episodes.length < 90) {
  throw new Error(`Only ${episodes.length} episodes parsed; refusing to overwrite data`);
}

const payload = {
  source: sourceUrl,
  title: tag(channel, "title"),
  cover: attribute(channel, "itunes:image", "href"),
  updatedAt: toIsoDate(tag(channel, "lastBuildDate")) || new Date().toISOString().slice(0, 10),
  episodes,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `window.__TRIKO_DATA__ = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
console.log(`Saved ${episodes.length} episodes to ${output}`);

function annotateEpisode(episode) {
  return { ...episode, ...(episodeAnnotations.get(episode.number) || {}) };
}

function renumberEpisode(episode) {
  const previousNumber = Number(episode.number);
  if (!Number.isInteger(previousNumber)) return episode;

  const number = String(previousNumber + 1);
  const title = episode.title.replace(
    new RegExp(`(Выпуск\\s*(?:№\\s*)?)${previousNumber}(?!\\d)`, "iu"),
    `$1${number}`,
  );

  return { ...episode, number, title };
}

async function loadFeed(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "geekcity-hiatus-chart/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`Mave RSS returned ${response.status}`);
  return response.text();
}

function tag(source, name) {
  const match = source.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "u"));
  return cleanXml(match?.[1] || "");
}

function attribute(source, name, attributeName) {
  const match = source.match(new RegExp(`<${name}[^>]*\\s${attributeName}="([^"]+)"[^>]*>`, "u"));
  return decodeEntities(match?.[1] || "");
}

function cleanXml(value) {
  return decodeEntities(value.replace(/^<!\[CDATA\[/u, "").replace(/\]\]>$/u, "").trim());
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function extractTopics(value) {
  const text = value
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/?(?:p|li|ul|ol|div|h\d)[^>]*>/giu, "\n")
    .replace(/<[^>]+>/gu, "")
    .replaceAll("\r", "")
    .replaceAll("\u00a0", " ")
    .replace(/таймкоды\s*:?\s*(?=\d)/giu, "Таймкоды:\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return text
    .map((line) => line.match(/^(\d{1,2}[.:]\d{2}(?::\d{2})?)\s*(?:[-–—]\s*)?(.+)$/u))
    .filter(Boolean)
    .map((match) => ({ time: match[1].replaceAll(".", ":"), title: match[2].trim() }))
    .filter((topic) => topic.title);
}

function toIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
}
