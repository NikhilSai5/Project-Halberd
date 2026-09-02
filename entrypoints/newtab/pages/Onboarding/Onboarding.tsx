"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSettings, type Habit, type WallpaperFile } from "@/lib/SettingsContext";
import { EmojiPickerPanel, ColorPicker } from "../HabitTracker/HabitTracker";
import AnimatedEmoji from "@/components/AnimatedEmoji";
import { userStorageKey } from "@/lib/userStorage";
import defaultWallpaperOne from "@/assets/default wallpapers/wallhaven-d6q21o.jpg";
import defaultWallpaperTwo from "@/assets/default wallpapers/wallhaven-l87z7l.jpg";
import defaultWallpaperThree from "@/assets/default wallpapers/wallhaven-yqxzqx.jpg";

type Channel = "reddit" | "youtube" | "instagram" | "search" | "friend" | "other";
type Plan = "standard" | "professional";

const channels: { id: Channel; label: string; icon: string }[] = [
  { id: "reddit", label: "Reddit", icon: "forum" },
  { id: "youtube", label: "YouTube", icon: "play_circle" },
  { id: "instagram", label: "Instagram", icon: "photo_camera" },
  { id: "search", label: "Google Search", icon: "search" },
  { id: "friend", label: "A friend or colleague", icon: "group" },
  { id: "other", label: "Something else", icon: "more_horiz" },
];

const wallpapers: WallpaperFile[] = [
  { id: "default-d6q21o", name: "Quiet horizon", preview: defaultWallpaperOne },
  { id: "default-l87z7l", name: "Morning light", preview: defaultWallpaperTwo },
  { id: "default-yqxzqx", name: "Deep blue", preview: defaultWallpaperThree },
];

const starterHabits: OnboardingHabit[] = [
  { name: "Read for 20 minutes", emoji: "📚", color: "#94c7a4" },
  { name: "Move your body", emoji: "💪", color: "#6bb3d6" },
];
type OnboardingHabit = { name: string; emoji: string; color: string };

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="onboarding-field"><span>{label}</span><input {...props} /></label>;
}

function Button({ children, secondary = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return <button {...props} className={`onboarding-button ${secondary ? "onboarding-button--secondary" : ""} ${props.className ?? ""}`}>{children}</button>;
}

export function AuthScreen({ onRegister }: { onRegister: () => void }) {
  const { signIn, resetPassword, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [forgot, setForgot] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      if (forgot) {
        await resetPassword(email);
        setMessage("Check your inbox for a password reset link.");
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally { setBusy(false); }
  };

  return <div className="auth-screen">
    <div className="auth-mark"><span className="material-symbols-outlined">track_changes</span><span>HALBERD</span></div>
    <div className="auth-card">
      <div className="onboarding-kicker">A quieter way to begin</div>
      <h1>Welcome back.</h1>
      <p className="onboarding-lede">Your focused workspace is waiting for you.</p>
      {!configured && <div className="onboarding-alert">Authentication is not connected yet. Add the Supabase public URL and anon key to continue.</div>}
      <form onSubmit={submit} className="onboarding-form">
        <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        {!forgot && <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />}
        <Button disabled={busy}>{busy ? "Working..." : forgot ? "Send reset link" : "Sign in"}<span className="material-symbols-outlined">arrow_forward</span></Button>
      </form>
      {message && <p className="onboarding-message">{message}</p>}
      <div className="auth-links">
        <button type="button" onClick={() => { setForgot(!forgot); setMessage(""); }}>{forgot ? "Back to sign in" : "Forgot password?"}</button>
        <span>New to Halberd?</span><button type="button" onClick={onRegister}>Create an account</button>
      </div>
    </div>
  </div>;
}

export function RegisterScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const { signUp, configured } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("");
    if (form.password.length < 8) { setMessage("Use at least 8 characters for your password."); return; }
    if (form.password !== form.confirm) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    try {
      // Set this before signup because Supabase may publish the new session immediately.
      localStorage.removeItem(userStorageKey(`registration:${form.email.toLowerCase()}`, "halberd_onboarding_complete"));
      localStorage.setItem(userStorageKey(`registration:${form.email.toLowerCase()}`, "halberd_pending_onboarding"), "true");
      await signUp(form.email, form.password, { name: form.name, phone: form.phone });
      onContinue();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create your account."); }
    finally { setBusy(false); }
  };

  return <div className="auth-screen"><div className="auth-mark"><span className="material-symbols-outlined">track_changes</span><span>HALBERD</span></div><div className="auth-card auth-card--wide">
    <button className="onboarding-back onboarding-back--auth" onClick={onBack}><span className="material-symbols-outlined">arrow_back</span>Back to sign in</button>
    <div className="onboarding-kicker">Make room for progress</div><h1>Create your account.</h1><p className="onboarding-lede">A small place for the things you want to keep moving.</p>
    <form onSubmit={submit} className="onboarding-form onboarding-form--grid">
      <Field label="Your name" value={form.name} onChange={update("name")} required autoComplete="name" />
      <Field label="Email" type="email" value={form.email} onChange={update("email")} required autoComplete="email" />
      <Field label="Phone number" type="tel" value={form.phone} onChange={update("phone")} required autoComplete="tel" />
      <Field label="Password" type="password" value={form.password} onChange={update("password")} required autoComplete="new-password" />
      <Field label="Confirm password" type="password" value={form.confirm} onChange={update("confirm")} required autoComplete="new-password" />
      <Button disabled={busy}>{busy ? "Creating..." : "Continue"}<span className="material-symbols-outlined">arrow_forward</span></Button>
    </form>
    {message && <p className="onboarding-message">{message}</p>}
  </div></div>;
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { addHabit, addWallpaper, setActiveWallpaper } = useSettings();
  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<OnboardingHabit[]>([]);
  const [savedHabitNames, setSavedHabitNames] = useState<string[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("📚");
  const [newHabitColor, setNewHabitColor] = useState("#94c7a4");
  const [selectedWallpaper, setSelectedWallpaper] = useState(wallpapers[0]!.id);
  const [customWallpaper, setCustomWallpaper] = useState<WallpaperFile | null>(null);
  const [plan, setPlan] = useState<Plan>("standard");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const onboardingViewportRef = useRef<HTMLDivElement>(null);

  const toggleHabit = (habit: OnboardingHabit) => setSelectedHabits(prev => prev.some(item => item.name === habit.name) ? prev.filter(item => item.name !== habit.name) : [...prev, habit]);
  const addCustomHabit = () => {
    const habit = newHabit.trim();
    if (!habit || selectedHabits.some(item => item.name === habit)) return;
    setSelectedHabits(prev => [...prev, { name: habit, emoji: newHabitEmoji, color: newHabitColor }]);
    setNewHabit("");
    setNewHabitEmoji("📚");
    setNewHabitColor("#94c7a4");
  };
  const continueOnboarding = () => {
    if (step === 1) {
      const unsavedHabits = selectedHabits.filter(habit => !savedHabitNames.includes(habit.name));
      unsavedHabits.forEach(habit => addHabit({ ...habit, tracking: {} }));
      if (unsavedHabits.length > 0) setSavedHabitNames(prev => [...prev, ...unsavedHabits.map(habit => habit.name)]);
    }
    setStep(step + 1);
  };

  useEffect(() => {
    if (step === 1) {
      onboardingViewportRef.current?.scrollTo({ top: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(".onboarding-habits-section")?.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, [step]);
  const handleCustomWallpaper = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === "string") { const item = { id: "onboarding-custom", name: file.name, preview: reader.result }; setCustomWallpaper(item); setSelectedWallpaper(item.id); } }; reader.readAsDataURL(file);
  };
  const finish = async () => {
    setBusy(true); setMessage("");
    const profile = { name: user?.user_metadata?.name as string | undefined, phone: user?.user_metadata?.phone as string | undefined };
    const selected = customWallpaper ?? wallpapers.find(item => item.id === selectedWallpaper) ?? wallpapers[0]!;
    try {
      wallpapers.forEach(item => { if (item.id === selected.id || item.id === selectedWallpaper) addWallpaper(item); });
      if (customWallpaper) addWallpaper(customWallpaper);
      setActiveWallpaper(selected.id);
      // Keep the selected background available immediately on the next new-tab mount.
      if (user) localStorage.setItem(userStorageKey(user.id, "activeWallpaper"), JSON.stringify(selected.id));
      if (supabase && user) {
        await supabase.from("profiles").upsert({ id: user.id, name: profile.name ?? user.user_metadata.name ?? "", phone: profile.phone ?? "" });
        await supabase.from("onboarding_preferences").upsert({ user_id: user.id, discovery_channel: channel, selected_plan: plan, onboarding_completed: true });
        await supabase.from("subscriptions").upsert({ user_id: user.id, plan, status: "active" });
      }
      if (user) {
        localStorage.setItem(userStorageKey(user.id, "halberd_onboarding_complete"), "true");
        localStorage.removeItem(userStorageKey(`registration:${user.email?.toLowerCase() ?? "unknown"}`, "halberd_pending_onboarding"));
        localStorage.setItem(userStorageKey(user.id, "halberd_onboarding_preferences"), JSON.stringify({ channel, plan }));
      }
      onComplete();
    } catch (error) { setMessage(error instanceof Error ? error.message : "We couldn't finish setup. Please try again."); }
    finally { setBusy(false); }
  };

  const content = [
    <section key="source"><div className="onboarding-kicker">A little context</div><h2>How did you find Halberd?</h2><p className="onboarding-lede">It helps us understand how calm tools find their way to people.</p><div className="choice-grid">{channels.map(item => <button key={item.id} className={`choice-card ${channel === item.id ? "choice-card--selected" : ""}`} onClick={() => setChannel(item.id)}><span className="material-symbols-outlined">{item.icon}</span><span>{item.label}</span>{channel === item.id && <span className="material-symbols-outlined choice-check">check</span>}</button>)}</div></section>,
    <section key="habits" className="onboarding-habits-section"><div className="onboarding-kicker">Your rhythm</div><h2>Add your habits.</h2><p className="onboarding-lede">Choose a few habits or create your own with the same emoji and color options as Habit Tracker.</p><div className="habit-choices">{starterHabits.map(habit => { const selected = selectedHabits.some(item => item.name === habit.name); return <button type="button" key={habit.name} className={`habit-choice ${selected ? "habit-choice--selected" : ""}`} onClick={() => toggleHabit(habit)}><span className="habit-dot">{selected ? "✓" : ""}</span><AnimatedEmoji emoji={habit.emoji} size={21} /><span>{habit.name}</span><span className="onboarding-habit-color" style={{ backgroundColor: habit.color }} /></button>; })}{selectedHabits.filter(habit => !starterHabits.some(starter => starter.name === habit.name)).map(habit => <button type="button" key={habit.name} className="habit-choice habit-choice--selected" onClick={() => toggleHabit(habit)}><span className="habit-dot">✓</span><AnimatedEmoji emoji={habit.emoji} size={21} />{habit.name}<span className="onboarding-habit-color" style={{ backgroundColor: habit.color }} /></button>)}<div className="onboarding-habit-form"><label className="onboarding-field"><span>Habit name</span><input value={newHabit} onChange={event => setNewHabit(event.target.value)} placeholder="e.g., Read 20 minutes" aria-label="Add a custom habit" /></label><div className="onboarding-picker-field"><span className="onboarding-picker-label">Emoji</span><EmojiPickerPanel selected={newHabitEmoji} onSelect={setNewHabitEmoji} /></div><div className="onboarding-picker-field"><span className="onboarding-picker-label">Color</span><ColorPicker selected={newHabitColor} onSelect={setNewHabitColor} /></div><button type="button" className="onboarding-add-habit" onClick={addCustomHabit} disabled={!newHabit.trim()}><span className="material-symbols-outlined">add</span>Add habit</button></div></div></section>,
    <section key="wallpaper"><div className="onboarding-kicker">Your backdrop</div><h2>Make it yours.</h2><p className="onboarding-lede">Choose a quiet scene for the space you will return to every day, or use your own image.</p><div className="wallpaper-choices">{wallpapers.map(item => <button type="button" key={item.id} className={`onboarding-wallpaper ${selectedWallpaper === item.id ? "onboarding-wallpaper--selected" : ""}`} onClick={() => setSelectedWallpaper(item.id)}><img src={item.preview} alt={item.name} /><span>{item.name}</span>{selectedWallpaper === item.id && <i className="material-symbols-outlined">check</i>}</button>)}{customWallpaper && <button type="button" className={`onboarding-wallpaper ${selectedWallpaper === customWallpaper.id ? "onboarding-wallpaper--selected" : ""}`} onClick={() => setSelectedWallpaper(customWallpaper.id)}><img src={customWallpaper.preview} alt={customWallpaper.name} /><span>{customWallpaper.name}</span><i className="material-symbols-outlined">check</i></button>}<label className="onboarding-wallpaper onboarding-wallpaper--upload"><span className="material-symbols-outlined">add_photo_alternate</span><span>Upload your own</span><input type="file" accept="image/*" onChange={handleCustomWallpaper} /></label></div></section>,
    <section key="plan"><div className="onboarding-kicker">Choose your pace</div><h2>Choose your plan.</h2><p className="onboarding-lede">Start simply. Upgrade when your practice needs a little more room.</p><div className="plan-grid"><button type="button" className={`plan-card ${plan === "standard" ? "plan-card--selected" : ""}`} onClick={() => setPlan("standard")}><span className="plan-name">Standard</span><strong>Free</strong><span>Essential habits, tasks, goals, and focus tools.</span>{plan === "standard" && <i className="material-symbols-outlined">check_circle</i>}</button><button type="button" className={`plan-card ${plan === "professional" ? "plan-card--selected" : ""}`} onClick={() => setPlan("professional")}><span className="plan-name">Professional</span><strong>$5 <small>/ month</small></strong><span>More room for advanced productivity features, coming soon.</span>{plan === "professional" && <i className="material-symbols-outlined">check_circle</i>}</button></div></section>,
  ];

  return <div ref={onboardingViewportRef} className="onboarding-screen"><div className="onboarding-top"><div className="auth-mark"><span className="material-symbols-outlined">track_changes</span><span>HALBERD</span></div><span className="onboarding-step">0{step + 1} / 04</span></div><main className="onboarding-panel"><div className="onboarding-progress"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /></div><div className="onboarding-content">{content[step]}</div><div className="onboarding-footer">{step > 0 ? <button className="onboarding-back" onClick={() => setStep(step - 1)}><span className="material-symbols-outlined">arrow_back</span>Back</button> : <span />}{message && <span className="onboarding-message">{message}</span>}<Button disabled={(step === 0 && !channel) || busy} onClick={() => step < 3 ? continueOnboarding() : finish()}>{busy ? "Finishing..." : step === 3 ? "Enter Halberd" : "Continue"}<span className="material-symbols-outlined">arrow_forward</span></Button></div></main></div>;
}
