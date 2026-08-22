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
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-main antialiased selection:bg-secondary-container selection:text-on-secondary-container">
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
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10 w-full max-w-[1440px] mx-auto">
        <div className="glass-panel rounded-xl w-full max-w-4xl h-[716px] min-h-[500px] flex flex-col md:flex-row overflow-hidden relative">
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border-subtle">
            <h1 className="font-section-title text-section-title text-on-surface">Settings</h1>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-surface-secondary flex-shrink-0">
            <div className="p-6 h-full flex flex-col">
              <h2 className="font-section-title text-section-title text-text-primary mb-6">Settings</h2>
              <nav className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-main transition-colors w-full text-left ${
                      activeNav === item.id
                        ? "bg-surface-container text-primary font-medium"
                        : "text-text-secondary hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
          <section className="flex-grow p-6 md:p-10 overflow-y-auto">
            <div className="max-w-xl">
              {activeNav === "appearance" && (
                <>
                  <h3 className="font-headline-page text-headline-page text-on-surface mb-8 hidden md:block">Appearance</h3>
                  <div className="space-y-[32px]">
                    <div className="space-y-4">
                      <h4 className="font-section-title text-section-title text-text-primary">Theme</h4>
                      <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer group">
                          <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={theme === "light"}
                            onChange={(e) => setTheme(e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="h-24 rounded-lg border-2 border-border-subtle bg-surface-white peer-checked:border-primary peer-checked:bg-surface transition-all flex items-center justify-center relative overflow-hidden group-hover:border-outline-variant">
                            <div className="w-16 h-12 bg-surface-container-low rounded shadow-sm border border-border-subtle flex flex-col gap-2 p-2">
                              <div className="w-full h-2 bg-surface-container-highest rounded" />
                              <div className="w-2/3 h-2 bg-surface-container-highest rounded" />
                            </div>
                          </div>
                          <span className="block mt-2 font-label-secondary text-label-secondary text-center text-text-secondary peer-checked:text-primary peer-checked:font-medium">Light</span>
                        </label>
                        <label className="flex-1 cursor-pointer group">
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={theme === "dark"}
                            onChange={(e) => setTheme(e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="h-24 rounded-lg border-2 border-border-subtle bg-inverse-surface peer-checked:border-primary peer-checked:bg-inverse-surface transition-all flex items-center justify-center relative overflow-hidden group-hover:border-outline-variant">
                            <div className="w-16 h-12 bg-[#3f4140] rounded shadow-sm border border-[#4a4c4b] flex flex-col gap-2 p-2">
                              <div className="w-full h-2 bg-[#555756] rounded" />
                              <div className="w-2/3 h-2 bg-[#555756] rounded" />
                            </div>
                          </div>
                          <span className="block mt-2 font-label-secondary text-label-secondary text-center text-text-secondary peer-checked:text-primary peer-checked:font-medium">Dark</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-section-title text-section-title text-text-primary">Accent Color</h4>
                      <div className="flex gap-3">
                        {accentColors.map((accent, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAccent(accent.color)}
                            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                              selectedAccent === accent.color ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-white" : ""
                            } ${accent.border ? "border border-border-subtle" : "border-2 border-transparent"}`}
                            style={{ backgroundColor: accent.color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-section-title text-section-title text-text-primary">Typography</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="font-label-secondary text-label-secondary text-text-secondary">Font Family</label>
                          <div className="relative">
                            <select
                              value={fontFamily}
                              onChange={(e) => setFontFamily(e.target.value)}
                              className="w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                              <option>Inter</option>
                              <option>SF Pro</option>
                              <option>Roboto</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">expand_more</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="font-label-secondary text-label-secondary text-text-secondary">Font Size</label>
                          <div className="relative">
                            <select
                              value={fontSize}
                              onChange={(e) => setFontSize(e.target.value)}
                              className="w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                              <option>Small</option>
                              <option>Medium</option>
                              <option>Large</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">expand_more</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="font-section-title text-section-title text-text-primary">Interface Effects</h4>
                      <div className="space-y-4">
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
                          className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div className="space-y-4">
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
                          className="w-full h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeNav !== "appearance" && (
                <div className="text-center py-12 text-text-secondary">
                  <span className="material-symbols-outlined text-[48px] mb-4 block">{navItems.find(n => n.id === activeNav)?.icon}</span>
                  <h3 className="font-headline-page text-headline-page text-on-surface mb-2">{navItems.find(n => n.id === activeNav)?.label}</h3>
                  <p className="font-body-main text-body-main">Settings for {navItems.find(n => n.id === activeNav)?.label.toLowerCase()} coming soon</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <div className="fixed bottom-32 right-12 z-0 hidden md:block opacity-60 hover:opacity-100 transition-opacity">
        <svg className="pixel-pet w-8 h-8" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path className="text-primary" d="M4 4h8v2h2v4h-2v2H4v-2H2V6h2V4z" fill="currentColor" />
          <path d="M6 6h2v2H6V6zm4 0h2v2h-2V6z" fill="white" />
        </svg>
      </div>
    </div>
  );
}