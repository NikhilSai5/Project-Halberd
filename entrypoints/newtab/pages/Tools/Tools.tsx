"use client";

export default function Tools() {
  const converters = [
    { icon: "image", label: "Image to PDF" },
    { icon: "picture_as_pdf", label: "PDF to Image" },
    { icon: "description", label: "PDF to Word" },
    { icon: "article", label: "Word to PDF" },
    { icon: "transform", label: "Image Converter" },
  ];

  return (
    <div className="page-shell page-shell--centered flex flex-col font-body-main text-text-primary antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      <main className="page-main page-main--raised flex-1 flex flex-col items-center justify-center z-10">
        <div className="workspace-surface workspace-wide tools-panel w-full overflow-hidden flex flex-col">
          <header className="page-header tools-header border-b border-border-subtle bg-surface-secondary">
            <h1 className="page-title text-text-primary">Tools</h1>
            <button
              type="button"
              aria-disabled="true"
              aria-label="Close tools unavailable"
              title="Closing tools is not available yet"
              onClick={(event) => event.preventDefault()}
              className="control-unavailable icon-button"
            >
              <span className="material-symbols-outlined icon-action" aria-hidden="true">close</span>
            </button>
          </header>
          <div className="tools-body">
            {/* <section className="flex flex-col gap-4">
              <div>
                <h2 className="section-heading text-text-primary mb-1">Tab Organizer</h2>
                <p className="font-body-main text-body-main text-text-secondary">Organize your tabs in one click</p>
              </div>
              <button
                type="button"
                aria-disabled="true"
                aria-label="Organize tabs unavailable"
                title="Tab organization is not available yet"
                onClick={(event) => event.preventDefault()}
                className="control-unavailable button-regular self-start font-section-title text-section-title"
              >
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">tab</span>
                Organize Tabs
              </button>
            </section> */}
            {/* <hr className="border-border-subtle" /> */}
            <section className="flex flex-col gap-4">
              <h2 className="section-heading text-text-primary mb-2">File Converters</h2>
              <div className="nested-surface flex flex-col overflow-hidden bg-surface-white">
                {converters.map((converter, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-disabled="true"
                    aria-label={`${converter.label} unavailable`}
                    title={`${converter.label} is not available yet`}
                    onClick={(event) => event.preventDefault()}
                    className={`control-unavailable tools-converter-row list-row w-full px-4 group text-left ${
                      index < converters.length - 1 ? "border-b border-border-subtle" : ""
                    }`}
                  >
                    <div className="tools-row-content">
                      <span className="material-symbols-outlined icon-action text-text-secondary transition-colors" aria-hidden="true">
                        {converter.icon}
                      </span>
                      <span className="tools-row-label body-copy text-text-secondary">
                        {converter.label}
                      </span>
                    </div>
                    <span className="material-symbols-outlined icon-action tools-chevron transition-colors" aria-hidden="true">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
