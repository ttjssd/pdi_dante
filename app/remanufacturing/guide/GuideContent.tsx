import GuideImage from "./GuideImage";
import { guideSections, type GuideItem } from "./guideData";

function GuideList({ items, depth = 0 }: { items: GuideItem[]; depth?: number }) {
  return (
    <ul className={`guide-list guide-depth-${Math.min(depth, 2)}`}>
      {items.map((item) => (
        <li key={`${depth}-${item.text}`}>
          <span>{item.text}</span>
          {item.children && <GuideList items={item.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export default function GuideContent() {
  return (
    <div className="guide-layout">
      <aside className="guide-toc">
        <span className="guide-toc-label">CONTENTS</span>
        <nav>
          {guideSections.map((section) => (
            <div key={section.id}>
              <a href={`#${section.id}`}><b>{section.number}</b>{section.title}</a>
              {section.subsections?.map((subsection) => (
                <a className="guide-toc-sub" href={`#${subsection.id}`} key={subsection.id}>{subsection.title}</a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <article className="guide-document">
        {guideSections.map((section) => (
          <section className="guide-section-card" id={section.id} key={section.id}>
            <header className="guide-section-header">
              <span>{section.number}</span>
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
            </header>

            {section.items && <GuideList items={section.items} />}
            {section.callout && <div className="guide-callout"><b>CHECK</b><p>{section.callout}</p></div>}
            {section.images?.map((image) => <GuideImage image={image} key={image.src} />)}

            {section.subsections?.map((subsection) => (
              <section className="guide-subsection" id={subsection.id} key={subsection.id}>
                <h3>{subsection.title}</h3>
                <GuideList items={subsection.items} />
                {subsection.callout && <div className="guide-callout"><b>CHECK</b><p>{subsection.callout}</p></div>}
                {subsection.images.map((image) => <GuideImage image={image} key={image.src} />)}
              </section>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
