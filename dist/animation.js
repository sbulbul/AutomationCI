(() => {
  const demo = document.querySelector('#system-demo');
  const before = document.querySelector('#before-btn');
  const after = document.querySelector('#after-btn');
  const replay = document.querySelector('#replay-btn');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  function setPhase(phase) {
    demo.dataset.phase = phase;
    const healthy = phase === 'after';
    before.setAttribute('aria-pressed', String(phase === 'before'));
    after.setAttribute('aria-pressed', String(healthy));
    document.querySelector('#phase-index').textContent = healthy ? '03 / AFTER' : phase === 'repair' ? '02 / REBUILD' : '01 / BEFORE';
    document.querySelector('#phase-title').innerHTML = healthy ? 'A repeatable path.<br>A clearer release decision.' : phase === 'repair' ? 'Connecting the checks.<br>Closing the gaps.' : 'Every release.<br>The same uncertainty.';
    document.querySelector('#phase-copy').textContent = healthy ? 'Critical flows covered. Tests in CI. Useful feedback on every run.' : phase === 'repair' ? 'Build the suite. Wire the pipeline. Validate the results.' : 'Disconnected checks. Slow feedback. Issues that reach production.';
    document.querySelector('#system-status').textContent = healthy ? 'SYSTEM OPERATIONAL' : phase === 'repair' ? 'AUTOMATION IN PROGRESS' : 'ATTENTION REQUIRED';
    document.querySelector('#log-text').textContent = healthy ? 'Checks passed. Results published. Ready for release review.' : phase === 'repair' ? 'Configuring test coverage, pipeline triggers, and reporting…' : 'Coverage gaps detected. Release checks need attention.';
    demo.querySelectorAll('[data-before]').forEach(el => el.textContent = el.dataset[healthy ? 'after' : 'before']);
  }
  function play() {
    clear(); setPhase('before');
    if (reduced.matches) { setPhase('after'); return; }
    timers.push(setTimeout(() => setPhase('repair'), 1600));
    timers.push(setTimeout(() => setPhase('after'), 4300));
  }
  before.addEventListener('click', () => { clear(); setPhase('before'); });
  after.addEventListener('click', () => { clear(); setPhase('after'); });
  replay.addEventListener('click', play);
  reduced.addEventListener('change', () => { clear(); setPhase('after'); });
  const watcher = new IntersectionObserver(entries => { if(entries.some(e => e.isIntersecting)){play();watcher.disconnect();} }, {threshold: .3});
  watcher.observe(demo);
  const metrics = document.querySelector('.metric-grid');
  const numbers = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    metrics.classList.add('in-view');
    if (!reduced.matches) {
      const start = performance.now();
      const tick = now => {
        const t = Math.min((now - start) / 1500, 1), eased = 1 - Math.pow(1-t,3);
        document.querySelectorAll('[data-count]').forEach(el => el.textContent = Math.round(Number(el.dataset.start)+(Number(el.dataset.count)-Number(el.dataset.start))*eased));
        if(t < 1) requestAnimationFrame(tick);
      }; requestAnimationFrame(tick);
    }
    numbers.disconnect();
  }, {threshold: .3}); numbers.observe(metrics);
})();
