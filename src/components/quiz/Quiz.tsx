/**
 * Quiz v2 (Preact, client:only). Una sola ruta /quiz.
 *  - Paso 0: modo (Ayudame a elegir / Conozco de componentes).
 *  - Paso 1: sistema operativo (Windows / macOS / Linux / da igual).
 *  - Luego el flujo se ramifica según modo (+ línea Apple si es macOS).
 * Las respuestas se mapean a NotebookFilters (shared/quiz-map) y navegamos a
 * /resultado. Si el presupuesto es acotado, se marca strict=1 (precio duro).
 */
import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';
import { quizPicksToFilters, filtersToQuery, hasPinnedBudget } from '../../shared/quiz-map.mjs';
import { trackQuizStart, trackQuizStep, trackQuizComplete } from '../../lib/analytics';

type Picks = Record<string, string>;
interface StepDef {
  key: string;
  eyebrow: string;
  q: string;
  sub: string;
  cols: string;
  titleSize: string;
  options: { v: string; label: string; sub?: string }[];
}

const RESULT_KEY = 'qnc_quiz_result';
const TTL_MS = 24 * 60 * 60 * 1000;

const STEPS: Record<string, StepDef> = {
  modo: {
    key: 'modo', eyebrow: 'Cómo empezar', q: '¿Cómo querés elegir tu notebook?',
    sub: 'Las dos llegan al mismo catálogo, solo cambian las preguntas.', cols: '1fr', titleSize: '17px',
    options: [
      { v: 'guiado', label: 'Ayudame a elegir', sub: 'No sé mucho de componentes — guiame por uso' },
      { v: 'tecnico', label: 'Conozco de componentes', sub: 'Quiero filtrar por specs (RAM, CPU, GPU…)' },
    ],
  },
  os: {
    key: 'os', eyebrow: 'Sistema operativo', q: '¿Qué sistema operativo querés?',
    sub: 'Filtramos solo modelos compatibles.', cols: '1fr', titleSize: '17px',
    options: [
      { v: 'windows', label: 'Windows', sub: 'Lo más común y compatible' },
      { v: 'mac', label: 'macOS', sub: 'Las MacBook de Apple' },
      { v: 'linux', label: 'Linux', sub: 'Libre, ideal para programar' },
      { v: '', label: 'Me da igual', sub: 'Mostrame todas' },
    ],
  },
  uso: {
    key: 'uso', eyebrow: 'Uso principal', q: '¿Para qué la vas a usar?',
    sub: 'Elegí el uso principal.', cols: '1fr 1fr', titleSize: '15px',
    options: [
      { v: 'gaming', label: 'Gaming' }, { v: 'estudio', label: 'Estudio' }, { v: 'diseno', label: 'Diseño' },
      { v: 'programacion', label: 'Programar' }, { v: 'basico', label: 'Uso básico' }, { v: 'altagama', label: 'Alta gama' },
    ],
  },
  prioridad: {
    key: 'prioridad', eyebrow: 'Prioridad', q: '¿Qué no puede faltarte?',
    sub: 'Lo más importante para vos.', cols: '1fr', titleSize: '16px',
    options: [
      { v: 'potencia', label: 'Potencia bruta', sub: 'Para jugar y renderizar pesado' },
      { v: 'bateria', label: 'Batería que dure', sub: 'Todo el día sin enchufe' },
      { v: 'precio', label: 'Cuidar el bolsillo', sub: 'El mejor valor por lo que pago' },
      { v: 'portatil', label: 'Liviana y portátil', sub: 'Para llevar a todos lados' },
    ],
  },
  macline: {
    key: 'macline', eyebrow: 'Línea Apple', q: '¿Qué línea de MacBook?',
    sub: 'Solo equipos con chip Apple.', cols: '1fr', titleSize: '17px',
    options: [
      { v: 'air', label: 'MacBook Air', sub: 'Liviana, para uso diario y estudio' },
      { v: 'pro', label: 'MacBook Pro', sub: 'Más potencia para creación y desarrollo' },
      { v: 'cualquiera', label: 'Cualquiera', sub: 'Mostrame las dos' },
    ],
  },
  ram: {
    key: 'ram', eyebrow: 'Memoria RAM', q: '¿Cuánta memoria RAM?',
    sub: 'Más RAM = más apps a la vez sin trabarse.', cols: '1fr', titleSize: '16px',
    options: [
      { v: '8', label: '8 GB', sub: 'Uso normal' }, { v: '16', label: '16 GB', sub: 'Multitarea cómoda' },
      { v: '32', label: '32 GB o más', sub: 'Bestia' },
    ],
  },
  procesador: {
    key: 'procesador', eyebrow: 'Procesador', q: '¿Qué procesador?',
    sub: 'El cerebro: define la potencia general.', cols: '1fr 1fr', titleSize: '15px',
    options: [
      { v: 'i3', label: 'i3 / Ryzen 3' }, { v: 'i5', label: 'i5 / Ryzen 5' },
      { v: 'i7', label: 'i7 / Ryzen 7' }, { v: 'i9', label: 'i9 / Ryzen 9' },
    ],
  },
  almacenamiento: {
    key: 'almacenamiento', eyebrow: 'Almacenamiento', q: '¿Cuánto SSD?',
    sub: 'Espacio para tus archivos y programas.', cols: '1fr', titleSize: '16px',
    options: [{ v: '256', label: '256 GB' }, { v: '512', label: '512 GB' }, { v: '1024', label: '1 TB o más' }],
  },
  gpu: {
    key: 'gpu', eyebrow: 'Placa de video', q: '¿Necesitás placa de video dedicada?',
    sub: 'Clave para gaming y edición/3D.', cols: '1fr', titleSize: '16px',
    options: [
      { v: 'si', label: 'Sí, la necesito', sub: 'Gaming, edición, 3D' },
      { v: 'no', label: 'No hace falta', sub: 'Uso general' },
      { v: 'igual', label: 'Me da igual' },
    ],
  },
  tamano: {
    key: 'tamano', eyebrow: 'Tamaño', q: '¿Qué tamaño preferís?',
    sub: 'Pensá dónde la vas a usar.', cols: '1fr', titleSize: '16px',
    options: [
      { v: 'chica', label: 'Chica · 13-14"', sub: 'Liviana, fácil de transportar' },
      { v: 'media', label: 'Media · 15"', sub: 'El equilibrio más común' },
      { v: 'grande', label: 'Grande · 16-17"', sub: 'Más pantalla, menos portátil' },
    ],
  },
  presupuesto: {
    key: 'presupuesto', eyebrow: 'Presupuesto', q: '¿Hasta cuánto querés gastar?',
    sub: 'Lo respetamos: solo te mostramos en ese rango.', cols: '1fr', titleSize: '16px',
    options: [
      { v: 'hasta_700k', label: 'Menos de $700.000' },
      { v: '700k_1m', label: '$700.000 a $1.000.000' },
      { v: '1m_2m', label: '$1.000.000 a $2.000.000' },
      { v: '2m_4m', label: '$2.000.000 a $4.000.000' },
      { v: 'sin_limite', label: 'El presupuesto no es problema' },
    ],
  },
};

const ICONS: Record<string, string> = {
  guiado: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  tecnico: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>',
  windows: '<rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/>',
  mac: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  linux: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  '': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  gaming: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258"/>',
  estudio: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  diseno: '<circle cx="13.5" cy="6.5" r=".7" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".7" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".7" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".7" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  programacion: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  basico: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  altagama: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6M2 9h20"/>',
  potencia: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  bateria: '<rect width="16" height="10" x="2" y="7" rx="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/>',
  precio: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/>',
  portatil: '<path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
  air: '<rect width="18" height="12" x="3" y="4" rx="2"/><path d="M2 20h20"/>',
  pro: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="2" x2="22" y1="20" y2="20"/>',
  cualquiera: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>',
  '8': '<rect width="18" height="12" x="3" y="8" rx="2"/><path d="M7 8v8M11 8v8M15 8v8"/>',
  '16': '<rect width="18" height="12" x="3" y="8" rx="2"/><path d="M7 8v8M11 8v8M15 8v8M19 8v8"/>',
  '32': '<rect width="18" height="12" x="3" y="8" rx="2"/><path d="M6 8v8M10 8v8M14 8v8M18 8v8"/>',
  i3: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/>',
  i5: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/>',
  i7: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/>',
  i9: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/>',
  '256': '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/>',
  '512': '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/>',
  '1024': '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/>',
  si: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  no: '<rect width="18" height="12" x="3" y="4" rx="2"/><path d="M2 20h20"/>',
  igual: '<path d="M5 12h14M5 6h14M5 18h14"/>',
  chica: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  media: '<rect width="18" height="12" x="3" y="4" rx="2"/><path d="M2 20h20"/>',
  grande: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/>',
  hasta_700k: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',
  '700k_1m': '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',
  '1m_2m': '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',
  '2m_4m': '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',
  sin_limite: '<path d="M9.5 7.5 12 5l2.5 2.5M5 12l-2.5 2.5L5 17M19 12l2.5 2.5L19 17M14.5 16.5 12 19l-2.5-2.5"/><circle cx="12" cy="12" r="3"/>',
};

function Icon({ k }: { k: string }) {
  const paths = ICONS[k] ?? '<circle cx="12" cy="12" r="9"/>';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      dangerouslySetInnerHTML={{ __html: paths }} />
  );
}

function buildFlow(picks: Picks): StepDef[] {
  const s = STEPS;
  if (picks.modo === 'tecnico') return [s.modo, s.os, s.ram, s.procesador, s.almacenamiento, s.gpu, s.tamano, s.presupuesto];
  if (picks.modo === 'guiado') {
    if (picks.os === 'mac') return [s.modo, s.os, s.macline, s.uso, s.presupuesto, s.tamano];
    return [s.modo, s.os, s.uso, s.prioridad, s.presupuesto, s.tamano];
  }
  return [s.modo];
}

export default function Quiz() {
  const [picks, setPicks] = useState<Picks>({});
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'resume' | 'quiz'>('loading');
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  // Mount: decide resume screen vs fresh quiz (browser-only).
  useEffect(() => {
    trackQuizStart('A');
    const params = new URLSearchParams(window.location.search);
    const modoParam = params.get('modo');
    const forceRestart = params.has('restart');

    let saved: { url: string; at: number } | null = null;
    try {
      const raw = localStorage.getItem(RESULT_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.url && p.at && Date.now() - p.at < TTL_MS) saved = p;
      }
    } catch {}

    if (saved && !forceRestart && !modoParam) {
      setSavedUrl(saved.url);
      setPhase('resume');
      return;
    }
    if (modoParam === 'guiado' || modoParam === 'tecnico') {
      setPicks({ modo: modoParam });
      setStep(1); // saltar la pregunta de modo
    }
    setPhase('quiz');
  }, []);

  const flow = useMemo(() => buildFlow(picks), [picks]);
  const i = Math.min(step, flow.length - 1);
  const current = flow[i];
  const total = flow.length;
  const last = i === total - 1;
  const answer = current ? picks[current.key] : undefined;
  // 'os' permite "" (me da igual); para el resto exigimos un valor no vacío.
  const ready = current?.key === 'os' ? picks.os !== undefined : !!answer;
  // Antes de elegir modo el flujo solo tiene 1 paso; mostramos un total estimado.
  const totalShown = picks.modo ? total : 6;
  const progress = Math.round(((i + 1) / totalShown) * 100);

  useEffect(() => {
    if (phase === 'quiz' && current) trackQuizStep('A', i + 1, current.key);
  }, [i, phase]);

  const pick = useCallback((key: string, v: string) => {
    setPicks((prev) => ({ ...prev, [key]: v }));
  }, []);

  const goNext = useCallback(() => {
    const f = buildFlow(picks);
    if (i >= f.length - 1) {
      const filters = quizPicksToFilters(picks);
      trackQuizComplete('A', filters);
      const q = filtersToQuery(filters);
      const strict = hasPinnedBudget(picks) ? '&strict=1' : '';
      const url = `/resultado?${q}${strict}`;
      try { localStorage.setItem(RESULT_KEY, JSON.stringify({ url, at: Date.now() })); } catch {}
      window.location.href = url;
    } else {
      setStep(i + 1);
      try { history.pushState({ quizStep: i + 1 }, ''); } catch {}
    }
  }, [picks, i]);

  const goBack = useCallback(() => { if (i > 0) setStep(i - 1); }, [i]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (e.state?.quizStep != null) setStep(e.state.quizStep);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (phase === 'loading') {
    return <div class="quiz-panel quiz-loading" aria-busy="true"><span class="quiz-spin" /></div>;
  }

  if (phase === 'resume') {
    return (
      <div class="quiz-panel quiz-resume">
        <div class="qr-ico"><Icon k="guiado" /></div>
        <h2 class="qr-title">Ya hiciste el test</h2>
        <p class="qr-sub">¿Querés ver los resultados que te dimos o preferís volver a hacerlo desde cero?</p>
        <div class="qr-actions">
          <a class="btn btn-primary ctaQuiz qr-btn" href={savedUrl ?? '/resultado'}>Ver mis resultados</a>
          <button class="qr-redo" type="button" onClick={() => {
            try { localStorage.removeItem(RESULT_KEY); } catch {}
            setPicks({}); setStep(0); setPhase('quiz');
          }}>Volver a hacer el test</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div class="quiz-panel">
      <div class="quiz-top">
        <button class="quiz-back" onClick={goBack} type="button" aria-label="Atrás" style={{ opacity: i === 0 ? 0.25 : 1 }} disabled={i === 0}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
        </button>
        <div class="quiz-track"><div class="quiz-fill" style={{ width: `${progress}%` }} /></div>
        <span class="quiz-steplabel">Paso {i + 1} de {totalShown}</span>
      </div>

      <div class="quiz-head" key={current.key}>
        <div class="quiz-eyebrow">{current.eyebrow}</div>
        <h2 class="quiz-q">{current.q}</h2>
        <p class="quiz-subq">{current.sub}</p>
      </div>

      <div class="quiz-options-wrap">
        <div class="quiz-opts" style={{ gridTemplateColumns: current.cols }}>
          {current.options.map((opt) => {
            const on = answer === opt.v;
            return (
              <button key={opt.v} class={`qopt ${on ? 'is-on' : ''}`} type="button" onClick={() => pick(current.key, opt.v)}>
                {on && <span class="qopt-ring" aria-hidden="true" />}
                <span class="qopt-ico"><Icon k={opt.v} /></span>
                <span class="qopt-text">
                  <span class="qopt-label" style={{ fontSize: current.titleSize }}>{opt.label}</span>
                  {opt.sub && <span class="qopt-sub">{opt.sub}</span>}
                </span>
                {on && (
                  <span class="qopt-check" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC233" stroke="#16224C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div class="quiz-foot">
        <button class={`quiz-next ${ready ? 'is-ready' : ''}`} onClick={goNext} disabled={!ready} type="button">
          {last ? 'Ver mis notebooks' : 'Siguiente'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
        </button>
        <div class="quiz-disc">Comparador independiente · enlaces de afiliados de Mercado Libre</div>
      </div>
    </div>
  );
}
