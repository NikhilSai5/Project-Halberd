"use client";

import { useState, useRef, useEffect } from "react";
import { useSettings, type TodoGroup, type TodoItem } from '@/lib/SettingsContext';

const navItems = [
  { icon: "palette", label: "Appearance", id: "appearance" },
  { icon: "wallpaper", label: "Wallpaper", id: "wallpaper" },
  { icon: "dashboard", label: "Layout", id: "layout" },
  { icon: "check_circle", label: "Productivity", id: "productivity" },
  { icon: "flag", label: "Goals", id: "goals" },
  { icon: "extension", label: "Extension", id: "extension" },
];

const accentColors = [
  { color: "#486551", label: "Primary", selected: true },
  { color: "#E38C9D", label: "Pink", selected: false },
  { color: "#B69BCB", label: "Purple", selected: false },
  { color: "#E8A65D", label: "Orange", selected: false },
  { color: "#add6fa", label: "Blue", selected: false, border: true },
];

interface WallpaperFile {
  id: string;
  name: string;
  preview: string;
  file: File;
}

interface WeeklyGoal {
  id: string;
  name: string;
  targetHours: number;
  startDate: string;
  endDate: string;
  sessions: { timeRange: string; description: string }[];
  completed: boolean;
}

export default function Settings() {
  const [activeNav, setActiveNav] = useState("appearance");
  const [theme, setTheme] = useState("light");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("Medium");
  const [blur, setBlur] = useState(16);
  const [transparency, setTransparency] = useState(95);
  const [selectedAccent, setSelectedAccent] = useState("#486551");

  // Wallpaper state
  const [wallpapers, setWallpapers] = useState<WallpaperFile[]>([]);
  const [slideshowEnabled, setSlideshowEnabled] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState("30min");
  const [liveWallpaperEnabled, setLiveWallpaperEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Layout state
  const [navbarLocation, setNavbarLocation] = useState<"bottom-center" | "left" | "right">("bottom-center");

  // Productivity state
  const { 
    todoGroups, 
    addTodoGroup, 
    updateTodoGroupName, 
    deleteTodoGroup, 
    addTodoToGroup, 
    updateTodo, 
    deleteTodo,
    showTodoListInHome, 
    setShowTodoListInHome 
  } = useSettings();
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  // Goals state
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([
    {
      id: "1",
      name: "Learn Distributed Systems",
      targetHours: 10,
      startDate: "2026-08-18",
      endDate: "2026-08-24",
      sessions: [
        { timeRange: "06:55 - 11:00", description: "studying distributed computing" },
        { timeRange: "13:20 - 15:45", description: "researching consensus algorithms" },
        { timeRange: "16:00 - 18:15", description: "reading Paxos vs Raft whitepapers" },
      ],
      completed: false,
    },
    {
      id: "2",
      name: "Build Halberd Extension",
      targetHours: 15,
      startDate: "2026-08-11",
      endDate: "2026-08-17",
      sessions: [
        { timeRange: "09:00 - 12:00", description: "setting up WXT project" },
        { timeRange: "14:00 - 18:00", description: "building settings page" },
      ],
      completed: true,
    },
  ]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetHours, setNewGoalTargetHours] = useState(10);
  const [newGoalStartDate, setNewGoalStartDate] = useState<string>(() => new Date().toISOString().split("T")[0] ?? "");

  // Handle file upload for wallpapers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const newWallpaper: WallpaperFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          preview: event.target?.result as string,
          file,
        };
        setWallpapers((prev) => [...prev, newWallpaper]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input value to allow re-uploading same file
    if (e.target) e.target.value = "";
  };

  // Handle folder selection for slideshow
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const newWallpaper: WallpaperFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          preview: event.target?.result as string,
          file,
        };
        setWallpapers((prev) => [...prev, newWallpaper]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input value
    if (e.target) e.target.value = "";
  };

  const removeWallpaper = (id: string) => {
    setWallpapers((prev) => prev.filter((w) => w.id !== id));
  };

  const clearAllWallpapers = () => {
    setWallpapers([]);
  };

  // Goals functions
  const addWeeklyGoal = () => {
    if (!newGoalName.trim()) return;
    const fallbackDate = new Date().toISOString().split("T")[0] ?? "";
    const startDate = newGoalStartDate || fallbackDate;
    const newGoal: WeeklyGoal = {
      id: `${Date.now()}`,
      name: newGoalName,
      targetHours: newGoalTargetHours,
      startDate,
      endDate: new Date(new Date(startDate).getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0] ?? "",
      sessions: [],
      completed: false,
    };
    setWeeklyGoals((prev) => [...prev, newGoal]);
    setShowAddGoalForm(false);
    setNewGoalName("");
    setNewGoalTargetHours(10);
    setNewGoalStartDate(fallbackDate);
  };

  const deleteWeeklyGoal = (id: string) => {
    setWeeklyGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleGoalComplete = (id: string) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const calculateTotalTime = (sessions: { timeRange: string; description: string }[]) => {
    // Simple calculation for demo
    return `${sessions.length * 2}h ${sessions.length * 30}m`;
  };

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
              {/* Appearance Tab */}
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

              {/* Wallpaper Tab */}
              {activeNav === "wallpaper" && (
                <>
                  <h3 className="page-title text-on-surface settings-page-heading hidden md:block">Wallpaper</h3>
                  <div className="settings-sections space-y-section-gap">
                    {/* Upload Your Own Wallpapers */}
                    <div className="settings-section">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="section-heading text-text-primary">Upload Your Own</h4>
                        {wallpapers.length > 0 && (
                          <button
                            onClick={clearAllWallpapers}
                            className="button-regular button-regular--outlined font-section-title text-section-title text-error border-error text-sm px-3 py-1.5 hover:bg-error/10"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <label className="settings-file-dropzone relative cursor-pointer rounded-xl  border-border-subtle bg-surface-container-low transition-all hover:border-primary hover:bg-surface-container focus-within:border-primary focus-within:bg-surface-container">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="sr-only"
                            aria-label="Upload wallpaper images"
                          />
                          <div className="flex flex-col items-center gap-3 text-center">
                            <span className="material-symbols-outlined text-4xl text-text-muted transition-colors">cloud_upload</span>
                            <div className="font-body-main text-body-main text-text-primary">Drag & drop images here</div>
                            <div className="label-copy text-text-secondary">or click to browse</div>
                            <div className="label-copy text-text-muted">PNG, JPG, WebP up to 10MB each</div>
                          </div>
                        </label>
                        {wallpapers.length > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm text-text-secondary">
                              <span>{wallpapers.length} image{wallpapers.length !== 1 ? "s" : ""} selected</span>
                            </div>
                            <div className="wallpaper-preview-grid">
                              {wallpapers.map((wp) => (
                                <div key={wp.id} className="relative aspect-square rounded-lg overflow-hidden border border-border-subtle bg-surface-container-low">
                                  <img src={wp.preview} alt={wp.name} className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => removeWallpaper(wp.id)}
                                    className="wallpaper-remove-btn"
                                    aria-label={`Remove ${wp.name}`}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                  </button>
                                  <div className="wallpaper-name-overlay">
                                    {wp.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Slideshow */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Slideshow</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-body-main text-body-main text-on-surface">Enable Slideshow</div>
                            <div className="label-copy text-text-secondary">Automatically rotate through uploaded wallpapers</div>
                          </div>
                          <button
                            role="switch"
                            aria-checked={slideshowEnabled}
                            onClick={() => setSlideshowEnabled(!slideshowEnabled)}
                            className={`settings-toggle relative w-11 h-6 rounded-full transition-colors ${
                              slideshowEnabled ? "bg-primary" : "bg-surface-container-high"
                            }`}
                            aria-label="Toggle slideshow"
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-white shadow-md transition-transform ${
                                slideshowEnabled ? "translate-x-full" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                        {slideshowEnabled && (
                          <div className="space-y-4 ml-14 border-l-2 border-border-subtle pl-4">
                            <div className="settings-field">
                              <label className="font-label-secondary text-label-secondary text-text-secondary">Interval</label>
                              <div className="settings-select-wrap">
                                <select
                                  value={slideshowInterval}
                                  onChange={(e) => setSlideshowInterval(e.target.value)}
                                  className="form-control settings-select bg-transparent font-body-main text-body-main text-on-surface appearance-none"
                                  disabled={!slideshowEnabled}
                                >
                                  <option value="15min">Every 15 minutes</option>
                                  <option value="30min">Every 30 minutes</option>
                                  <option value="1hr">Every hour</option>
                                  <option value="6hr">Every 6 hours</option>
                                  <option value="12hr">Every 12 hours</option>
                                  <option value="24hr">Every 24 hours</option>
                                </select>
                                <span className="material-symbols-outlined icon-action absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" aria-hidden="true">expand_more</span>
                              </div>
                            </div>
                            
                            {/* Folder Selection for Slideshow */}
                            <div className="settings-field">
                              <label className="font-label-secondary text-label-secondary text-text-secondary">Slideshow Folder</label>
                              <div className="space-y-2">
                                <input
                                  ref={folderInputRef}
                                  type="file"
                                  accept="image/*"
                                  {...{ webkitdirectory: true, directory: true }}
                                  multiple
                                  onChange={handleFolderSelect}
                                  className="sr-only"
                                  aria-label="Select folder for slideshow"
                                />
                                <button
                                  type="button"
                                  onClick={() => folderInputRef.current?.click()}
                                  className="button-regular button-regular--outlined font-section-title text-section-title group w-full justify-start"
                                >
                                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                                  Select Folder for Slideshow
                                </button>
                                <div className="label-copy text-text-muted">Select a folder containing images for the slideshow</div>
                              </div>
                            </div>

                            {wallpapers.length === 0 && (
                              <div className="settings-info-banner bg-warning-container/20 border border-warning-container/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-warning text-[20px] mt-0.5" aria-hidden="true">warning</span>
                                  <div className="flex-1">
                                    <div className="font-body-main text-body-main text-on-surface">No Images for Slideshow</div>
                                    <div className="label-copy text-text-secondary mt-1">Add images above or select a folder to use the slideshow feature.</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Wallpaper */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Live Wallpaper</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-body-main text-body-main text-on-surface">Enable Live Wallpaper</div>
                            <div className="label-copy text-text-secondary">Animated/Interactive backgrounds (coming soon)</div>
                          </div>
                          <button
                            role="switch"
                            aria-checked={liveWallpaperEnabled}
                            onClick={() => setLiveWallpaperEnabled(!liveWallpaperEnabled)}
                            className={`settings-toggle relative w-11 h-6 rounded-full transition-colors ${
                              liveWallpaperEnabled ? "bg-primary" : "bg-surface-container-high"
                            }`}
                            aria-label="Toggle live wallpaper"
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-white shadow-md transition-transform ${
                                liveWallpaperEnabled ? "translate-x-full" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                        <div className="settings-info-banner bg-tertiary-container/20 border border-tertiary-container/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5" aria-hidden="true">info</span>
                            <div className="flex-1">
                              <div className="font-body-main text-body-main text-on-surface">Live Wallpapers Coming Soon</div>
                              <div className="label-copy text-text-secondary mt-1">Support for animated WebGL/Canvas backgrounds and Lottie animations is planned for a future update.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Layout Tab */}
              {activeNav === "layout" && (
                <>
                  <h3 className="page-title text-on-surface settings-page-heading hidden md:block">Layout</h3>
                  <div className="settings-sections space-y-section-gap">
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Navbar Location</h4>
                      <div className="label-copy text-text-secondary mb-4">Choose where the navigation bar appears (requires reload)</div>
                      <div className="space-y-3">
                        {[
                          { value: "bottom-center", label: "Bottom Center", desc: "Default dock at bottom center" },
                          { value: "left", label: "Left Sidebar", desc: "Vertical sidebar on the left" },
                          { value: "right", label: "Right Sidebar", desc: "Vertical sidebar on the right" },
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer group relative">
                            <input
                              type="radio"
                              name="navbarLocation"
                              value={option.value}
                              checked={navbarLocation === option.value}
                              onChange={(e) => setNavbarLocation(e.target.value as "bottom-center" | "left" | "right")}
                              className="peer sr-only"
                            />
                            <div className="flex-1">
                              <div className="font-body-main text-body-main text-on-surface peer-checked:text-primary">{option.label}</div>
                              <div className="label-copy text-text-secondary">{option.desc}</div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                              navbarLocation === option.value ? "border-primary bg-primary/10" : "border-border-subtle"
                            }`}>
                              {navbarLocation === option.value && (
                                <span className="material-symbols-outlined text-primary text-[18px] flex items-center justify-center w-full h-full" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Productivity Tab */}
              {activeNav === "productivity" && (
                <>
                  <h3 className="page-title text-on-surface settings-page-heading hidden md:block">Productivity</h3>
                  <div className="settings-sections space-y-section-gap">
                    {/* Todo Groups */}
                    <div className="settings-section">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="section-heading text-text-primary">Todo Groups</h4>
                        <button onClick={() => addTodoGroup()} className="button-regular font-section-title text-section-title group">
                          <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                          Add Group
                        </button>
                      </div>
                      <div className="space-y-4">
                        {todoGroups.map((group, groupIndex) => (
                          <div key={group.id} className="todo-group bg-surface-container-low rounded-xl border border-border-subtle p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <input
                                type="text"
                                value={group.name}
                                onChange={(e) => updateTodoGroupName(group.id, e.target.value)}
                                className="flex-1 bg-transparent border-none focus:outline-none font-body-main text-body-main text-on-surface placeholder:text-text-muted"
                                placeholder="Group name"
                              />
                              {todoGroups.length > 1 && (
                                <button
                                  onClick={() => deleteTodoGroup(group.id)}
                                  className="icon-button text-text-muted hover:text-error transition-colors p-1 rounded-full hover:bg-surface-container"
                                  aria-label={`Delete ${group.name}`}
                                >
                                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {group.todos.map((todo) => (
                                <div key={todo.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={(e) => updateTodo(group.id, todo.id, { completed: e.target.checked })}
                                    className="w-4 h-4 accent-primary"
                                  />
                                  <input
                                    type="text"
                                    value={todo.text}
                                    onChange={(e) => updateTodo(group.id, todo.id, { text: e.target.value })}
                                    className="flex-1 bg-transparent border-none focus:outline-none font-body-main text-body-main text-on-surface placeholder:text-text-muted"
                                    placeholder="Add a task..."
                                  />
                                  <button
                                    onClick={() => deleteTodo(group.id, todo.id)}
                                    className="icon-button text-text-muted hover:text-error transition-colors p-1 rounded-full hover:bg-surface-container opacity-0 group-hover:opacity-100"
                                    aria-label="Delete task"
                                  >
                                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addTodoToGroup(group.id)}
                                className="w-full text-left py-2 text-text-secondary hover:text-primary transition-colors font-body-main text-body-main flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Add task
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Todo Display Options */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Display Options</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-body-main text-body-main text-on-surface">Show Completed Tasks</div>
                            <div className="label-copy text-text-secondary">Display completed tasks in todo lists</div>
                          </div>
                          <button
                            role="switch"
                            aria-checked={showCompletedTasks}
                            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                            className={`settings-toggle relative w-11 h-6 rounded-full transition-colors ${
                              showCompletedTasks ? "bg-primary" : "bg-surface-container-high"
                            }`}
                            aria-label="Toggle show completed tasks"
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-white shadow-md transition-transform ${
                                showCompletedTasks ? "translate-x-full" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-body-main text-body-main text-on-surface">Show Todo List in Home</div>
                            <div className="label-copy text-text-secondary">Display the todo list on the home page</div>
                          </div>
                          <button
                            role="switch"
                            aria-checked={showTodoListInHome}
                            onClick={() => setShowTodoListInHome(!showTodoListInHome)}
                            className={`settings-toggle relative w-11 h-6 rounded-full transition-colors ${
                              showTodoListInHome ? "bg-primary" : "bg-surface-container-high"
                            }`}
                            aria-label="Toggle show todo list in home"
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-white shadow-md transition-transform ${
                                showTodoListInHome ? "translate-x-full" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Goals Tab */}
              {activeNav === "goals" && (
                <>
                  <h3 className="page-title text-on-surface settings-page-heading hidden md:block">Goals</h3>
                  <div className="settings-sections space-y-section-gap">
                    {/* Add New Weekly Goal Form */}
                    {showAddGoalForm ? (
                      <div className="settings-section bg-primary-container/20 border border-primary-container rounded-xl p-6">
                        <h4 className="section-heading text-text-primary mb-4">Add New Weekly Goal</h4>
                        <div className="space-y-4 max-w-md">
                          <div className="settings-field">
                            <label className="font-label-secondary text-label-secondary text-text-secondary">Goal Name</label>
                            <input
                              type="text"
                              value={newGoalName}
                              onChange={(e) => setNewGoalName(e.target.value)}
                              className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              placeholder="e.g., Learn TypeScript"
                              autoFocus
                            />
                          </div>
                          <div className="settings-field">
                            <label className="font-label-secondary text-label-secondary text-text-secondary">Target Hours</label>
                            <input
                              type="number"
                              value={newGoalTargetHours}
                              onChange={(e) => setNewGoalTargetHours(Number(e.target.value))}
                              min="1"
                              max="100"
                              className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="settings-field">
                            <label className="font-label-secondary text-label-secondary text-text-secondary">Start Date</label>
                            <input
                              type="date"
                              value={newGoalStartDate}
                              onChange={(e) => setNewGoalStartDate(e.target.value)}
                              className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={addWeeklyGoal}
                              className="button-regular font-section-title text-section-title flex-1"
                            >
                              Save Goal
                            </button>
                            <button
                              onClick={() => setShowAddGoalForm(false)}
                              className="button-regular button-regular--outlined font-section-title text-section-title flex-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="settings-section mb-4">
                        <button
                          onClick={() => setShowAddGoalForm(true)}
                          className="button-regular font-section-title text-section-title group w-full"
                        >
                          <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                          Add New Weekly Goal
                        </button>
                      </div>
                    )}

                    {/* Active Weekly Goals */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary mb-4">Active Weekly Goals</h4>
                      <div className="space-y-4">
                        {weeklyGoals.filter(g => !g.completed).map((goal) => (
                          <div key={goal.id} className="bg-surface-container-low rounded-xl border border-border-subtle p-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-body-main text-body-main text-on-surface font-medium">{goal.name}</div>
                                <div className="label-copy text-text-secondary mt-0.5">{formatDate(goal.startDate)} - {formatDate(goal.endDate)}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleGoalComplete(goal.id)}
                                  className="button-regular button-regular--outlined font-section-title text-section-title text-primary border-primary text-sm px-3 py-1.5"
                                >
                                  Mark Complete
                                </button>
                                <button
                                  onClick={() => deleteWeeklyGoal(goal.id)}
                                  className="icon-button text-text-muted hover:text-error transition-colors p-1 rounded-full hover:bg-surface-container"
                                  aria-label={`Delete ${goal.name}`}
                                >
                                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex-1">
                                <div className="label-copy text-text-secondary">Target: {goal.targetHours}h</div>
                                <div className="label-copy text-text-secondary">Time Spent: {calculateTotalTime(goal.sessions)}</div>
                              </div>
                              <div className="w-32">
                                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${Math.min((goal.sessions.length * 2.5) / goal.targetHours * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            {goal.sessions.length > 0 && (
                              <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                                <div className="label-copy text-text-secondary uppercase tracking-wider">Sessions</div>
                                <div className="space-y-1">
                                  {goal.sessions.map((session, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                                      <span className="font-mono text-text-muted">{session.timeRange}</span>
                                      <span>{session.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {weeklyGoals.filter(g => !g.completed).length === 0 && (
                          <div className="text-center py-8 text-text-muted">
                            <span className="material-symbols-outlined text-4xl mb-2 block">flag</span>
                            No active weekly goals. Create one to get started!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Past Weekly Goals */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary mb-4">Past Weekly Goals</h4>
                      <div className="space-y-3">
                        {weeklyGoals.filter(g => g.completed).map((goal) => (
                          <div key={goal.id} className="bg-surface-container-low rounded-xl border border-border-subtle p-4 opacity-75">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="font-body-main text-body-main text-on-surface font-medium line-through">{goal.name}</div>
                                <div className="label-copy text-text-secondary mt-0.5">{formatDate(goal.startDate)} - {formatDate(goal.endDate)} · {calculateTotalTime(goal.sessions)} · {goal.targetHours}h target</div>
                              </div>
                              <button
                                onClick={() => toggleGoalComplete(goal.id)}
                                className="button-regular button-regular--outlined font-section-title text-section-title text-primary border-primary text-sm px-3 py-1.5"
                              >
                                Restore
                              </button>
                            </div>
                          </div>
                        ))}
                        {weeklyGoals.filter(g => g.completed).length === 0 && (
                          <div className="text-center py-8 text-text-muted">
                            <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
                            No completed weekly goals yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Extension Tab (formerly About) */}
              {activeNav === "extension" && (
                <>
                  <h3 className="page-title text-on-surface settings-page-heading hidden md:block">Extension</h3>
                  <div className="settings-sections space-y-section-gap">
                    {/* App Info */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">About Halberd</h4>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-4xl">target</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-headline-page text-headline-page font-medium text-on-surface">Halberd</div>
                          <div className="label-copy text-text-secondary mt-1">Version 0.1.0</div>
                          <div className="body-copy text-text-primary mt-2">A productivity-focused new tab extension for Chrome. Built to help you focus, track habits, manage goals, and stay organized.</div>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Links</h4>
                      <div className="space-y-3">
                        {[
                          { icon: "code", label: "GitHub Repository", url: "#", desc: "View source code and contribute" },
                          { icon: "bug_report", label: "Report an Issue", url: "#", desc: "Found a bug? Let us know" },
                          { icon: "privacy_tip", label: "Privacy Policy", url: "#", desc: "How we handle your data" },
                        ].map((link, index) => (
                          <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors border border-border-subtle">
                            <span className="material-symbols-outlined text-text-secondary text-[22px]">{link.icon}</span>
                            <div className="flex-1">
                              <div className="font-body-main text-body-main text-on-surface">{link.label}</div>
                              <div className="label-copy text-text-secondary">{link.desc}</div>
                            </div>
                            <span className="material-symbols-outlined text-text-muted">open_in_new</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Credits */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Credits</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-text-secondary">
                          <span>WXT (Web Extension Tools)</span>
                          <span className="font-medium text-on-surface">Framework</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>React 19</span>
                          <span className="font-medium text-on-surface">UI Library</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Tailwind CSS</span>
                          <span className="font-medium text-on-surface">Styling</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>TypeScript</span>
                          <span className="font-medium text-on-surface">Type Safety</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Supabase</span>
                          <span className="font-medium text-on-surface">Backend</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>IndexedDB (idb)</span>
                          <span className="font-medium text-on-surface">Local Storage</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Material Symbols</span>
                          <span className="font-medium text-on-surface">Icons</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Inter Font</span>
                          <span className="font-medium text-on-surface">Typography</span>
                        </div>
                      </div>
                    </div>

                    {/* Legal */}
                    <div className="settings-section">
                      <h4 className="section-heading text-text-primary">Legal</h4>
                      <div className="space-y-2 text-sm text-text-secondary">
                        <div>Licensed under the MIT License</div>
                        <div>Copyright © 2026 Halberd Contributors</div>
                        <div className="pt-2 border-t border-border-subtle">
                          <a href="#" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View License on GitHub</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
