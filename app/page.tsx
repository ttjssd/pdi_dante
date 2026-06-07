import BrandIcon from "./components/BrandIcon";
import LauncherClient from "./LauncherClient";
import { APP_VERSION, APP_VERSION_LABEL } from "./config";
import { launcherUpdates } from "./platformData";

export default function LauncherHome() {
  return (
    <main className="launcher-app">
      <header className="launcher-header">
        <div>
          <strong>PDI BACKOFFICE PLATFORM</strong>
          <span>PERSONAL OPS CONSOLE</span>
        </div>
        <div className="launcher-status" aria-label="런처 상태">
          <span>LOCAL WORKSPACE</span>
          <strong><i /> SYSTEM READY</strong>
          <em>{APP_VERSION_LABEL}</em>
        </div>
      </header>

      <section className="launcher-stage">
        <aside className="launcher-update-panel">
          <div className="launcher-panel-heading">
            <span>NOTICE / UPDATE</span>
            <small>Latest 3 logs</small>
          </div>
          <div className="launcher-update-list">
            {launcherUpdates.map((item) => (
              <article key={`${item.version}-${item.title}`}>
                <span>{item.version}</span>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <div className="launcher-visual" aria-hidden="true">
          <div className="launcher-core-shell">
            <BrandIcon />
            <span className="core-ring ring-a" />
            <span className="core-ring ring-b" />
            <span className="core-node node-one" />
            <span className="core-node node-two" />
            <span className="core-node node-three" />
          </div>
          <div className="launcher-visual-copy">
            <span>PRIVATE OPERATIONS HUB</span>
            <strong>READY TO START</strong>
          </div>
        </div>

        <LauncherClient />
      </section>

      <footer className="launcher-footer">
        <span>PDI BACKOFFICE PLATFORM</span>
        <strong>{APP_VERSION}</strong>
        <span>dante 제작</span>
      </footer>
    </main>
  );
}
