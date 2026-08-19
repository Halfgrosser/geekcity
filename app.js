const data = window.__TRIKO_DATA__;
const chart = document.querySelector("#chart");
const card = document.querySelector("#episode-card");
const bars = document.querySelector("#year-bars");
const ruDate = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

if (!data?.episodes?.length) {
  chart.innerHTML = '<p class="error">Не удалось загрузить данные. Запустите <code>npm run sync</code>.</p>';
  throw new Error("Episode data is missing");
}

const episodes = data.episodes
  .map((episode) => ({ ...episode, date: new Date(`${episode.publication}T12:00:00`) }))
  .sort((left, right) => left.date - right.date);

document.querySelector("#updated-at").textContent = `Данные обновлены ${ruDate.format(new Date(`${data.updatedAt}T12:00:00`))}`;
renderChart();
renderStats();
renderBars();

function renderChart() {
  const now = startOfWeek(new Date());
  const first = startOfWeek(episodes[0].date);
  const firstYear = isoWeekInfo(first).year;
  const currentYear = isoWeekInfo(now).year;
  const byWeek = new Map();

  for (const episode of episodes) {
    const key = weekKey(episode.date);
    const bucket = byWeek.get(key) || [];
    bucket.push(episode);
    byWeek.set(key, bucket);
  }

  const rows = [];
  for (let year = currentYear; year >= firstYear; year -= 1) {
    const weeks = [];
    const weekCount = isoWeeksInYear(year);
    for (let week = 1; week <= 53; week += 1) {
      if (week > weekCount) {
        weeks.push('<span class="week is-empty" aria-hidden="true"></span>');
        continue;
      }

      const date = dateFromIsoWeek(year, week);
      const key = `${year}-W${String(week).padStart(2, "0")}`;
      const found = byWeek.get(key) || [];
      const isBeforeFirst = date < first;
      const isFuture = date > now;
      const state = isBeforeFirst || isFuture ? "is-future" : found.length ? "is-release" : "is-hiatus";
      const stateLabel = isBeforeFirst ? "до старта подкаста" : isFuture ? "будущая неделя" : "выпусков не было";
      const label = found.length
        ? `${week}-я неделя ${year}: ${found.map(episodeLabel).join(", ")}`
        : `${week}-я неделя ${year}: ${stateLabel}`;
      weeks.push(
        `<button class="week ${state}${found.length > 1 ? " is-multi" : ""}" data-date="${date.toISOString()}" data-key="${key}" data-state="${state}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"></button>`,
      );
    }
    rows.push(`<div class="chart-row"><span class="chart-year">${year}</span><div class="weeks">${weeks.join("")}</div></div>`);
  }

  chart.innerHTML = rows.join("");
  chart.querySelectorAll("button.week").forEach((button) => {
    button.addEventListener("click", () => {
      chart.querySelector(".is-selected")?.classList.remove("is-selected");
      button.classList.add("is-selected");
      showWeek(button.dataset.date, byWeek.get(button.dataset.key) || [], button.dataset.state);
    });
  });
}

function showWeek(isoDate, found, state) {
  const monday = new Date(isoDate);
  const sunday = addDays(monday, 6);
  card.hidden = false;
  card.classList.toggle("is-pause", !found.length);

  if (!found.length) {
    const heading = state === "is-hiatus" ? "На этой неделе выпусков не было" : "Неделя вне календаря выпусков";
    card.innerHTML = `
      <div class="episode-card__date">${ruDate.format(monday)} — ${ruDate.format(sunday)}</div>
      <h3>${heading}</h3>`;
    return;
  }

  card.innerHTML = `
    <div class="episode-card__date">${ruDate.format(monday)} — ${ruDate.format(sunday)}</div>
    ${found
      .map(
        (episode) => `<article class="episode-line">
          <div>
            <p class="episode-line__meta">${episode.number ? `Выпуск #${escapeHtml(episode.number)}` : "Спецвыпуск"}${episode.duration ? ` · ${formatDuration(episode.duration)}` : ""}</p>
            <h3>${escapeHtml(episode.title)}</h3>
          </div>
          ${episode.link ? `<a href="${escapeHtml(episode.link)}" target="_blank" rel="noreferrer" aria-label="Открыть выпуск «${escapeHtml(episode.title)}»">Слушать ↗</a>` : ""}
        </article>`,
      )
      .join("")}`;
}

function renderStats() {
  const now = startOfWeek(new Date());
  const weekSet = new Set(episodes.map((episode) => weekKey(episode.date)));
  const firstWeek = startOfWeek(episodes[0].date);
  const latest = episodes.at(-1);
  let longest = 0;
  let longestStart = null;
  let longestEnd = null;
  let run = 0;
  let runStart = null;

  for (let cursor = firstWeek; cursor <= now; cursor = addDays(cursor, 7)) {
    if (weekSet.has(weekKey(cursor))) {
      run = 0;
      runStart = null;
    } else {
      if (run === 0) runStart = new Date(cursor);
      run += 1;
      if (run > longest) {
        longest = run;
        longestStart = new Date(runStart);
        longestEnd = addDays(cursor, 6);
      }
    }
  }

  const latestWeek = startOfWeek(latest.date);
  const current = Math.max(0, Math.round((now - latestWeek) / 604800000));
  setText("stat-releases", episodes.length);
  setText("stat-current", current);
  setText("stat-current-note", plural(current, "полная неделя", "полные недели", "полных недель"));
  setText("stat-longest", longest);
  setText("stat-longest-note", plural(longest, "неделя без выпусков", "недели без выпусков", "недель без выпусков"));
  setText("stat-longest-range", `с ${ruDate.format(longestStart)} по ${ruDate.format(longestEnd)}`);
  setText("stat-latest", latest.number ? `#${latest.number}` : "Спецвыпуск");
  setText("stat-latest-note", `${ruDate.format(latest.date)} · ${latest.title}`);
}

function renderBars() {
  const firstYear = episodes[0].date.getFullYear();
  const latestYear = episodes.at(-1).date.getFullYear();
  const years = Array.from({ length: latestYear - firstYear + 1 }, (_, index) => latestYear - index);
  const counts = new Map(years.map((year) => [year, 0]));
  episodes.forEach((episode) => counts.set(episode.date.getFullYear(), counts.get(episode.date.getFullYear()) + 1));
  const max = Math.max(...counts.values());
  bars.innerHTML = years
    .map((year) => {
      const count = counts.get(year);
      return `<div class="year-bar">
        <span>${year}</span>
        <span class="year-bar__track"><i class="year-bar__fill" style="width:${(count / max) * 100}%"></i></span>
        <span class="year-bar__value">${count} ${plural(count, "выпуск", "выпуска", "выпусков")}</span>
      </div>`;
    })
    .join("");
}

function isoWeekInfo(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return {
    year: target.getUTCFullYear(),
    week: Math.ceil(((target - yearStart) / 86400000 + 1) / 7),
  };
}

function isoWeeksInYear(year) {
  return isoWeekInfo(new Date(year, 11, 28, 12)).week;
}

function weekKey(date) {
  const { year, week } = isoWeekInfo(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function dateFromIsoWeek(year, week) {
  const fourth = new Date(year, 0, 4, 12);
  return addDays(startOfWeek(fourth), (week - 1) * 7);
}

function addDays(date, count) {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function episodeLabel(episode) {
  return episode.number ? `#${episode.number} ${episode.title}` : episode.title;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
}

function setText(id, text) {
  document.querySelector(`#${id}`).textContent = text;
}

function plural(number, one, few, many) {
  const n10 = number % 10;
  const n100 = number % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
