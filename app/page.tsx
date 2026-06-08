import LauncherClient from "./LauncherClient";
import { APP_VERSION_LABEL } from "./config";
import { launcherUpdates } from "./platformData";

export default function LauncherHome() {
  return (
    <main className="launcher-app">
      <header className="launcher-header">
        <div>
          <strong>PDI 백오피스 플랫폼</strong>
        </div>
      </header>

      <section className="launcher-stage">
        <aside className="launcher-update-panel">
          <div className="launcher-spotlight-card" aria-label="런처 비주얼 슬라이드">
            <div className="launcher-spotlight-slides">
              <span className="spotlight-slide slide-one" />
              <span className="spotlight-slide slide-two" />
              <span className="spotlight-slide slide-three" />
            </div>
            <div className="launcher-spotlight-copy">
              <span>OPS SPOTLIGHT</span>
              <strong>Personal Console Ready</strong>
            </div>
            <div className="launcher-spotlight-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="launcher-panel-heading">
            <span>NOTICE / UPDATE</span>
            <small>Latest 2 logs</small>
          </div>
          <div className="launcher-update-list">
            {launcherUpdates.map((item) => (
              <article key={`${item.version}-${item.title}`}>
                <span>{item.version}</span>
                <div>
                  <h2>{item.title}</h2>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <LauncherClient />
      </section>

      <footer className="launcher-footer">
        <span>dante 제작</span>
      </footer>
    </main>
  );
}
