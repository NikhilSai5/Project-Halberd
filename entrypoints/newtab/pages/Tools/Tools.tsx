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
    <div className="h-full flex flex-col font-body-main text-text-primary antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full max-w-[1440px] mx-auto overflow-y-auto mb-32 md:mb-0">
        <div className="w-full max-w-2xl bg-surface-white rounded-xl border border-border-subtle workspace-shadow overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-6 py-5 border-b border-border-subtle bg-surface-secondary">
            <h1 className="font-headline-page text-headline-page text-text-primary">Tools</h1>
            <button aria-label="Close tools" className="text-text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-6 md:p-8 flex flex-col gap-[32px]">
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="font-section-title text-section-title text-text-primary mb-1">Tab Organizer</h2>
                <p className="font-body-main text-body-main text-text-secondary">Organize your tabs in one click</p>
              </div>
              <button className="self-start bg-primary-container text-on-primary-container font-section-title text-section-title px-6 py-2.5 rounded-lg border border-primary-container hover:bg-secondary-fixed transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">tab</span>
                Organize Tabs
              </button>
            </section>
            <hr className="border-border-subtle" />
            <section className="flex flex-col gap-4">
              <h2 className="font-section-title text-section-title text-text-primary mb-2">File Converters</h2>
              <div className="flex flex-col border border-border-subtle rounded-lg overflow-hidden bg-surface-white">
                {converters.map((converter, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors group text-left ${
                      index < converters.length - 1 ? "border-b border-border-subtle" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                        {converter.icon}
                      </span>
                      <span className="font-body-main text-body-main text-text-primary">
                        {converter.label}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-border-subtle group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <div className="fixed bottom-32 right-12 z-0 opacity-40 pointer-events-none hidden lg:block">
        <span className="material-symbols-outlined text-[32px] text-tertiary">cruelty_free</span>
      </div>
    </div>
  );
}