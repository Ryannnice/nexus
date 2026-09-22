import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { assetUrl, categories, memberCount, resources, schools, repoUrl } from './data'
import { Icon } from './components/Icons'
import { PassionSeal } from './components/PassionSeal'
import { getSceneState, progressAt, smooth, type ScrollAnchor } from './scene/timeline'
import type { StoryProgress } from './scene/Scene'
import { resourcesPerScene, recipeTravel } from './scene/recipes'

const Scene = lazy(() => import('./scene/Scene'))

function SchoolList() {
  return (
    <section className="schools" id="members" aria-label="成员院校名录">
      <div className="schools-heading">
        <span>THE PEOPLE AT OUR TABLE</span>
        <h2>来自四方，一起入席。</h2>
        <p>
          {schools.length} 所院校与校区 · {memberCount} 位伙伴
        </p>
      </div>
      <ul className="school-list">
        {schools.map((school) => (
          <li className="school-item" key={school.id}>
            <img src={assetUrl(school.logo)} alt="" width="40" height="40" loading="lazy" />
            <div>
              <span className="school-abbr">{school.abbr}</span>
              <span className="school-name">{school.name}</span>
            </div>
            <span className="school-count">{school.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function App() {
  const app = useRef<HTMLDivElement>(null)
  const story = useRef<HTMLDivElement>(null)
  const contents = useRef<HTMLElement>(null)
  const progress = useRef<StoryProgress>({ value: 0 })
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => {
    setFailed(true)
    setReady(true)
  }, [])

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    let anchors: ScrollAnchor[] = []
    let frame = 0
    const sections = [...document.querySelectorAll<HTMLElement>('.resource-section')]
    const reunion = document.querySelector<HTMLElement>('.reunion')!
    const gallery = document.querySelector<HTMLElement>('.schools')!
    const transition = document.querySelector<HTMLElement>('.table-transition')!
    const ending = document.querySelector<HTMLElement>('.seat-invitation')!
    const stage = document.querySelector<HTMLElement>('.scene-stage')!
    const toc = [...contents.current!.querySelectorAll('a')]
    let galleryTop = 0,
      reunionTop = 0,
      transitionTop = 0,
      endingTop = 0,
      start = 0
    const topOf = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY
    const update = () => {
      frame = 0
      const p = progressAt(scrollY, anchors)
      progress.current.value = p
      const state = getSceneState(p)
      app.current!.style.setProperty('--dock', String(state.dock))
      app.current!.style.setProperty('--table', String(state.table))
      const leaving =
        1 - smooth((scrollY - (transitionTop - innerHeight * 0.15)) / (innerHeight * 0.5))
      const arriving = smooth((scrollY - reunionTop) / (innerHeight * 0.18))
      app.current!.style.setProperty('--scene-opacity', String(Math.max(leaving, arriving)))
      app.current!.dataset.reading = String(state.dock > 0.7 && state.table < 0.1)
      app.current!.dataset.activeLayer = String(state.focus)
      const theme = categories.findIndex((category) => category.layer === state.focus)
      app.current!.dataset.theme = String(theme < 0 ? 0 : theme)
      app.current!.dataset.tableActive = String(state.table > 0.85)
      stage.tabIndex = state.table > 0.85 ? 0 : -1
      contents.current!.dataset.visible = String(
        scrollY > start - innerHeight * 0.3 && scrollY < endingTop - innerHeight * 0.35
      )
      const current =
        scrollY >= reunionTop - innerHeight * 0.15
          ? 'join'
          : scrollY >= transitionTop - innerHeight * 0.15
            ? 'members'
            : categories[Math.max(0, theme)].id
      toc.forEach((link) => {
        if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
      sections.forEach((section, i) => {
        section.dataset.active = String(state.focus === categories[i].layer && state.spread > 0.8)
      })
      window.dispatchEvent(new Event('nexus:scene-update'))
    }
    const measure = () => {
      const h = innerHeight
      const inset = 0
      sections.forEach((section, i) => {
        const count = resources.filter((resource) => resource.category === categories[i].id).length
        section.style.height = `${h + recipeTravel(count, innerWidth, innerHeight)}px`
      })
      galleryTop = topOf(gallery)
      reunionTop = topOf(reunion)
      transitionTop = topOf(transition)
      endingTop = topOf(ending)
      start = topOf(sections[0]) - inset
      anchors = [
        { y: 0, value: 0 },
        { y: h * 0.08, value: 0.035 },
        { y: Math.max(h * 0.24, start - h * 0.38), value: 0.09 },
      ]
      sections.forEach((section, i) => {
        const y = topOf(section) - inset
        const next =
          i < sections.length - 1 ? topOf(sections[i + 1]) - inset : galleryTop - h * 0.25
        anchors.push(
          { y, value: 0.17 + i * 0.1 },
          { y: Math.max(y + 1, next - h * 0.3), value: 0.24 + i * 0.1 }
        )
      })
      const end = reunionTop
      anchors.push(
        { y: galleryTop - h * 0.1, value: 0.825 },
        { y: galleryTop + h * 0.3, value: 0.855 },
        { y: end, value: 0.86 },
        { y: end + h * 1.55, value: 0.98 },
        { y: end + h * 1.9, value: 1 }
      )
      update()
    }
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(story.current!)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', measure)
    void document.fonts.ready.then(measure)
    measure()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div
      ref={app}
      className={`app${reduced ? ' is-reduced' : ''}${failed ? ' scene-unavailable' : ''}`}
      data-scene-ready={ready}
    >
      <a className="skip-link" href="#resources">
        跳到我们的配方
      </a>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="汉堡王 首页">
          <span className="wordmark">BURGER KING</span>
        </a>
        <nav aria-label="主导航">
          <a href="#resources" aria-label="我们的配方" title="我们的配方">
            <Icon name="book" />
          </a>
          <a href="#members" aria-label="成员院校" title="成员院校">
            <Icon name="people" />
          </a>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="NEXUS GitHub"
            title="GitHub"
          >
            <Icon name="github" />
          </a>
        </nav>
      </header>
      <nav className="chapter-nav" ref={contents} aria-label="章节目录" data-visible="false">
        <span className="contents-label">我们的配方</span>
        {categories.map((category, index) => (
          <a key={category.id} href={`#${category.id}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {category.name}
          </a>
        ))}
        <a href="#members">
          <span>07</span>伙伴院校
        </a>
        <a href="#join">
          <span>08</span>一起入席
        </a>
      </nav>

      <main>
        <div className="scroll-story" ref={story}>
          <div
            className="scene-stage"
            role="region"
            aria-label="三维汉堡场景；圆桌支持拖动或左右方向键旋转"
          >
            {!failed && (
              <Suspense fallback={null}>
                <Scene progress={progress} reduced={reduced} onReady={onReady} onError={onError} />
              </Suspense>
            )}
            {(!ready || failed) && (
              <img className="scene-poster" src={assetUrl('poster.svg')} alt="" />
            )}
          </div>

          <section className="hero" id="home" aria-labelledby="hero-title">
            <PassionSeal />
            <div className="hero-brand">
              <h1 id="hero-title" aria-label="汉堡王 Burger King">
                BURGER <span>KING</span>
              </h1>
            </div>
            <a className="scroll-cue" href="#resources" aria-label="向下探索我们的配方">
              <Icon name="down" />
            </a>
          </section>

          <div className="library" id="resources" aria-label="我们的配方">
            {categories.map((category, i) => {
              const items = resources.filter((resource) => resource.category === category.id)
              return (
                <section
                  className="resource-section"
                  id={category.id}
                  key={category.id}
                  aria-labelledby={`title-${category.id}`}
                  data-layer={category.layer}
                >
                  <div className="chapter-frame">
                    <div className="resource-heading">
                      <span className="section-number">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="recipe-eyebrow">我们的配方</p>
                        <h2 id={`title-${category.id}`}>{category.name}</h2>
                        <span className="section-english">{category.en}</span>
                      </div>
                      <span className="resource-count">{items.length}</span>
                    </div>
                    <ul
                      className="resource-list resource-props"
                      aria-label={`${category.name}配方`}
                    >
                      {items.map((resource, itemIndex) => (
                        <li key={resource.id}>
                          <a
                            className="resource-link"
                            data-resource={resource.id}
                            title={`${resource.title} · ${resource.source}`}
                            aria-label={resource.title}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onFocus={(event) => {
                              if (event.currentTarget.dataset.fullyVisible === 'true') return
                              const section =
                                event.currentTarget.closest<HTMLElement>('.resource-section')!
                              const capacity = resourcesPerScene(innerWidth, innerHeight)
                              const offset = Math.max(
                                0,
                                Math.min(
                                  items.length - capacity,
                                  itemIndex - Math.floor(capacity / 2)
                                )
                              )
                              const top = section.getBoundingClientRect().top + scrollY
                              const travel = section.offsetHeight - innerHeight
                              window.scrollTo({
                                top: top + (offset / Math.max(1, items.length - capacity)) * travel,
                                behavior: 'instant',
                              })
                            }}
                          >
                            <span className="resource-number">
                              {String(itemIndex + 1).padStart(2, '0')}
                            </span>
                            <span className="resource-title">{resource.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )
            })}
          </div>

          <section className="table-transition" aria-label="从配方走向伙伴">
            <div className="transition-checker" aria-hidden="true" />
            <p>
              GOOD FOOD.
              <br />
              <span>GREAT COMPANY.</span>
            </p>
            <span className="transition-note">配方之外，是我们。</span>
          </section>
          <SchoolList />

          <section className="reunion" aria-labelledby="reunion-title">
            <span className="members-anchor" id="join" />
            <div className="reunion-caption">
              <h2 id="reunion-title">
                一起入席，
                <br />
                成为新的汉堡王！
              </h2>
              <p>
                {memberCount} 位伙伴<span> / </span>
                {schools.length} 所院校与校区
              </p>
            </div>
          </section>
        </div>
        <section className="seat-invitation" aria-labelledby="seat-invitation-title">
          <span className="invitation-star" aria-hidden="true">
            ✳
          </span>
          <h2 id="seat-invitation-title">
            Your seat
            <br />
            <span>is waiting!</span>
          </h2>
        </section>
      </main>

      <footer className="site-footer">
        <span className="brand">
          <span className="wordmark">BURGER KING</span>
          <span className="brand-note">汉堡王 · NEXUS 的别称</span>
          <span className="footer-motto">我们热爱汉堡，正如我们热爱大语言模型！</span>
        </span>
        <div>
          <a href="../index.html">原站</a>
          <a href={assetUrl('credits.html')}>致谢</a>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer">
            GitHub <Icon name="external" />
          </a>
        </div>
      </footer>
    </div>
  )
}
