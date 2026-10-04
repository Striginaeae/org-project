import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Compass, Anchor, ChevronLeft, ChevronRight, Landmark, Cog, Sparkles,
  Wallet, Car, ShieldCheck, Snowflake, X, MapPin, ExternalLink,
} from 'lucide-react'
import stops from './data/stops.json'

const CATEGORIES = ['Все', 'Наука', 'Индустрия', 'Стратегия и Флот', 'Культура и Этнос']

const DAYS = [
  { day: 1, title: 'Кандалакшский залив и Кольская АЭС', ids: [1, 2] },
  { day: 2, title: 'Хибины (Апатит) и Ловозеро (Саамы)', ids: [3, 4] },
  { day: 3, title: 'Мончегорск и Кольская сверхглубокая (СГ-3)', ids: [5, 6] },
  { day: 4, title: 'Мурманск: ледокол «Ленин», мемориал «Алёша» и Североморск', ids: [7, 8, 9] },
  { day: 5, title: 'Териберка и выход к Баренцеву морю', ids: [10] },
]

const ECONOMICS = [
  {
    icon: Wallet,
    title: 'Ориентировочный бюджет',
    text: 'Средний чек 6 000 – 8 500 ₽/сутки на человека: аренда кроссовера, проживание, топливо АИ-95, входные билеты.',
  },
  {
    icon: Car,
    title: 'Логистика и транспорт',
    text: 'Трасса Р-21 «Кола», специфика зимников, необходимость полного привода для Териберки.',
  },
  {
    icon: ShieldCheck,
    title: 'Погранзона и ЗАТО',
    text: 'Особенности въезда в Североморск (спецпропуска через Госуслуги / штаб СФ) и приграничный статус Печенгского района.',
  },
  {
    icon: Snowflake,
    title: 'Сезонные окна',
    text: 'Полярный день (июнь–июль, круглосуточный свет) против сезона северного сияния (сентябрь–март).',
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
    if (stop) map.flyTo(stop.coords, 9, { duration: 1.2 })
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
          Нажмите на номер маршрута, чтобы открыть карточку объекта.
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
  const [day, setDay] = useState(1)

  const active = stops.find((s) => s.id === activeId) || null
  const path = stops.map((s) => s.coords)
  const currentDay = DAYS.find((d) => d.day === day)

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
            «Исследовательская экспедиция через 10 опорных точек Заполярья: от древних поморских
            стоянок до атомных ледоколов и глубочайшей скважины Земли.»
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['10', 'Ключевых точек'],
              ['~950 км', 'Протяжённость маршрута'],
              ['66°33′ N', 'Пересечение полярного круга'],
              ['5 дней', 'Расчётное время экспедиции'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="font-serif text-3xl font-bold text-cyan-400">{value}</div>
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
          <h2 className="font-serif text-3xl tracking-tight text-slate-50">Сценарий 5-дневной экспедиции</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.day}
                onClick={() => setDay(d.day)}
                className={
                  'rounded-lg border px-4 py-2 text-sm transition ' +
                  (day === d.day
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 text-slate-400 hover:border-slate-600')
                }
              >
                День {d.day}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-xs font-semibold tracking-widest text-cyan-400">ДЕНЬ {currentDay.day}</p>
            <h3 className="mt-1 font-serif text-2xl tracking-tight text-slate-50">{currentDay.title}</h3>
            <ol className="mt-5 space-y-3 border-l border-slate-700 pl-5">
              {currentDay.ids.map((id) => {
                const s = stops.find((x) => x.id === id)
                return (
                  <li key={id} className="relative">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                      {s.order}
                    </span>
                    <button onClick={() => openStop(id)} className="text-left">
                      <span className="font-medium text-slate-100 hover:text-cyan-300">{s.name}</span>
                      <span className="block text-sm text-slate-400">{s.shortDesc}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
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

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-8 text-sm text-slate-500">
          <p>Учебный проект НИУ ВШЭ по дисциплине «ОРГ». Авторы: [Имя Фамилия], [Имя Фамилия].</p>
          <a
            href="https://github.com/"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
          >
            GitHub <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs">
            Тексты подготовлены на основе открытых источников и носят ознакомительный характер;
            перед поездкой уточняйте актуальные условия въезда и работы объектов.
          </p>
        </div>
      </footer>
    </div>
  )
}