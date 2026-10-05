import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Compass, Anchor, ChevronLeft, ChevronRight, Landmark, Cog, Sparkles,
  Wallet, Bus, ShieldCheck, Snowflake, X, MapPin, ExternalLink, Bed,
} from 'lucide-react'
import stops from './data/stops.json'
import plans from './data/plans.json'
import hotelClusters from './data/hotels.json'

const CATEGORIES = ['Все', 'Наука', 'Индустрия', 'Стратегия и Флот', 'Культура и Этнос', 'Природа']

const ECONOMICS = [
  {
    icon: Wallet,
    title: 'Бюджет: реальные цены',
    text: 'Ледокол «Ленин» — 800 ₽, краеведческий музей — 700 ₽ (студентам 350 ₽). Автобус до Териберки — 776 ₽, до Кировска — около 1 500–1 700 ₽. Отели: Мурманск от 1 700 ₽/сутки, Кировск от 3 000 ₽/сутки.',
  },
  {
    icon: Bus,
    title: 'Логистика и транспорт',
    text: 'До Мурманска: самолёт из Москвы от 3 700 ₽ (2 ч 35 мин), поезд от 3 382 ₽ (от 1 суток 7 часов), на машине около 1 950 км по трассам «Нева» и Р-21 «Кола». Внутри области всё доступно автобусом из Мурманска: Териберка (№ 241Э, 09:00, обратно 16:30; с 1 июня 2026 — вт, чт, сб, вс и праздники) и Кировск (3 ч 20 мин – 4 ч 25 мин).',
  },
  {
    icon: ShieldCheck,
    title: 'Закрытые и приграничные объекты',
    text: 'Доступ к Кольской АЭС, территории «Североникеля», скважине СГ-3 (приграничная зона Печенгского района) и Североморску (ЗАТО) ограничен: нужны пропуска или спецразрешения. Поэтому СГ-3 в маршруте представлена керном в краеведческом музее, а Мончегорск — «снаружи», по пути в Кировск.',
  },
  {
    icon: Snowflake,
    title: 'Сезонные окна',
    text: 'Зима (декабрь–февраль): полярная ночь (примерно со 2 декабря до середины января), северное сияние, снегоходы, хаски, айс-флоатинг. Лето (июнь–июль): полярный день и морские прогулки к китам. Горные лыжи в Хибинах: с ноября по май. Зимой дорога до Териберки может затянуться из-за погоды.',
  },
]

function pad(n) {
  return n < 10 ? '0' + n : String(n)
}

function makeIcon(order, active, dim) {
  const pulse = active
    ? '<span class="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping"></span>'
    : ''
  const ring = active
    ? 'border-white ring-4 ring-cyan-400/60 scale-110'
    : 'border-cyan-300/70'
  const opacity = dim ? 'opacity-30' : 'opacity-100'
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html:
      '<div class="relative flex h-9 w-9 items-center justify-center ' + opacity + '">' +
      pulse +
      '<div class="relative flex h-9 w-9 items-center justify-center rounded-full border-2 bg-cyan-600 text-xs font-bold text-white shadow-lg transition ' +
      ring + '">' + pad(order) + '</div></div>',
  })
}

function FlyToStop({ stop }) {
  const map = useMap()
  useEffect(() => {
    if (stop) map.flyTo(stop.coords, 10, { duration: 1.2 })
  }, [stop, map])
  return null
}

function Inspector({ stop, onPrev, onNext, onClose }) {
  if (!stop) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/80 p-8 text-center">
        <MapPin className="mb-3 h-8 w-8 text-cyan-400" />
        <p className="font-serif text-xl tracking-tight text-slate-100">Выберите точку на карте</p>
        <p className="mt-2 text-sm text-slate-400">
          Нажмите на номер маршрута или на кнопку с номером над картой, чтобы открыть карточку объекта.
        </p>
        <button
          onClick={onNext}
          className="mt-5 rounded-lg border border-cyan-500 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20"
        >
          Начать с точки 01
        </button>
      </div>
    )
  }

  const visit = stop.visit
    ? [['Дорога', stop.visit.how], ['Стоимость', stop.visit.cost], ['Время', stop.visit.hours]].filter(([, v]) => v)
    : []

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
      <div className="relative h-52 bg-gradient-to-br from-slate-800 to-slate-950">
        <img
          src={stop.imageUrl}
          alt={stop.name}
          className="h-full w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 rounded-full bg-slate-950/70 p-1.5 text-slate-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="absolute bottom-3 left-4 rounded border border-cyan-500 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold tracking-widest text-cyan-300">
          ТОЧКА {pad(stop.order)} / {pad(stops.length)}
        </span>
      </div>

      <div className="space-y-5 p-5">
        <header>
          <h3 className="font-serif text-2xl tracking-tight text-slate-50">{stop.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{stop.locationName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
              {stop.category}
            </span>
            <span className="font-mono text-slate-500">
              {stop.coords[0].toFixed(3)}° N, {stop.coords[1].toFixed(3)}° E
            </span>
          </div>
        </header>

        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          {stop.fullText.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Landmark className="h-4 w-4" /> Историко-культурная и мемориальная значимость
            </div>
            <p className="text-sm text-slate-300">{stop.significance.historical}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Cog className="h-4 w-4" /> Экономическое и стратегическое значение для РФ
            </div>
            <p className="text-sm text-slate-300">{stop.significance.economicStrategic}</p>
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-cyan-500 bg-cyan-500/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-4 w-4" /> Редкий факт / Архивная справка
          </div>
          <p className="text-sm text-slate-200">{stop.funFact}</p>
        </div>

        {visit.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Bus className="h-4 w-4" /> Как попасть
            </div>
            <dl className="space-y-1.5 text-sm text-slate-300">
              {visit.map(([k, v]) => (
                <div key={k}>
                  <dt className="inline text-slate-500">{k}: </dt>
                  <dd className="inline">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex justify-between gap-3">
          <button
            onClick={onPrev}
            disabled={stop.order === 1}
            className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500 disabled:opacity-30 disabled:hover:border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" /> Предыдущая
          </button>
          <button
            onClick={onNext}
            disabled={stop.order === stops.length}
            className="flex items-center gap-1 rounded-lg border border-cyan-500 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-30"
          >
            Следующая <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState(null)
  const [category, setCategory] = useState('Все')
  const [planId, setPlanId] = useState(plans[0].id)
  const [activeCluster, setActiveCluster] = useState(hotelClusters[0].cluster)

  const active = stops.find((s) => s.id === activeId) || null
  const path = stops.map((s) => s.coords)
  const currentPlan = plans.find((p) => p.id === planId)
  const currentHotels = hotelClusters.find((c) => c.cluster === activeCluster) || hotelClusters[0]

  const go = (delta) => {
    if (!active) return setActiveId(stops[0].id)
    const next = stops.find((s) => s.order === active.order + delta)
    if (next) setActiveId(next.id)
  }

  const openStop = (id) => {
    setActiveId(id)
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-cyan-400" />
            <Anchor className="hidden h-4 w-4 text-cyan-600 sm:block" />
            <span className="font-serif text-lg font-semibold tracking-tight text-slate-50">
              ФОРПОСТ АРКТИКИ
            </span>
            <span className="ml-1 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] tracking-widest text-slate-400">
              НИУ ВШЭ
            </span>
          </div>
          <nav className="flex gap-4 text-sm text-slate-400">
            <a href="#map" className="hover:text-cyan-300">Карта</a>
            <a href="#itinerary" className="hover:text-cyan-300">Маршрут</a>
            <a href="#economics" className="hover:text-cyan-300">Логистика</a>
            <a href="#hotels" className="hover:text-cyan-300">Отели</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <p className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
            КОЛЬСКИЙ ПОЛУОСТРОВ • НАУЧНО-ИНДУСТРИАЛЬНЫЙ МАРШРУТ
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold tracking-tight text-slate-50 sm:text-7xl">
            Форпост Арктики
          </h1>
          <p className="mt-3 font-serif text-lg italic text-slate-400 sm:text-xl">
            От поморских берегов до атомного флота
          </p>
          <p className="mt-6 max-w-2xl text-lg italic text-slate-300">
            «Десять опорных точек Заполярья, до которых можно добраться на общественном транспорте: от
            атомного ледокола и керна сверхглубокой скважины до апатитовых рудников Хибин и берега
            Баренцева моря.»
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['10', 'Ключевых точек'],
              ['4', 'Сценария: 3 и 5 дней'],
              ['66°33′ N', 'Полярный круг'],
              ['~130 км', 'Мурманск — Териберка'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="font-sans text-3xl font-bold text-cyan-400">{value}</div>
                <div className="mt-1 text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <h2 className="font-serif text-3xl tracking-tight text-slate-50">Интерактивная карта маршрута</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={
                'rounded-full border px-4 py-1.5 text-sm transition ' +
                (category === c
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-800 text-slate-400 hover:border-slate-600')
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {stops.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              title={s.name}
              className={
                'h-8 w-8 rounded-full border text-xs font-bold transition ' +
                (s.id === activeId
                  ? 'border-white bg-cyan-600 text-white'
                  : 'border-slate-700 text-slate-400 hover:border-cyan-500')
              }
            >
              {pad(s.order)}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="isolate h-[60vh] min-h-[420px] overflow-hidden rounded-xl border border-slate-800 lg:col-span-3 lg:h-[780px]">
            <MapContainer
              center={[68.2, 34.5]}
              zoom={6.5}
              zoomSnap={0.5}
              scrollWheelZoom={false}
              className="h-full w-full bg-slate-950"
            >
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
                className="dark-tiles"
              />
              <Polyline
                positions={path}
                pathOptions={{ color: '#22d3ee', weight: 2, dashArray: '6 8', opacity: 0.8 }}
              />
              {stops.map((s) => (
                <Marker
                  key={s.id}
                  position={s.coords}
                  icon={makeIcon(s.order, s.id === activeId, category !== 'Все' && s.category !== category)}
                  zIndexOffset={s.id === activeId ? 1000 : 0}
                  eventHandlers={{ click: () => setActiveId(s.id) }}
                />
              ))}
              <FlyToStop stop={active} />
            </MapContainer>
          </div>

          <div className="lg:col-span-2">
            <Inspector
              stop={active}
              onPrev={() => go(-1)}
              onNext={() => go(1)}
              onClose={() => setActiveId(null)}
            />
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section id="itinerary" className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
          <h2 className="font-serif text-3xl tracking-tight text-slate-50">Сценарии поездки</h2>
          <p className="mt-2 text-sm text-slate-400">
            Выберите длительность и темп. Названия точек кликабельны и открывают карточку на карте.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={
                  'rounded-lg border px-4 py-2 text-sm transition ' +
                  (planId === p.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 text-slate-400 hover:border-slate-600')
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentPlan.days.map((d) => (
              <div key={d.day} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">{d.day}</p>
                <h3 className="mt-1 font-serif text-xl tracking-tight text-slate-50">{d.title}</h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {d.items.map((it, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-28 shrink-0 pt-0.5 font-mono text-xs text-slate-500">{it.time}</span>
                      {it.stopId ? (
                        <button
                          onClick={() => openStop(it.stopId)}
                          className="text-left text-cyan-300 hover:underline"
                        >
                          {it.text}
                        </button>
                      ) : (
                        <span className="text-slate-300">{it.text}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Economics */}
      <section id="economics" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <h2 className="font-serif text-3xl tracking-tight text-slate-50">Бюджет и логистика</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ECONOMICS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
              <Icon className="h-6 w-6 text-cyan-400" />
              <h3 className="mt-3 font-serif text-xl tracking-tight text-slate-50">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hotels / Base Camps Section */}
      <section id="hotels" className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
          <div className="flex items-center gap-3">
            <Bed className="h-7 w-7 text-cyan-400" />
            <h2 className="font-serif text-3xl tracking-tight text-slate-50">Базы экспедиции и проживание</h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Опорные отели и проверенные мотели по маршруту с актуальным порядком цен на сезон.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {hotelClusters.map((c) => (
              <button
                key={c.cluster}
                onClick={() => setActiveCluster(c.cluster)}
                className={
                  'rounded-lg border px-4 py-2 text-sm transition ' +
                  (activeCluster === c.cluster
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 text-slate-400 hover:border-slate-600')
                }
              >
                {c.clusterName}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs italic text-slate-400">
            {currentHotels.description}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {currentHotels.items.map((hotel) => (
              <div
                key={hotel.name}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                      {hotel.tier}
                    </span>
                    <span className="font-mono text-sm font-semibold text-cyan-400">
                      {hotel.price}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-bold text-slate-100">{hotel.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{hotel.location}</p>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{hotel.features}</p>
                </div>
                <div className="mt-5 border-t border-slate-800/80 pt-4">
                  <a
                    href={hotel.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Сайт объекта <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-8 text-sm text-slate-500">
          <p>Учебный проект НИУ ВШЭ по дисциплине «ОРГ». Авторы: Евдокимов Данила, Солдатова Кристина.</p>
          <a
            href="https://github.com/"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
          >
            GitHub <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs">
            Тексты подготовлены на основе открытых источников и носят ознакомительный характер;
            цены и расписания могут меняться, перед поездкой уточняйте актуальные условия.
          </p>
        </div>
      </footer>
    </div>
  )
}