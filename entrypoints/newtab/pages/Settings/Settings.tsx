"use client";

import { useState } from "react";

const navItems = [
  { icon: "palette", label: "Appearance", id: "appearance" },
  { icon: "dashboard", label: "Layout", id: "layout" },
  { icon: "check_circle", label: "Productivity", id: "productivity" },
  { icon: "flag", label: "Goals", id: "goals" },
  { icon: "timer", label: "Pomodoro", id: "pomodoro" },
  { icon: "extension", label: "Integrations", id: "integrations" },
  { icon: "lock", label: "Data & Privacy", id: "privacy" },
  { icon: "info", label: "About", id: "about" },
];

const accentColors = [
  { color: "#486551", label: "Primary", selected: true },
  { color: "#E38C9D", label: "Pink", selected: false },
  { color: "#B69BCB", label: "Purple", selected: false },
  { color: "#E8A65D", label: "Orange", selected: false },
  { color: "#add6fa", label: "Blue", selected: false, border: true },
];

export default function Settings() {
  const [activeNav, setActiveNav] = useState("appearance");
  const [theme, setTheme] = useState("light");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("Medium");
  const [blur, setBlur] = useState(16);
  const [transparency, setTransparency] = useState(95);
  const [selectedAccent, setSelectedAccent] = useState("#486551");

  return (
    <div className="page-shell page-shell--centered bg-background text-on-surface flex flex-col font-body-main antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <header className="w-full top-0 px-[20px] pt-[20px]">
        {/* <div className="flex justify-between items-center max-w-[1440px] mx-auto w-full">
          <div className="font-headline-page text-headline-page font-medium text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">target</span>
            Halberd
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors scale-95 duration-200">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div> */}
      </header>
      <main className="page-main flex-grow flex items-center justify-center relative z-10">
        <div className="workspace-surface workspace-settings settings-panel w-full flex flex-col md:flex-row overflow-hidden relative">
          <div className="settings-mobile-header md:hidden">
            <h1 className="section-heading text-on-surface">Settings</h1>
            <button
              type="button"
              aria-disabled="true"
              aria-label="Close settings unavailable"
              title="Closing settings is not available yet"
              onClick={(event) => event.preventDefault()}
              className="control-unavailable icon-button"
            >
              <span className="material-symbols-outlined icon-action" aria-hidden="true">close</span>
            </button>
          </div>
          <aside className="settings-sidebar hidden md:flex">
            <div className="settings-sidebar-inner">
              <h2 className="section-heading text-text-primary">Settings</h2>
              <nav className="settings-nav" aria-label="Settings sections">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    aria-current={activeNav === item.id ? "page" : undefined}
                    className={`settings-nav-item text-body-main ${
                      activeNav === item.id
                        ? "settings-nav-item--active"
                        : "settings-nav-item--inactive"
                    }`}
                  >
                    <span className="material-symbols-outlined settings-nav-icon" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
          <section className="settings-content">
            <div className="settings-content-inner">
              {activeNav === "appearance" && (
                <>
                  <h3 className="page-title text-on-surface settings-page-heading hidden md:block">Appearance</h3>
                  <div className="settings-sections">
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Theme</h4>
                      <p className="label-copy settings-preview-note">Preview only. Theme switching is not enabled yet.</p>
                      <div className="settings-theme-options">
                        <label className="settings-theme-option group">
                          <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={theme === "light"}
                            onChange={(e) => setTheme(e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="settings-theme-preview settings-theme-preview--light peer-checked:border-primary group-hover:border-outline-variant">
                            <div className="w-16 h-12 bg-surface-container-low rounded shadow-sm border border-border-subtle flex flex-col gap-2 p-2">
                              <div className="w-full h-2 bg-surface-container-highest rounded" />
                              <div className="w-2/3 h-2 bg-surface-container-highest rounded" />
                            </div>
                          </div>
                          <span className="block mt-2 label-copy text-center text-text-secondary peer-checked:text-primary peer-checked:font-medium">Light preview</span>
                        </label>
                        <label className="settings-theme-option group">
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={theme === "dark"}
                            onChange={(e) => setTheme(e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="settings-theme-preview settings-theme-preview--dark peer-checked:border-primary group-hover:border-outline-variant">
                            <div className="w-16 h-12 bg-[#3f4140] rounded shadow-sm border border-[#4a4c4b] flex flex-col gap-2 p-2">
                              <div className="w-full h-2 bg-[#555756] rounded" />
                              <div className="w-2/3 h-2 bg-[#555756] rounded" />
                            </div>
                          </div>
                          <span className="block mt-2 label-copy text-center text-text-secondary peer-checked:text-primary peer-checked:font-medium">Dark preview</span>
                        </label>
                      </div>
                    </div>
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Accent Color</h4>
                      <div className="settings-accent-options">
                        {accentColors.map((accent, index) => (
                          <button
                            key={index}
                            type="button"
                            aria-label={`${accent.label} accent color`}
                            onClick={() => setSelectedAccent(accent.color)}
                            className={`settings-accent-swatch ${selectedAccent === accent.color ? "settings-accent-swatch--selected" : ""} ${accent.border ? "settings-accent-swatch--bordered" : ""}`}
                            style={{ backgroundColor: accent.color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Typography</h4>
                      <div className="settings-typography-grid">
                        <div className="settings-field">
                          <label className="font-label-secondary text-label-secondary text-text-secondary">Font Family</label>
                          <div className="settings-select-wrap">
                            <select
                              value={fontFamily}
                              onChange={(e) => setFontFamily(e.target.value)}
                              className="form-control settings-select bg-transparent font-body-main text-body-main text-on-surface appearance-none"
                            >
                              <option>Inter</option>
                              <option>SF Pro</option>
                              <option>Roboto</option>
                            </select>
                            <span className="material-symbols-outlined icon-action absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" aria-hidden="true">expand_more</span>
                          </div>
                        </div>
                        <div className="settings-field">
                          <label className="font-label-secondary text-label-secondary text-text-secondary">Font Size</label>
                          <div className="settings-select-wrap">
                            <select
                              value={fontSize}
                              onChange={(e) => setFontSize(e.target.value)}
                              className="form-control settings-select bg-transparent font-body-main text-body-main text-on-surface appearance-none"
                            >
                              <option>Small</option>
                              <option>Medium</option>
                              <option>Large</option>
                            </select>
                            <span className="material-symbols-outlined icon-action absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" aria-hidden="true">expand_more</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="settings-section settings-effects-section">
                      <h4 className="section-heading text-text-primary">Interface Effects</h4>
                      <div className="settings-slider-group">
                        <div className="flex justify-between items-center">
                          <label className="font-body-main text-body-main text-on-surface">Background Blur</label>
                          <span className="font-label-secondary text-label-secondary text-text-secondary">{blur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          value={blur}
                          onChange={(e) => setBlur(Number(e.target.value))}
                          className="settings-slider w-full bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div className="settings-slider-group">
                        <div className="flex justify-between items-center">
                          <label className="font-body-main text-body-main text-on-surface">Panel Transparency</label>
                          <span className="font-label-secondary text-label-secondary text-text-secondary">{transparency}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={transparency}
                          onChange={(e) => setTransparency(Number(e.target.value))}
                          className="settings-slider w-full bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeNav !== "appearance" && (
                <div className="empty-state">
                  <span className="material-symbols-outlined empty-state__icon" aria-hidden="true">{navItems.find(n => n.id === activeNav)?.icon}</span>
                  <h3 className="empty-state__title page-title">{navItems.find(n => n.id === activeNav)?.label}</h3>
                  <p className="body-copy">Settings for {navItems.find(n => n.id === activeNav)?.label.toLowerCase()} coming soon</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
