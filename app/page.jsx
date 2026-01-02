"use client";

import { useState, useEffect } from "react";
import { days } from "../data/days";
import supabase, { isSupabaseConfigured } from "../lib/supabaseClient";
import { DEFAULT_AVATAR } from "../lib/defaults";

// Streak Intro Screen
function StreakIntro({ streak, onContinue, longest }) {
  // show longest will be passed in later
  const [animate, setAnimate] = useState(false);
  const [showShare, setShowShare] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);
  const shareText = `Check out my current streak in Bible365 🔥 ${streak} ${streak === 1 ? 'day' : 'days'} 🔥`;
  const tryCopy = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  };
  const shareTo = async (service) => {
    const text = shareText;
    // Use Web Share API when possible
    if (navigator.share) {
      try { await navigator.share({ title: 'Bible365 Streak', text }); setShowShare(false); return; } catch (e) { /* fallthrough */ }
    }
    const encoded = encodeURIComponent(text);
    const pageUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
    if (service === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
    } else if (service === 'facebook') {
      // Facebook prefers a URL; include quote
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${encoded}`, '_blank');
    } else if (service === 'instagram' || service === 'snapchat') {
      // No reliable web share URL for these — copy text and open their site
      const copied = await tryCopy(text);
      if (service === 'instagram') window.open('https://www.instagram.com/', '_blank');
      else window.open('https://www.snapchat.com/', '_blank');
      alert((copied ? 'Message copied to clipboard — ' : '') + 'Paste it into the app to share your streak.');
    }
    setShowShare(false);
  };
  return (
    <div style={{
      position:"fixed",
      top:0,
      left:0,
      width:"100%",
      height:"100%",
      backgroundColor:"#FBF7F2",
      display:"flex",
      flexDirection:"column",
      justifyContent:"center",
      alignItems:"center",
      zIndex:9999,
      transition:"opacity 0.5s ease",
      opacity: animate ? 1 : 0
    }}>
      <div style={{
        transform: animate ? "scale(1)" : "scale(0.5)",
        opacity: animate ? 1 : 0,
        transition:"all 1s ease",
        textAlign:"center"
      }}>
        <h1 style={{ fontSize:48, color:"#6B3E26", marginBottom:20 }}>🔥 Your Current Streak 🔥</h1>
        <p style={{ fontSize:36, color:"#8A6A52", marginBottom:8 }}>{streak} {streak === 1 ? "day" : "days"}</p>
        <p style={{ fontSize:14, color:"#8A6A52", marginBottom:40 }}>Longest: <strong style={{color:"#6B3E26"}}>{longest ?? "—"}</strong></p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button 
            onClick={onContinue} 
            style={{
              padding:"12px 20px",
              fontSize:18,
              borderRadius:10,
              border:"none",
              backgroundColor:"#6B3E26",
              color:"#FBF7F2",
              cursor:"pointer",
              transition:"transform 0.2s ease",
            }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >
            Continue
          </button>
          <button onClick={()=>setShowShare(true)} style={{ padding:'12px 18px', borderRadius:10, border:'1px solid #ddd', background:'#fff', cursor:'pointer', color:'#000' }}>Share Streak</button>
        </div>
        {showShare && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)', zIndex:99999 }}>
            <div style={{ background:'#fff', padding:18, borderRadius:12, width:320, textAlign:'center' }}>
              <h3 style={{ marginTop:0 }}>Share your streak</h3>
              <div style={{ marginTop:8, marginBottom:12, color:'#333' }}>{shareText}</div>
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <button onClick={()=>shareTo('instagram')} style={{ padding:8, minWidth:110 }}>Instagram</button>
                <button onClick={()=>shareTo('snapchat')} style={{ padding:8, minWidth:110 }}>Snapchat</button>
                <button onClick={()=>shareTo('facebook')} style={{ padding:8, minWidth:110 }}>Facebook</button>
                <button onClick={()=>shareTo('x')} style={{ padding:8, minWidth:110 }}>X</button>
              </div>
              <div style={{ marginTop:12 }}><button onClick={()=>setShowShare(false)}>Close</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [currentDay, setCurrentDay] = useState(1);
  const [dayOpacity, setDayOpacity] = useState(1); 
  const [jumpDay, setJumpDay] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [journal, setJournal] = useState("");
  const [otNote, setOtNote] = useState("");
  const [ntNote, setNtNote] = useState("");
  const [completedDays, setCompletedDays] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [badgeSpinning, setBadgeSpinning] = useState(false);
  const [longestStreak, setLongestStreak] = useState(0);
  const [colorScheme, setColorScheme] = useState("warm");
  // Profile / Auth states
  const [currentUser, setCurrentUser] = useState(null); // stores email
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDesc, setProfileDesc] = useState("");
  const [favVerse, setFavVerse] = useState("");
  const [profileAvatar, setProfileAvatar] = useState(DEFAULT_AVATAR);
  const [darkMode, setDarkMode] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [modalFollowerCount, setModalFollowerCount] = useState(0);
  const [modalFollowingCount, setModalFollowingCount] = useState(0);
  const [modalCountsLoading, setModalCountsLoading] = useState(false);
  // Achievements
  const [achievements, setAchievements] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [activeAchievementIndex, setActiveAchievementIndex] = useState(null);
  // Consent / policies
  const [showConsentModal, setShowConsentModal] = useState(false);
  // Restore progress states
  const [showRestoreInput, setShowRestoreInput] = useState(false);
  const [restoreDay, setRestoreDay] = useState("");
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [agreedAll, setAgreedAll] = useState(false);
  const [consentTosAt, setConsentTosAt] = useState(null);
  const [consentPrivacyAt, setConsentPrivacyAt] = useState(null);
  const [showPolicyViewer, setShowPolicyViewer] = useState(false);
  const [policyToView, setPolicyToView] = useState('privacy'); // 'privacy' | 'tos'

  // Bible viewer states
  const [showBible, setShowBible] = useState(false);
  const [bibleBooks] = useState([
    { name: 'Genesis', chapters:50 },{ name:'Exodus', chapters:40 },{ name:'Leviticus', chapters:27 },{ name:'Numbers', chapters:36 },{ name:'Deuteronomy', chapters:34 },
    { name:'Joshua', chapters:24 },{ name:'Judges', chapters:21 },{ name:'Ruth', chapters:4 },{ name:'1 Samuel', chapters:31 },{ name:'2 Samuel', chapters:24 },
    { name:'1 Kings', chapters:22 },{ name:'2 Kings', chapters:25 },{ name:'1 Chronicles', chapters:29 },{ name:'2 Chronicles', chapters:36 },{ name:'Ezra', chapters:10 },
    { name:'Nehemiah', chapters:13 },{ name:'Esther', chapters:10 },{ name:'Job', chapters:42 },{ name:'Psalms', chapters:150 },{ name:'Proverbs', chapters:31 },
    { name:'Ecclesiastes', chapters:12 },{ name:'Song of Solomon', chapters:8 },{ name:'Isaiah', chapters:66 },{ name:'Jeremiah', chapters:52 },{ name:'Lamentations', chapters:5 },
    { name:'Ezekiel', chapters:48 },{ name:'Daniel', chapters:12 },{ name:'Hosea', chapters:14 },{ name:'Joel', chapters:3 },{ name:'Amos', chapters:9 },
    { name:'Obadiah', chapters:1 },{ name:'Jonah', chapters:4 },{ name:'Micah', chapters:7 },{ name:'Nahum', chapters:3 },{ name:'Habakkuk', chapters:3 },
    { name:'Zephaniah', chapters:3 },{ name:'Haggai', chapters:2 },{ name:'Zechariah', chapters:14 },{ name:'Malachi', chapters:4 },
    { name:'Matthew', chapters:28 },{ name:'Mark', chapters:16 },{ name:'Luke', chapters:24 },{ name:'John', chapters:21 },{ name:'Acts', chapters:28 },
    { name:'Romans', chapters:16 },{ name:'1 Corinthians', chapters:16 },{ name:'2 Corinthians', chapters:13 },{ name:'Galatians', chapters:6 },{ name:'Ephesians', chapters:6 },
    { name:'Philippians', chapters:4 },{ name:'Colossians', chapters:4 },{ name:'1 Thessalonians', chapters:5 },{ name:'2 Thessalonians', chapters:3 },{ name:'1 Timothy', chapters:6 },
    { name:'2 Timothy', chapters:4 },{ name:'Titus', chapters:3 },{ name:'Philemon', chapters:1 },{ name:'Hebrews', chapters:13 },{ name:'James', chapters:5 },
    { name:'1 Peter', chapters:5 },{ name:'2 Peter', chapters:3 },{ name:'1 John', chapters:5 },{ name:'2 John', chapters:1 },{ name:'3 John', chapters:1 },{ name:'Jude', chapters:1 },{ name:'Revelation', chapters:22 }
  ]);
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterVerses, setChapterVerses] = useState([]);
  const [bibleSearch, setBibleSearch] = useState('');
  const [bibleLoading, setBibleLoading] = useState(false);

  const PRIVACY_POLICY_TEXT = `Privacy Policy
Bible in a Year
Effective Date: [01/01/2027}
1. Introduction
Bible in a Year (“we,” “our,” or “the App”) respects your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our mobile application.
This app is free and will never request payment or financial information.

2. Information We Collect
a. Information You Provide
When you create an account, we may collect:
Email address (used for authentication)


Username and display name


Profile photo (optional)


Reading progress and streaks


Profile visibility preference (public or private)


b. Automatically Collected Information
We may collect limited technical information such as:
Device type


App usage data (for stability and performance)


Authentication identifiers


We do not collect precise location data.

3. Public vs Private Profiles
During account setup, you choose whether your profile is public or private.
Public Profiles
If you choose a public profile, other users may see:
Username


Display name


Profile photo


Reading streaks or achievements (if enabled)

Private Profiles
If your profile is private:
Your profile is not visible to other users


Your reading activity is kept private


You may change this setting at any time.

4. Following Other Users
If you enable social features:
You may follow or unfollow other users


Other users may see that you follow them (if profiles are public)


You may block users at any time


We do not provide messaging features at this time.

5. How We Use Your Information
We use your information to:
Provide and maintain app functionality


Track Bible reading progress and streaks


Enable optional social features


Improve app performance and reliability


Ensure app security


We do not sell your data.

6. Data Storage & Security
We use secure third-party services (such as Supabase) to store and protect user data.
Reasonable safeguards are in place to protect your information, but no system is 100% secure.

7. Data Sharing
We do not sell or rent your personal data.
Your data is only shared:
When you choose to make profile information public


With service providers necessary to operate the app


If required by law



8. Account Deletion
You may delete your account at any time.
When you delete your account:
Your profile is permanently removed


Your reading data and social connections are deleted


Your data cannot be recovered



9. Children’s Privacy
Bible in a Year is intended for users 13 years of age or older.
We do not knowingly collect personal data from children under 13.
 If you believe a child has provided personal information, please contact us.

10. Changes to This Policy
We may update this Privacy Policy from time to time.
 Changes will be posted in the app or on our website.
`;

  const TOS_TEXT = `📜 Terms of Service
Bible in a Year
Effective Date: [Insert date]

1. Acceptance of Terms
By using Bible in a Year, you agree to these Terms of Service.
 If you do not agree, please do not use the app.

2. Free App Notice
Bible in a Year is:
Free


No subscriptions


No payments


No purchases


We will never ask for payment or financial information.

3. User Accounts
To use certain features, you must create an account.
You agree to:
Provide accurate information


Keep your account secure


Be responsible for activity under your account



4. Acceptable Use
You agree not to:
Harass, threaten, or abuse other users


Impersonate another person


Attempt to access accounts you do not own


Use the app for unlawful purposes


We reserve the right to suspend or terminate accounts that violate these rules.

5. User Content
You are responsible for any content you choose to share publicly.
We do not claim ownership over your profile content, but you grant us permission to display it as part of the app.

6. Community Conduct
Bible in a Year is intended to be a respectful and encouraging environment.
We may remove content or restrict accounts that:
Promote hate or harassment


Disrupt the community


Violate these Terms



7. Religious Disclaimer
Bible in a Year provides religious and devotional content for spiritual encouragement only.
The app:
Is not professional counseling


Is not medical or mental health advice


Should not replace professional guidance



8. Termination
You may stop using the app at any time.
We may suspend or terminate access if:
These Terms are violated


Required by law


Necessary to protect users or the platform



9. Limitation of Liability
Bible in a Year is provided “as is.”
We are not liable for:
Data loss


App interruptions


Personal interpretations of religious content



10. Changes to Terms
We may update these Terms from time to time. Continued use of the app means acceptance of any updates.

`;
  // Search & follows
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [followingMap, setFollowingMap] = useState({}); // followee_id -> true
  // Custom schedule settings
  const [chaptersPerDay, setChaptersPerDay] = useState(1);
  const [finishYears, setFinishYears] = useState(1);
  const [customSchedule, setCustomSchedule] = useState(null);
  const [scheduleMessage, setScheduleMessage] = useState("");

  // Resolve current reading either from customSchedule or default `days`
  const totalDaysInDefault = days.length;
  const scheduleEntries = customSchedule?.entries || null;
  const currentIndex = Math.max(0, Math.min((currentDay - 1), (scheduleEntries ? scheduleEntries.length - 1 : totalDaysInDefault - 1)));
  const day = scheduleEntries ? scheduleEntries[currentIndex] : days.find(d => d.day === currentDay);
  if (!day) return null;

  // ---------------- Load localStorage data ----------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!localStorage.getItem("introSeen")) setShowIntro(true);

    // If Supabase is configured, check for existing session and load profile
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const user = data?.session?.user;
          if (user) {
            setCurrentUser(user.id);
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (profile) {
              setProfileDesc(profile.description || "");
              setFavVerse(profile.fav_verse || "");
              setProfileAvatar(profile.avatar_url || DEFAULT_AVATAR);
              setLongestStreak(profile.longest_streak || 0);
              setCompletedDays(profile.completed_days || 0);
              setStreak(profile.streak || 0);
            }
          }
        } catch (err) { console.warn('supabase session load failed', err); }
      })();
    }

    const savedBookmark = localStorage.getItem("bookmarkedDay");
    if (savedBookmark) setCurrentDay(parseInt(savedBookmark));

    const savedStreak = JSON.parse(localStorage.getItem("streak")) || { count: 0, lastDate: null };
    const today = new Date().toISOString().slice(0,10);
    if (savedStreak.lastDate) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      if (savedStreak.lastDate === yesterday) savedStreak.count += 1;
      else if (savedStreak.lastDate !== today) savedStreak.count = 1;
    } else savedStreak.count = 1;
    savedStreak.lastDate = today;
    localStorage.setItem("streak", JSON.stringify(savedStreak));
    setStreak(savedStreak.count);

    // Load/update longest streak
    const savedLongest = parseInt(localStorage.getItem("longestStreak")) || 0;
    if (savedStreak.count > savedLongest) {
      localStorage.setItem("longestStreak", savedStreak.count);
      setLongestStreak(savedStreak.count);
    } else {
      setLongestStreak(savedLongest);
    }

    const savedDarkMode = JSON.parse(localStorage.getItem("darkMode")) || false;
    const savedVolume = parseFloat(localStorage.getItem("musicVolume")) || 0.5;
    setDarkMode(savedDarkMode);
    setMusicVolume(savedVolume);

    const savedScheme = localStorage.getItem("colorScheme") || "warm";
    setColorScheme(savedScheme);

    // Load current user profile if any
    const savedCurrent = localStorage.getItem("currentUser") || null;
    if (savedCurrent) {
      setCurrentUser(savedCurrent);
      const users = JSON.parse(localStorage.getItem("users") || "{}");
      const u = users[savedCurrent];
      if (u) {
        setProfileDesc(u.description || "");
        setFavVerse(u.favVerse || "");
        setProfileAvatar(u.avatar || DEFAULT_AVATAR);
      }
    }

    const audio = document.getElementById("backgroundMusic");
    if (audio) audio.volume = savedVolume;

    // If notifications already granted, initialize scheduling
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        initNotifications();
      }
    } catch (e) { /* ignore */ }

  }, []);

  // Check consent on first load (localStorage) or per-user (Supabase)
  useEffect(() => {
    const checkConsent = async () => {
      if (isSupabaseConfigured && supabase && currentUser) {
        try {
          const { data } = await supabase.from('profiles').select('tos_accepted_at, privacy_accepted_at').eq('id', currentUser).maybeSingle();
          const tos = data?.tos_accepted_at || null;
          const priv = data?.privacy_accepted_at || null;
          setConsentTosAt(tos); setConsentPrivacyAt(priv);
          if (!tos || !priv) setShowConsentModal(true);
          return;
        } catch (err) { console.warn('consent fetch failed', err); }
      }
      // localStorage fallback
      const consent = JSON.parse(localStorage.getItem('consent') || '{}');
      const tos = consent.tos || false; const priv = consent.privacy || false;
      if (!tos || !priv) setShowConsentModal(true);
    };
    checkConsent();
  }, [currentUser]);

  // Load saved custom schedule from localStorage (or Supabase) on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('customSchedule');
    if (saved) setCustomSchedule(JSON.parse(saved));
  }, []);

  // Helper: parse chapter-ish tokens to estimate chapter counts from text like "Genesis 1-3" or "Matthew 1"
  const parseChapterCount = (text) => {
    if (!text || typeof text !== 'string') return 0;
    // split by commas or "/" or spaces around
    const parts = text.split(/,|\//).map(p => p.trim()).filter(Boolean);
    let count = 0;
    parts.forEach(p => {
      // ignore verse ranges like "119:1-88"
      if (p.match(/:\d/)) { count += 1; return; }
      const m = p.match(/(\d+)-(\d+)$/);
      if (m) {
        const a = parseInt(m[1],10), b = parseInt(m[2],10);
        if (!isNaN(a) && !isNaN(b) && b>=a) count += (b - a + 1);
        else count += 1;
        return;
      }
      // trailing single number
      const m2 = p.match(/(\d+)$/);
      if (m2) { count += 1; return; }
      // fallback: count as 1
      count += 1;
    });
    return count;
  };

  // Build a custom schedule grouping the default `days` chunks into per-day readings according to chaptersPerDay and finishYears
  const buildCustomSchedule = async ({ chaptersPerDay: cpd, finishYears: yrs }) => {
    // Expand OT and NT into atomic chapter tokens
    const expandChapters = (text) => {
      if (!text || typeof text !== 'string') return [];
      const tokens = text.split(/,|\//).map(t=>t.trim()).filter(Boolean);
      const out = [];
      tokens.forEach(tok => {
        // If token contains ':' treat as single (e.g., Psalms 119:1-88)
        if (tok.match(/:\d/)) { out.push(tok); return; }
        const mRange = tok.match(/^(.*)\s(\d+)-(\d+)$/);
        if (mRange) {
          const book = mRange[1].trim();
          const a = parseInt(mRange[2],10), b = parseInt(mRange[3],10);
          for (let c=a;c<=b;c++) out.push(`${book} ${c}`);
          return;
        }
        // single chapter like "Matthew 1"
        const mSingle = tok.match(/^(.*)\s(\d+)$/);
        if (mSingle) { out.push(tok); return; }
        // fallback: push raw
        out.push(tok);
      });
      return out;
    };

    const otList = [];
    const ntList = [];
    days.forEach(d => {
      expandChapters(d.oldTestament).forEach(x => otList.push(x));
      expandChapters(d.newTestament).forEach(x => ntList.push(x));
    });
    const totalChapters = otList.length + ntList.length || days.length;
    const targetDays = Math.max(1, Math.round(yrs * 365));
    const avgNeeded = Math.ceil(totalChapters / targetDays);
    let message = '';
    if (cpd < avgNeeded) message = `To finish in ${yrs} year(s) you need ~${avgNeeded} chapters/day; schedule will use that average.`;

    // Build schedule by allocating up to avgNeeded chapters per day, alternating OT/NT tokens
    const schedule = [];
    let otIdx = 0, ntIdx = 0;
    for (let dayIdx=0; dayIdx<targetDays; dayIdx++) {
      let cap = avgNeeded;
      const otParts = [];
      const ntParts = [];
      // alternate filling: prefer OT then NT
      while (cap > 0 && (otIdx < otList.length || ntIdx < ntList.length)) {
        if (otIdx < otList.length && cap > 0) { otParts.push(otList[otIdx++]); cap--; }
        if (ntIdx < ntList.length && cap > 0) { ntParts.push(ntList[ntIdx++]); cap--; }
        // if one side exhausted, continue filling from the other
        if (otIdx >= otList.length && ntIdx < ntList.length && cap > 0) { ntParts.push(ntList[ntIdx++]); cap--; }
        if (ntIdx >= ntList.length && otIdx < otList.length && cap > 0) { otParts.push(otList[otIdx++]); cap--; }
      }
      schedule.push({ oldTestament: otParts.join(' / '), newTestament: ntParts.join(' / '), reflection: '', prompt: '', chapters: (otParts.length + ntParts.length) });
    }

    // collect all reflections/prompts and spread them across schedule
    const allReflections = days.map(d=>d.reflection).filter(Boolean);
    const allPrompts = days.map(d=>d.prompt).filter(Boolean);
    if (allReflections.length > 0) {
      const step = Math.max(1, Math.floor(targetDays / allReflections.length));
      let ri = 0;
      for (let p = 0; p < targetDays && ri < allReflections.length; p += step, ri++) {
        schedule[p].reflection = schedule[p].reflection ? schedule[p].reflection + '\n\n' + allReflections[ri] : allReflections[ri];
      }
    }
    if (allPrompts.length > 0) {
      const step2 = Math.max(1, Math.floor(targetDays / allPrompts.length));
      let pi = 0;
      for (let p = 0; p < targetDays && pi < allPrompts.length; p += step2, pi++) {
        schedule[p].prompt = schedule[p].prompt ? schedule[p].prompt + ' / ' + allPrompts[pi] : allPrompts[pi];
      }
    }

    // If schedule is longer than a year, fill missing reflections/prompts with simple defaults
    if (targetDays > 365) {
      for (let i = 0; i < schedule.length; i++) {
        if (!schedule[i].reflection || schedule[i].reflection.trim() === '') schedule[i].reflection = "Reflect on today's readings";
        if (!schedule[i].prompt || schedule[i].prompt.trim() === '') schedule[i].prompt = "How is God speaking to you today";
      }
    }

    const result = { createdAt: new Date().toISOString(), options: { chaptersPerDay: cpd, finishYears: yrs, targetDays, avgNeeded }, entries: schedule };
    try { localStorage.setItem('customSchedule', JSON.stringify(result)); } catch (e) { console.warn('save schedule failed', e); }
    if (isSupabaseConfigured && supabase && currentUser) {
      try {
        await supabase.from('profiles').upsert({ id: currentUser, schedule: result });
      } catch (err) { console.warn('supabase save schedule failed', err); }
    }
    setCustomSchedule(result);
    setCurrentDay(1);
    setScheduleMessage(message);
    return result;
  };
  // keep the single-agree checkbox synced with the two individual checks
  useEffect(() => {
    setAgreedAll(tosChecked && privacyChecked);
  }, [tosChecked, privacyChecked]);

  const setScheme = (s) => {
    setColorScheme(s);
    if (typeof window !== "undefined") localStorage.setItem("colorScheme", s);
  };

  // When currentUser changes, load who they follow (if Supabase enabled)
  useEffect(() => {
    if (!currentUser) { setFollowingMap({}); return; }
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', currentUser);
          if (data) {
            const map = {};
            data.forEach(r => { map[r.followee_id] = true; });
            setFollowingMap(map);
          }
        } catch (err) { console.warn('fetch following failed', err); }
      })();
    } else {
      const all = JSON.parse(localStorage.getItem('follows') || '{}');
      const list = all[currentUser] || [];
      const map = {};
      list.forEach(id => map[id] = true);
      setFollowingMap(map);
    }
  }, [currentUser]);

  const searchProfiles = async (q) => {
    setSearchQuery(q);
    setSearchError("");
    if (!q || q.trim().length < 1) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('profiles')
          .select('id, username, avatar_url, description')
          .ilike('username', `%${q}%`)
          .limit(20);
        if (error) throw error;
        setSearchResults(data || []);
      } else {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const results = Object.keys(users).filter(k => k.toLowerCase().includes(q.toLowerCase())).slice(0,20).map(k=>({ id:k, username:k, avatar_url: users[k].avatar, description: users[k].description }));
        setSearchResults(results);
      }
    } catch (err) {
      console.error(err);
      setSearchError(err.message || 'Search failed');
    } finally { setIsSearching(false); }
  };

  const followUser = async (followeeId) => {
    if (!currentUser) { setShowAuthModal(true); return; }
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('follows').insert({ follower_id: currentUser, followee_id: followeeId });
      } else {
        const all = JSON.parse(localStorage.getItem('follows') || '{}');
        all[currentUser] = all[currentUser] || [];
        if (!all[currentUser].includes(followeeId)) all[currentUser].push(followeeId);
        localStorage.setItem('follows', JSON.stringify(all));
      }
      setFollowingMap(prev => ({ ...prev, [followeeId]: true }));
    } catch (err) { console.error('follow failed', err); }
  };

  const unfollowUser = async (followeeId) => {
    if (!currentUser) { setShowAuthModal(true); return; }
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('follows').delete().match({ follower_id: currentUser, followee_id: followeeId });
      } else {
        const all = JSON.parse(localStorage.getItem('follows') || '{}');
        all[currentUser] = (all[currentUser] || []).filter(id => id !== followeeId);
        localStorage.setItem('follows', JSON.stringify(all));
      }
      setFollowingMap(prev => { const copy = { ...prev }; delete copy[followeeId]; return copy; });
    } catch (err) { console.error('unfollow failed', err); }
  };

  // ---------------- Load journal and completed days ----------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load journal for current day
      const savedJournal = localStorage.getItem(`journal-day-${currentDay}`) || "";
      setJournal(savedJournal);

      // Load OT/NT notes for current day
      const savedOt = localStorage.getItem(`otNote-day-${currentDay}`) || "";
      const savedNt = localStorage.getItem(`ntNote-day-${currentDay}`) || "";
      setOtNote(savedOt);
      setNtNote(savedNt);

      // Update completed days (respect custom schedule length if present)
      const max = (customSchedule && customSchedule.entries) ? customSchedule.entries.length : days.length;
      let completed = 0;
      const restored = (() => { try { return JSON.parse(localStorage.getItem('restoredProgress') || 'null'); } catch(e){ return null; } })();
      for (let i=1;i<=max;i++) {
        const hasJournal = !!localStorage.getItem(`journal-day-${i}`);
        const restoredCovers = restored && restored.to && restored.to >= i;
        if (hasJournal || restoredCovers) completed++;
      }
      setCompletedDays(completed);

      // Save current day bookmark
      localStorage.setItem("bookmarkedDay", currentDay);
    }
  }, [currentDay]);

  // ---------------- Page transition ----------------
  const changeDay = (newDay) => {
    setDayOpacity(0);
    setTimeout(() => {
      setCurrentDay(newDay);
      setDayOpacity(1);
    }, 250);
  };

  const nextDay = () => { const max = (customSchedule && customSchedule.entries) ? customSchedule.entries.length : 365; if (currentDay < max) changeDay(currentDay + 1); };
  const prevDay = () => { if (currentDay > 1) changeDay(currentDay - 1); };
  const jumpToDay = () => {
    const num = parseInt(jumpDay);
    const max = (customSchedule && customSchedule.entries) ? customSchedule.entries.length : 365;
    if (!isNaN(num) && num >=1 && num <= max) changeDay(num);
    setJumpDay("");
  };
  const handleDateChange = (value) => {
    setSelectedDate(value);
    if (!value) return;
    const pickedDate = new Date(value);
    const startOfYear = new Date(pickedDate.getFullYear(),0,1);
    const diffTime = pickedDate - startOfYear;
    const diffDays = Math.floor(diffTime / (1000*60*60*24)) +1;
    if (diffDays>=1 && diffDays<=365) changeDay(diffDays);
  };

  // ---------------- Bible viewer helpers ----------------
  const fetchChapter = async (bookName, chapterNum) => {
    if (!bookName || !chapterNum) return;
    setBibleLoading(true);
    setChapterVerses([]);
    try {
      const key = `bible-cache:${bookName}:${chapterNum}`;
      const raw = (typeof window !== 'undefined') ? localStorage.getItem(key) : null;
      if (raw) {
        try { const parsed = JSON.parse(raw); setChapterVerses(parsed); setBibleLoading(false); return; } catch (e) { /* fallback to network */ }
      }
      const query = encodeURIComponent(`${bookName} ${chapterNum}`);
      const res = await fetch(`https://bible-api.com/${query}`);
      if (!res.ok) {
        setChapterVerses([{ verse:0, text: 'Chapter not found.' }]);
        setBibleLoading(false);
        return;
      }
      const data = await res.json();
      const verses = (data.verses || []).map(v => ({ verse: v.verse, text: v.text }));
      if (verses.length === 0 && data.text) {
        // sometimes API returns text
        setChapterVerses([{ verse:0, text: data.text }]);
        try { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify([{ verse:0, text: data.text }])); } catch(e){}
      } else {
        setChapterVerses(verses);
        try { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(verses)); } catch(e){}
      }
    } catch (e) {
      setChapterVerses([{ verse:0, text: 'Failed to load chapter.' }]);
    } finally { setBibleLoading(false); }
  };

  const isBookCached = (bookIndex) => {
    const book = bibleBooks[bookIndex];
    for (let i=1;i<=book.chapters;i++) {
      const key = `bible-cache:${book.name}:${i}`;
      if (!localStorage.getItem(key)) return false;
    }
    return true;
  };

  const [offlineDownloading, setOfflineDownloading] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState({ done:0, total:0 });

  const [offlineDownloadingAll, setOfflineDownloadingAll] = useState(false);
  const [offlineAllProgress, setOfflineAllProgress] = useState({ done:0, total:0 });
  const [offlineAllCancelled, setOfflineAllCancelled] = useState(false);

  const downloadBookOffline = async (bookIndex) => {
    const book = bibleBooks[bookIndex];
    setOfflineDownloading(true);
    setOfflineProgress({ done:0, total: book.chapters });
    for (let i=1;i<=book.chapters;i++) {
      const key = `bible-cache:${book.name}:${i}`;
      if (localStorage.getItem(key)) {
        setOfflineProgress(p => ({ ...p, done: p.done + 1 }));
        continue;
      }
      try {
        const query = encodeURIComponent(`${book.name} ${i}`);
        const res = await fetch(`https://bible-api.com/${query}`);
        if (!res.ok) { localStorage.setItem(key, JSON.stringify([{ verse:0, text: 'Not available.' }])); setOfflineProgress(p => ({ ...p, done: p.done + 1 })); continue; }
        const data = await res.json();
        const verses = (data.verses || []).map(v => ({ verse: v.verse, text: v.text }));
        try { localStorage.setItem(key, JSON.stringify(verses)); } catch(e){}
        setOfflineProgress(p => ({ ...p, done: p.done + 1 }));
      } catch (e) {
        try { localStorage.setItem(key, JSON.stringify([{ verse:0, text: 'Failed to fetch.' }])); } catch(e){}
        setOfflineProgress(p => ({ ...p, done: p.done + 1 }));
      }
    }
    setOfflineDownloading(false);
  };

  const clearBookCache = (bookIndex) => {
    const book = bibleBooks[bookIndex];
    for (let i=1;i<=book.chapters;i++) {
      const key = `bible-cache:${book.name}:${i}`;
      try { localStorage.removeItem(key); } catch(e){}
    }
  };

  const downloadAllBooksOffline = async () => {
    if (offlineDownloadingAll) return;
    setOfflineAllCancelled(false);
    setOfflineDownloadingAll(true);
    const total = bibleBooks.reduce((s,b)=>s + (b.chapters||0), 0);
    setOfflineAllProgress({ done:0, total });
    for (let bi = 0; bi < bibleBooks.length; bi++) {
      const book = bibleBooks[bi];
      for (let i = 1; i <= book.chapters; i++) {
        if (offlineAllCancelled) break;
        const key = `bible-cache:${book.name}:${i}`;
        if (localStorage.getItem(key)) { setOfflineAllProgress(p => ({ ...p, done: p.done + 1 })); continue; }
        try {
          const query = encodeURIComponent(`${book.name} ${i}`);
          const res = await fetch(`https://bible-api.com/${query}`);
          if (!res.ok) { try { localStorage.setItem(key, JSON.stringify([{ verse:0, text: 'Not available.' }])); } catch(e){}; setOfflineAllProgress(p => ({ ...p, done: p.done + 1 })); continue; }
          const data = await res.json();
          const verses = (data.verses || []).map(v => ({ verse: v.verse, text: v.text }));
          try { localStorage.setItem(key, JSON.stringify(verses)); } catch(e){}
          setOfflineAllProgress(p => ({ ...p, done: p.done + 1 }));
        } catch (e) {
          try { localStorage.setItem(key, JSON.stringify([{ verse:0, text: 'Failed to fetch.' }])); } catch(e){}
          setOfflineAllProgress(p => ({ ...p, done: p.done + 1 }));
        }
      }
      if (offlineAllCancelled) break;
    }
    setOfflineDownloadingAll(false);
    if (offlineAllCancelled) setOfflineAllCancelled(false);
  };

  const cancelDownloadAll = () => {
    if (!offlineDownloadingAll) return;
    setOfflineAllCancelled(true);
  };

  const openBible = (bookIndex = 0, chapter = 1) => {
    setSelectedBookIndex(bookIndex);
    setSelectedChapter(chapter);
    setShowBible(true);
    fetchChapter(bibleBooks[bookIndex].name, chapter);
  };

  const goToChapter = (bookIndex, chapter) => {
    setSelectedBookIndex(bookIndex);
    setSelectedChapter(chapter);
    fetchChapter(bibleBooks[bookIndex].name, chapter);
  };

  const biblePrev = () => {
    let bi = selectedBookIndex; let ch = selectedChapter;
    if (ch > 1) goToChapter(bi, ch - 1);
    else if (bi > 0) {
      const prevBook = bibleBooks[bi - 1];
      goToChapter(bi - 1, prevBook.chapters);
    }
  };

  const bibleNext = () => {
    let bi = selectedBookIndex; let ch = selectedChapter;
    const book = bibleBooks[bi];
    if (ch < book.chapters) goToChapter(bi, ch + 1);
    else if (bi < bibleBooks.length - 1) goToChapter(bi + 1, 1);
  };

  useEffect(() => {
    if (!showBible) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') biblePrev();
      if (e.key === 'ArrowRight') bibleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBible, selectedBookIndex, selectedChapter, bibleBooks]);

  const handleBibleSearch = async () => {
    if (!bibleSearch || bibleSearch.trim().length === 0) return;
    const t = bibleSearch.trim();
    // patterns: 'John 3:16' or 'John 3'
    const m = t.match(/^(.+)\s+(\d+)(?::(\d+))?$/);
    if (m) {
      const book = m[1].trim();
      const ch = parseInt(m[2],10);
      const v = m[3] ? parseInt(m[3],10) : null;
      // find book index
      const idx = bibleBooks.findIndex(b => b.name.toLowerCase() === book.toLowerCase() || b.name.toLowerCase().replace(/\s+1|\s+2|\s+3/g,'').startsWith(book.toLowerCase()));
      const bookIndex = idx >= 0 ? idx : selectedBookIndex;
      setSelectedBookIndex(bookIndex);
      setSelectedChapter(ch);
      await fetchChapter(bibleBooks[bookIndex].name, ch);
      if (v) {
        // highlight or scroll to verse (simple behavior: filter)
        setChapterVerses(prev => prev.filter(x => x.verse === v));
      }
    }
  };

  // ---------------- Journal ----------------
  const handleJournalChange = (e) => {
    const value = e.target.value;
    setJournal(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(`journal-day-${currentDay}`, value);
      const max = (customSchedule && customSchedule.entries) ? customSchedule.entries.length : days.length;
      let completed = 0;
      for (let i=1;i<=max;i++) if (localStorage.getItem(`journal-day-${i}`)) completed++;
      setCompletedDays(completed);
    }
  };

  const handleOtNoteChange = (e) => {
    const value = e.target.value;
    setOtNote(value);
    if (typeof window !== "undefined") localStorage.setItem(`otNote-day-${currentDay}`, value);
  };

  const handleNtNoteChange = (e) => {
    const value = e.target.value;
    setNtNote(value);
    if (typeof window !== "undefined") localStorage.setItem(`ntNote-day-${currentDay}`, value);
  };

  // ---------------- Notifications (service worker + local scheduling) ----------------
  const registerSW = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered', reg.scope);
        return reg;
      } catch (err) { console.warn('SW register failed', err); }
    }
  };

  const showNotification = async (title, options = {}) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      // If there's no active worker yet, wait for ready
      if (!reg || !reg.active) {
        try { reg = await navigator.serviceWorker.ready; } catch (e) { reg = null; }
      }
      if (reg && reg.showNotification) {
        try {
          await reg.showNotification(title, options);
          return;
        } catch (err) {
          console.warn('SW showNotification failed', err);
        }
      }
    } catch (e) { console.warn('showNotification failed', e); }
    try { new Notification(title, options); } catch (e) { console.warn('Notification display failed', e); }
  };

  const computeEaster = (Y) => {
    const a = Y % 19;
    const b = Math.floor(Y / 100);
    const c = Y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const L = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * L) / 451);
    const month = Math.floor((h + L - 7 * m + 114) / 31);
    const day = ((h + L - 7 * m + 114) % 31) + 1;
    return new Date(Y, month - 1, day);
  };

  const addDays = (d, days) => { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; };

  const scheduleAt = (dateObj, title, body, tag) => {
    const when = dateObj.getTime();
    const now = Date.now();
    const delay = when - now;
    if (delay <= 0) return; // past
    setTimeout(() => { showNotification(title, { body, tag }); }, delay);
  };

  const scheduleHolidaysForYear = (year) => {
    const easter = computeEaster(year);
    const holidays = [
      { key: 'Epiphany', date: new Date(year,0,6), title: 'Epiphany', body: 'January 6 — Commemorates the Wise Men and the Baptism of Jesus.' },
      { key: 'Candlemas', date: new Date(year,1,2), title: 'Candlemas', body: 'February 2 — Presentation of Jesus.' },
      { key: 'Annunciation', date: new Date(year,2,25), title: 'Annunciation', body: 'March 25 — Angel Gabriel to Mary.' },
      { key: 'PalmSunday', date: addDays(easter, -7), title: 'Palm Sunday', body: 'Sunday before Easter — beginning Holy Week.' },
      { key: 'GoodFriday', date: addDays(easter, -2), title: 'Good Friday', body: "Commemorates Jesus's crucifixion (Friday before Easter)." },
      { key: 'Easter', date: easter, title: 'Easter', body: "Celebrates Jesus's resurrection." },
      { key: 'Ascension', date: addDays(easter, 39), title: 'Ascension Day', body: '40 days after Easter.' },
      { key: 'Pentecost', date: addDays(easter, 49), title: 'Pentecost', body: "50 days after Easter — the arrival of the Holy Spirit." },
      { key: 'AllSaints', date: new Date(year,10,1), title: "All Saints' Day", body: 'November 1.' }
    ];
    holidays.forEach(h => {
      const d = new Date(h.date.getFullYear(), h.date.getMonth(), h.date.getDate(), 9, 0, 0, 0);
      if (d.getTime() > Date.now()) scheduleAt(d, h.title, h.body, `holiday-${h.key}-${year}`);
    });
  };

  let dailyTimer = null;
  const scheduleDailyReminder = () => {
    if (dailyTimer) { clearTimeout(dailyTimer); dailyTimer = null; }
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0, 0);
    const delay = tomorrow.getTime() - now.getTime();
    dailyTimer = setTimeout(function tick() {
      showNotification('Keep your streak going!', { body: "Read today's chapters and keep your streak.", tag: 'daily-streak' });
      dailyTimer = setTimeout(tick, 24 * 60 * 60 * 1000);
    }, delay);
  };

  const initNotifications = async () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    await registerSW();
    try {
      if (!localStorage.getItem('welcomeNotified')) {
        await showNotification('Welcome to the Bible in a Year App', { body: 'Personalize your bible schedule now', tag: 'welcome' });
        localStorage.setItem('welcomeNotified', '1');
      }
    } catch (e) { console.warn('welcome notify failed', e); }
    const y = (new Date()).getFullYear();
    scheduleHolidaysForYear(y);
    scheduleHolidaysForYear(y + 1);
    scheduleDailyReminder();
  };

  // Prompt for notification permission on first visit (best-effort)
  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default' && !localStorage.getItem('notificationPromptShown')) {
        Notification.requestPermission().then((perm) => {
          localStorage.setItem('notificationPromptShown', '1');
          if (perm === 'granted') initNotifications();
        }).catch(() => { localStorage.setItem('notificationPromptShown', '1'); });
      }
    } catch (e) { /* ignore */ }
  }, []);

  // ---------------- Other Handlers ----------------
  const handleContinueIntro = () => {
    if (typeof window !== "undefined") localStorage.setItem("introSeen","true");
    setShowIntro(false);
    const audio = document.getElementById("backgroundMusic");
    if (audio) {
      try { audio.load(); } catch (e) { /* ignore */ }
      audio.play().catch(err=>console.log("Autoplay prevented", err));
    }
  };

  const acceptConsent = async () => {
    const now = new Date().toISOString();
    setConsentTosAt(now);
    setConsentPrivacyAt(now);
    // save locally
    localStorage.setItem('consent', JSON.stringify({ tos: true, privacy: true, tosAt: now, privacyAt: now }));
    // save to Supabase profile if available
    if (isSupabaseConfigured && supabase && currentUser) {
      try {
        await supabase.from('profiles').upsert({ id: currentUser, tos_accepted_at: now, privacy_accepted_at: now });
      } catch (err) { console.warn('save consent failed', err); }
    }
    setTosChecked(true);
    setPrivacyChecked(true);
    setShowConsentModal(false);
    setShowPolicyViewer(false);
  };

  const toggleMusic = () => {
    const audio = document.getElementById("backgroundMusic");
    if (!audio) return;
    if (audio.paused) {
      try { audio.load(); } catch (e) { /* ignore */ }
      audio.play().catch(err=>console.log("Play prevented", err));
    } else audio.pause();
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== "undefined") localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    const audio = document.getElementById("backgroundMusic");
    if (audio) audio.volume = vol;
    if (typeof window !== "undefined") localStorage.setItem("musicVolume", vol);
  };

  const openStreakIntroWithSpin = () => {
    setBadgeSpinning(true);
    setTimeout(() => {
      setBadgeSpinning(false);
      setShowIntro(true);
      const audio = document.getElementById("backgroundMusic");
      if (audio) {
        try { audio.load(); } catch (e) { /* ignore */ }
        audio.play().catch(err=>console.log("Autoplay prevented", err));
      }
    }, 600);
  };

  // Profile / Auth helpers
  const openProfile = () => {
    if (currentUser) setShowProfileModal(true);
    else setShowAuthModal(true);
  };

  // Load follower/following counts for the profile modal when opened
  useEffect(() => {
    if (!showProfileModal || !currentUser) {
      setModalFollowerCount(0);
      setModalFollowingCount(0);
      return;
    }
    setModalCountsLoading(true);
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const { count: followers } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('followee_id', currentUser);
          const { count: following } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', currentUser);
          setModalFollowerCount(followers || 0);
          setModalFollowingCount(following || 0);
        } catch (err) { console.warn('load modal follow counts failed', err); }
        finally { setModalCountsLoading(false); }
      })();
    } else {
      const follows = JSON.parse(localStorage.getItem('follows') || '{}');
      let fcount = 0, gcount = 0;
      Object.keys(follows).forEach(f => { (follows[f] || []).forEach(t => { if (t === currentUser) fcount += 1; }); if (f === currentUser) gcount = (follows[f] || []).length; });
      setModalFollowerCount(fcount);
      setModalFollowingCount(gcount);
      setModalCountsLoading(false);
    }
  }, [showProfileModal, currentUser]);

  // Prevent background scrolling when the policy viewer is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prev = document.body.style.overflow;
    if (showPolicyViewer) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = prev || '';
    return () => { document.body.style.overflow = prev || ''; };
  }, [showPolicyViewer]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail || !authPassword) { setAuthError("Email and password required"); return; }
    if (isSupabaseConfigured && supabase) {
      (async () => {
        if (authMode === 'signup') {
          const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
          if (error) { setAuthError(error.message); return; }
          const user = data.user;
          if (user) {
            // upload avatar if user selected a data URL
            let avatarUrl = profileAvatar || DEFAULT_AVATAR;
            if (avatarUrl && avatarUrl.startsWith('data:')) {
              try {
                const res = await fetch(avatarUrl);
                const blob = await res.blob();
                const fileExt = blob.type === 'image/png' ? 'png' : 'jpg';
                const fileName = `avatars/${user.id}.${fileExt}`;
                await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true });
                const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = publicData.publicUrl;
              } catch (err) { console.warn('avatar upload failed', err); }
            }
            await supabase.from('profiles').upsert({ id: user.id, email: user.email, avatar_url: avatarUrl });
            setCurrentUser(user.id);
            setProfileDesc(""); setFavVerse(""); setProfileAvatar(avatarUrl || DEFAULT_AVATAR);
            setShowAuthModal(false);
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
          if (error) { setAuthError(error.message); return; }
          const user = data.user;
          if (user) {
            setCurrentUser(user.id);
            // fetch profile
            const { data:profiles } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            const p = profiles || {};
            setProfileDesc(p.description || ""); setFavVerse(p.fav_verse || ""); setProfileAvatar(p.avatar_url || DEFAULT_AVATAR);
            setLongestStreak(p.longest_streak || 0);
            setShowAuthModal(false);
          }
        }
        setAuthPassword("");
      })();
      return;
    }

    // Fallback localStorage (legacy)
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (authMode === 'signup') {
      if (users[authEmail]) { setAuthError("Account already exists"); return; }
      users[authEmail] = { password: authPassword, description: "", favVerse: "", avatar: profileAvatar || DEFAULT_AVATAR };
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", authEmail);
      setCurrentUser(authEmail);
      setProfileDesc(""); setFavVerse(""); setProfileAvatar(profileAvatar || DEFAULT_AVATAR);
      setShowAuthModal(false);
    } else {
      const u = users[authEmail];
      if (!u || u.password !== authPassword) { setAuthError("Invalid credentials"); return; }
      localStorage.setItem("currentUser", authEmail);
      setCurrentUser(authEmail);
      setProfileDesc(u.description || ""); setFavVerse(u.favVerse || ""); setProfileAvatar(u.avatar || DEFAULT_AVATAR);
      setShowAuthModal(false);
    }
    setAuthPassword("");
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setShowProfileModal(false);
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    if (!confirm('Delete account and all associated data? This cannot be undone.')) return;
    // Supabase path: delete follows, profile, avatar, then sign out
    if (isSupabaseConfigured && supabase) {
      try {
        // delete follows where follower or followee
        await supabase.from('follows').delete().or(`follower_id.eq.${currentUser},followee_id.eq.${currentUser}`);
      } catch (err) { console.warn('delete follows failed', err); }
      try {
        // get profile to find avatar path
        const { data: p } = await supabase.from('profiles').select('avatar_url').eq('id', currentUser).maybeSingle();
        const avatarUrl = p?.avatar_url || '';
        // attempt to remove common filenames
        const tryRemove = async (path) => {
          try { await supabase.storage.from('avatars').remove([path]); } catch (e) { /* ignore */ }
        };
        // If avatarUrl includes the currentUser filename, derive path
        if (avatarUrl && avatarUrl.includes(currentUser)) {
          // try png/jpg
          await tryRemove(`avatars/${currentUser}.png`);
          await tryRemove(`avatars/${currentUser}.jpg`);
          // try exact tail if present
          const parts = avatarUrl.split('/');
          const tail = parts.slice(-2).join('/');
          if (tail) await tryRemove(tail);
        }
      } catch (err) { console.warn('remove avatar failed', err); }
      try {
        await supabase.from('profiles').delete().eq('id', currentUser);
      } catch (err) { console.warn('delete profile failed', err); }
      try { await supabase.auth.signOut(); } catch (err) { /* ignore */ }
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setShowProfileModal(false);
      alert('Account deleted locally. Note: deleting the Auth user account requires server-side (admin) operation if you want the authentication record removed.');
      return;
    }

    // localStorage fallback: remove user and follows
    try {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      delete users[currentUser];
      localStorage.setItem('users', JSON.stringify(users));
      const follows = JSON.parse(localStorage.getItem('follows') || '{}');
      // remove entries where follower is currentUser
      delete follows[currentUser];
      // remove followee references
      Object.keys(follows).forEach(k => { follows[k] = (follows[k] || []).filter(x => x !== currentUser); });
      localStorage.setItem('follows', JSON.stringify(follows));
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setShowProfileModal(false);
      alert('Local account deleted');
    } catch (err) { console.error('local delete failed', err); }
  };

  const saveProfile = () => {
    if (!currentUser) return;
    if (isSupabaseConfigured && supabase) {
      (async () => {
        // if avatar is data URL, upload to storage
        let avatarUrl = profileAvatar;
        if (profileAvatar && profileAvatar.startsWith('data:')) {
          try {
            // convert dataURL to blob
            const res = await fetch(profileAvatar);
            const blob = await res.blob();
            const fileExt = blob.type === 'image/png' ? 'png' : 'jpg';
            const fileName = `avatars/${currentUser}.${fileExt}`;
            await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true });
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            avatarUrl = data.publicUrl;
          } catch (err) { console.error('upload failed', err); }
        }
        await supabase.from('profiles').upsert({ id: currentUser, email: '', description: profileDesc, fav_verse: favVerse, avatar_url: avatarUrl, longest_streak: longestStreak, streak: streak, completed_days: completedDays, tos_accepted_at: consentTosAt, privacy_accepted_at: consentPrivacyAt });
        setProfileAvatar(avatarUrl);
        setShowProfileModal(false);
      })();
      return;
    }

    // Fallback localStorage
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    users[currentUser] = users[currentUser] || { password: "" };
    users[currentUser].description = profileDesc;
    users[currentUser].favVerse = favVerse;
    users[currentUser].avatar = profileAvatar;
    localStorage.setItem("users", JSON.stringify(users));
    setShowProfileModal(false);
  };

  const handleAvatarChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      setProfileAvatar(url);
    };
    reader.readAsDataURL(file);
  };

  const clearCache = () => { 
    if (typeof window !== "undefined") localStorage.clear(); 
    alert("Local cache cleared!"); 
  };

  const totalScheduleDays = (customSchedule && customSchedule.entries) ? customSchedule.entries.length : 365;
  const progressPercent = Math.round((completedDays/totalScheduleDays)*100);

  // Achievement helpers
  const ACH_TITLES = ['Bronze','Brass','Silver','Gold','Platinum'];
  const ACH_COLORS = ['#cd7f32','#b08d57','#c0c0c0','#ffd700','#e5e4e2'];

  const loadAchievements = () => {
    if (!currentUser) return [];
    try {
      const key = `achievements-${currentUser}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    // default locked achievements
    return ACH_TITLES.map((t,i)=>({ title: t, index: i, earned: false, earnedAt: null }));
  };

  const saveAchievements = (list) => {
    if (!currentUser) return;
    try { localStorage.setItem(`achievements-${currentUser}`, JSON.stringify(list)); } catch (e) { /* ignore */ }
  };

  // initialize achievements when profile loads or user changes
  useEffect(() => {
    if (!currentUser) return;
    const list = loadAchievements();
    setAchievements(list);
  }, [currentUser]);

  // Check for new achievement unlocks whenever progress changes
  useEffect(() => {
    if (!currentUser) return;
    const total = totalScheduleDays || 365;
    if (!total) return;
    const list = achievements && achievements.length ? achievements.slice() : loadAchievements();
    for (let i = 0; i < list.length; i++) {
      const threshold = Math.ceil(((i+1)/5) * total);
      if (!list[i].earned && completedDays >= threshold) {
        list[i].earned = true;
        list[i].earnedAt = new Date().toISOString();
        // persist and notify
        saveAchievements(list);
        setAchievements(list);
        // show popup
        setActiveAchievementIndex(i);
        setShowAchievementModal(true);
        try { showNotification(`Congratulations — ${list[i].title} unlocked!`, { body: `You've made it ${(i+1)}/5 through the bible plan.` }); } catch (e) { /* ignore */ }
        break; // show one at a time
      }
    }
  }, [completedDays, totalScheduleDays]);

  if (showIntro) return (
    <div className="streak-modal-backdrop">
      <div className="streak-modal">
        <StreakIntro streak={streak} longest={longestStreak} onContinue={handleContinueIntro} />
      </div>
    </div>
  );

  return (
    <div className="app-root" data-scheme={colorScheme}>
      <div className="app-card">
        <div style={{ 
          minHeight:"100vh", 
          backgroundColor: darkMode ? "#2B2B2B":"#FBF7F2", 
          color: darkMode ? "#EDEDED" : "#000000",
          fontFamily:"Georgia, serif", 
          padding:24, 
          transition:"all 0.5s ease" 
        }}>
      
      {/* Audio */}
      <audio id="backgroundMusic" loop preload="auto" crossOrigin="anonymous" playsInline>
        <source src="/music/peaceful.mp3" type="audio/mpeg" />
      </audio>

      {/* Header */}
      <header className="app-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, gap:12 }}>
        <div className="header-left" style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={()=>changeDay(1)}>🏠 Home</button>
          <button onClick={()=>setShowSettings(true)}>⚙️ Settings</button>
          <button onClick={()=>setShowScheduleModal(true)}>📅 Schedule</button>
          <div style={{ marginLeft:8 }}>
            <input
              placeholder="Search people..."
              value={searchQuery}
              onChange={e=>searchProfiles(e.target.value)}
              style={{ padding:8, borderRadius:8, width:220, border: darkMode? '1px solid #555':'1px solid #ccc' }}
            />
          </div>
        </div>
        <h1 style={{ color: darkMode?"#EDEDED":"var(--accent)", fontSize:36 }}>Bible Plan — {totalScheduleDays} days</h1>
        <div className="header-right" style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={()=>setShowResources(true)}>📚 Resources</button>
          <button onClick={() => { window.location.href = 'mailto:plaworkshop7@gmail.com'; }}>✉️ Contact</button>
          <button onClick={()=>setShowBible(true)}>📖 Bible</button>
          
          <div style={{ width:40, height:40, borderRadius:20, overflow:"hidden", cursor:"pointer", boxShadow:"0 6px 18px rgba(0,0,0,0.08)" }} onClick={openProfile}>
            <img src={profileAvatar} alt="profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        </div>
      </header>

      {/* Search results */}
      {searchResults && searchResults.length > 0 && (
        <div style={{ maxWidth:800, margin:'0 auto 16px', background: darkMode? '#2F2F2F':'#FFF', border: '1px solid #EEE', borderRadius:8, padding:8 }}>
          {searchError && <div style={{ color:'crimson' }}>{searchError}</div>}
          {isSearching && <div style={{ fontSize:12, color:'#666' }}>Searching...</div>}
          {searchResults.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 6px', borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden' }}>
                <img src={p.avatar_url || DEFAULT_AVATAR} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{p.username || p.id}</div>
                <div style={{ fontSize:12, color:'#666' }}>{p.description || ''}</div>
              </div>
              <div>
                {followingMap[p.id] ? (
                  <button onClick={()=>unfollowUser(p.id)} style={{ background:'#EEE', color:'#000' }}>Following</button>
                ) : (
                  <button onClick={()=>followUser(p.id)} style={{ background:'#6B3E26', color:'#FBF7F2' }}>Follow</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Streak badge */}
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div
          role="button"
          tabIndex={0}
          onClick={openStreakIntroWithSpin}
          onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" ") { e.preventDefault(); openStreakIntroWithSpin(); } }}
          style={{
            display:"inline-flex",
            alignItems:"center",
            gap:12,
            background: darkMode?"#3A3A3A":"#FFF8ED",
            border: "1px solid "+(darkMode?"#555":"#E2D5C8"),
            padding:"8px 14px",
            borderRadius:24,
            cursor:"pointer",
            transform: badgeSpinning ? "rotate(360deg) scale(1.05)" : "none",
            transition: "transform 0.6s ease"
          }}
        >
          <span style={{ fontSize:22 }}>🔥</span>
          <div style={{ textAlign:"left", lineHeight:1 }}>
            <div style={{ fontSize:12, color: darkMode?"#EDEDED":"#6B3E26" }}>Current Streak</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{streak} {streak === 1 ? "day" : "days"}</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScheduleModal && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1200 }}>
          <div style={{ background: darkMode?"#3A3A3A":"#FFF", color: darkMode?"#EDEDED":"#000", padding:24, borderRadius:12, width:"92%", maxWidth:520, transform:"translateY(-20px)", animation:"slideIn 0.25s forwards" }}>
            <h2>Reading Schedule</h2>
            <div style={{ marginBottom:8 }}>Chapters per day</div>
            <select value={chaptersPerDay} onChange={e=>setChaptersPerDay(parseInt(e.target.value,10))} style={{ width:'100%', padding:8, marginBottom:12 }}>
              {Array.from({length:12}).map((_,i)=>(<option key={i+1} value={i+1}>{i+1}</option>))}
            </select>
            <div style={{ marginBottom:8 }}>Finish in</div>
            <select value={finishYears} onChange={e=>setFinishYears(parseFloat(e.target.value))} style={{ width:'100%', padding:8, marginBottom:12 }}>
              {[1,1.5,2,2.5,3,3.5,4,4.5,5].map(v=>(<option key={v} value={v}>{v} {v===1? 'year':'years'}</option>))}
            </select>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={async ()=>{ await buildCustomSchedule({ chaptersPerDay, finishYears }); setShowScheduleModal(false); }}>Save Schedule</button>
              <button onClick={()=>{ localStorage.removeItem('customSchedule'); setCustomSchedule(null); setScheduleMessage('Reset to default schedule'); setShowScheduleModal(false); setCurrentDay(1); }}>Reset</button>
            </div>
            {scheduleMessage && <div style={{ marginTop:12, fontSize:12, color:'#666' }}>{scheduleMessage}</div>}
          </div>
        </div>
      )}
      {showSettings && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:999 }}>
          <div style={{ background: darkMode?"#3A3A3A":"#FFF", color: darkMode?"#EDEDED":"#000", padding:24, borderRadius:12, width:"90%", maxWidth:420, transform:"translateY(-50px)", opacity:0, animation:"slideIn 0.3s forwards" }}>
            <h2>Settings</h2>
            <div style={{ marginBottom:10 }}><label><input type="checkbox" checked={darkMode} onChange={toggleDarkMode}/> Dark Mode</label></div>
            <div style={{ marginBottom:10 }}><label>Music Volume: <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={handleVolumeChange} /></label></div>
            <div style={{ marginBottom:10 }}>
              <div style={{ marginBottom:6 }}>Reading Pace</div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, marginBottom:6 }}>Chapters per day</label>
                  <select value={chaptersPerDay} onChange={e=>setChaptersPerDay(parseInt(e.target.value,10))} style={{ width:'100%', padding:8 }}>
                    {Array.from({length:12}).map((_,i)=>(<option key={i+1} value={i+1}>{i+1}</option>))}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, marginBottom:6 }}>Finish in</label>
                  <select value={finishYears} onChange={e=>setFinishYears(parseFloat(e.target.value))} style={{ width:'100%', padding:8 }}>
                    {[1,1.5,2,2.5,3,3.5,4,4.5,5].map(v=>(<option key={v} value={v}>{v} {v===1? 'year':'years'}</option>))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop:8, display:'flex', justifyContent:'flex-end', gap:8 }}>
                <button onClick={async ()=>{ await buildCustomSchedule({ chaptersPerDay, finishYears }); setShowSettings(false); }}>Save Schedule</button>
              </div>
              {scheduleMessage && <div style={{ marginTop:8, fontSize:12, color:'#666' }}>{scheduleMessage}</div>}
            </div>
            <div style={{ marginBottom:10 }}>
              <button onClick={() => { setPolicyToView('privacy'); setShowPolicyViewer(true); }} style={{ marginRight:8 }}>View Privacy Policy</button>
              <button onClick={() => { setPolicyToView('tos'); setShowPolicyViewer(true); }}>View Terms of Service</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <button onClick={() => setShowConsentModal(true)}>Review / Re-accept Policies</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ marginBottom:6 }}>Color Scheme</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setScheme('warm')} style={{ flex:1, background: colorScheme==='warm'? 'var(--accent)':'#EEE', color: colorScheme==='warm'? '#FBF7F2':'#000' }}>Warm</button>
                <button onClick={()=>setScheme('cool')} style={{ flex:1, background: colorScheme==='cool'? 'var(--accent)':'#EEE', color: colorScheme==='cool'? '#FBF7F2':'#000' }}>Cool</button>
              </div>
            </div>
                  <div style={{ marginBottom:10 }}><button onClick={clearCache}>Clear Local Cache</button></div>
                  <div style={{ marginBottom:10 }}>
                    <h4 style={{ margin: '8px 0' }}>Restore Progress</h4>
                    {!showRestoreInput ? (
                      <div>
                        <div style={{ fontSize:12, color:'#666', marginBottom:8 }}>If you lost progress, restore to a specific day.</div>
                        <button onClick={()=>{ setShowRestoreInput(true); setRestoreDay(''); }}>Restore progress</button>
                      </div>
                    ) : (
                      <div>
                        <input type="number" min={1} max={totalScheduleDays} placeholder={`Day (1-${totalScheduleDays})`} value={restoreDay} onChange={e=>setRestoreDay(e.target.value)} style={{ width:120, marginRight:8 }} />
                        <button onClick={()=>{ const n=parseInt(restoreDay,10); const max=(customSchedule&&customSchedule.entries)?customSchedule.entries.length:totalScheduleDays; if (isNaN(n) || n<1 || n>max) { alert('Please enter a valid day between 1 and '+max); return; } setShowRestoreConfirm(true); }}>Apply</button>
                        <button onClick={()=>{ setShowRestoreInput(false); setRestoreDay(''); }} style={{ marginLeft:8 }}>Cancel</button>
                      </div>
                    )}
                    {showRestoreConfirm && (
                      <div style={{ marginTop:8, padding:8, border:'1px solid #ccc', borderRadius:8, background: darkMode? '#2b2b2b':'#fff' }}>
                        <div>Are you sure you want to change your progress to day <strong>{restoreDay}</strong>?</div>
                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                          <button onClick={() => {
                            const n = parseInt(restoreDay,10);
                            if (isNaN(n)) return;
                            // persist a restored marker so completedDays count includes restored days
                            try { localStorage.setItem('restoredProgress', JSON.stringify({ to: n, at: new Date().toISOString() })); } catch(e){}
                            // bookmark and navigate
                            try { localStorage.setItem('bookmarkedDay', n); } catch(e){}
                            setCurrentDay(n);
                            setCompletedDays(n);
                            setShowRestoreConfirm(false);
                            setShowRestoreInput(false);
                            setRestoreDay('');
                            setShowSettings(false);
                          }}>Yes</button>
                          <button onClick={() => setShowRestoreConfirm(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
            <div style={{ textAlign:"right", marginTop:10 }}><button onClick={()=>setShowSettings(false)}>Close</button></div>
          </div>
        </div>
      )}
      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
          <div style={{ background: darkMode?"#2B2B2B":"#FFF", color: darkMode?"#EDEDED":"#000", padding:20, borderRadius:12, width:320 }}>
            <h3>{authMode==='signup' ? 'Sign up' : 'Log in'}</h3>
            {authError && <div style={{ color:'crimson', marginBottom:8 }}>{authError}</div>}
            <form onSubmit={handleAuthSubmit}>
              <input type="email" placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} style={{ width:'100%', marginBottom:8 }} />
              <input type="password" placeholder="Password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} style={{ width:'100%', marginBottom:8 }} />
              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block', fontSize:12, marginBottom:6 }}>Choose avatar (optional)</label>
                <input type="file" accept="image/png,image/jpeg" onChange={(e)=>handleAvatarChange(e.target.files && e.target.files[0])} />
                <div style={{ marginTop:8 }}>
                  <div style={{ width:64, height:64, borderRadius:10, overflow:'hidden', border:'1px solid #ccc' }}>
                    <img src={profileAvatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="submit">{authMode==='signup' ? 'Create account' : 'Log in'}</button>
                <button type="button" onClick={()=>setAuthMode(authMode==='signup'?'login':'signup')} style={{ background:'#EEE', color:'#000' }}>{authMode==='signup' ? 'Have an account?' : 'Create account'}</button>
              </div>
            </form>
            <div style={{ textAlign:'right', marginTop:10 }}><button onClick={()=>setShowAuthModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 }}>
          <div style={{ background: darkMode?"#2B2B2B":"#FFF", color: darkMode?"#EDEDED":"#000", padding:20, borderRadius:12, width:360 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ width:80,height:80,borderRadius:12,overflow:'hidden' }}>
                <img src={profileAvatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{currentUser}</div>
                <div style={{ fontSize:12, color:'#6B3E26' }}>Streak: {streak} • Longest: {longestStreak}</div>
                <div style={{ fontSize:12, color:'#6B3E26', marginTop:6 }}>
                  {modalCountsLoading ? (
                    <span className="spinner" aria-hidden style={{ display:'inline-block', marginRight:8 }}>🔄</span>
                  ) : (
                    <>{modalFollowerCount} follower{modalFollowerCount===1?"":"s"} • {modalFollowingCount} following</>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <label style={{ display:'block', marginBottom:6 }}>Profile picture</label>
              <input type="file" accept="image/png,image/jpeg" onChange={(e)=>handleAvatarChange(e.target.files && e.target.files[0])} />
            </div>
            <div style={{ marginTop:12 }}>
              <label style={{ display:'block', marginBottom:6 }}>About</label>
              <textarea value={profileDesc} onChange={e=>setProfileDesc(e.target.value)} style={{ width:'100%', minHeight:80 }} />
            </div>
            <div style={{ marginTop:12 }}>
              <label style={{ display:'block', marginBottom:6 }}>Favorite verse</label>
              <input value={favVerse} onChange={e=>setFavVerse(e.target.value)} style={{ width:'100%' }} />
            </div>
            <div style={{ marginTop:12 }}>
              <div className="progress-wrap" style={{ width:'100%', marginBottom:8 }}><div className="progress-bar" style={{ width:`${progressPercent}%` }} /></div>
              <div style={{ fontSize:12, color:'#6B3E26' }}>{completedDays}/{totalScheduleDays} days ({progressPercent}%)</div>
            </div>
            <div style={{ marginTop:12 }}>
              <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center' }}>
                {achievements && achievements.length ? achievements.map((a,i) => {
                  const earned = a.earned;
                  const bg = earned ? ACH_COLORS[i] : '#111';
                  return (
                    <div key={i} onClick={() => { setActiveAchievementIndex(i); setShowAchievementModal(true); }} style={{ cursor:'pointer', textAlign:'center', flex:1 }} title={a.title}>
                      <div style={{ width:48, height:48, borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', background: bg, margin:'0 auto' }}>
                        <span style={{ fontSize:22, lineHeight:1, opacity: earned ? 1 : 0.35 }}>🏆</span>
                      </div>
                      <div style={{ fontSize:11, marginTop:4 }}>{a.title}</div>
                    </div>
                  );
                }) : ACH_TITLES.map((t,i) => (
                  <div key={i} onClick={() => { setActiveAchievementIndex(i); setShowAchievementModal(true); }} style={{ cursor:'pointer', textAlign:'center', flex:1 }}>
                    <div style={{ width:48, height:48, borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', background:'#111', margin:'0 auto' }}>
                      <span style={{ fontSize:22, lineHeight:1, opacity:0.35 }}>🏆</span>
                    </div>
                    <div style={{ fontSize:11, marginTop:4 }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <button onClick={deleteAccount} style={{ background:'#ff4d4f', color:'#fff', borderRadius:6, padding:'6px 10px', border:'none', cursor:'pointer' }}>Delete account</button>
              </div>
              <div>
                <button onClick={saveProfile}>Save</button>
                <button onClick={logout} style={{ background:'#EEE', color:'#000', marginLeft:8 }}>Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bible viewer modal */}
      {showBible && (
        <div style={{ position:'fixed', top:0,left:0,width:'100%',height:'100%', backgroundColor:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2500 }}>
          <div style={{ background: darkMode? '#1f1f1f':'#fff', color: darkMode? '#EDEDED':'#000', width:'94%', maxWidth:1100, height:'90%', borderRadius:12, display:'flex', overflow:'hidden' }}>
            <div style={{ width:220, borderRight:'1px solid rgba(0,0,0,0.06)', overflowY:'auto', padding:12 }}>
              <h3 style={{ marginTop:0 }}>Contents</h3>
              <div style={{ fontSize:13, color:'#666', marginBottom:8 }}>Books</div>
              <div>
                {bibleBooks.map((b, i) => (
                  <div key={b.name} onClick={() => { setSelectedBookIndex(i); setSelectedChapter(1); }} style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer', background: i===selectedBookIndex ? (darkMode? '#2a2a2a':'#f0f0f0') : 'transparent', marginBottom:4 }}>{b.name}</div>
                ))}
              </div>
            </div>
            <div style={{ width:160, borderRight:'1px solid rgba(0,0,0,0.06)', padding:12, overflowY:'auto' }}>
              <h4 style={{ marginTop:0 }}>{bibleBooks[selectedBookIndex].name}</h4>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {Array.from({length: bibleBooks[selectedBookIndex].chapters}).map((_, idx) => (
                  <button key={idx+1} onClick={() => goToChapter(selectedBookIndex, idx+1)} style={{ width:44, padding:6, borderRadius:6, border:'1px solid #ddd', background: idx+1===selectedChapter ? '#6B3E26' : 'transparent', color: idx+1===selectedChapter ? '#fff' : '#000', cursor:'pointer' }}>{idx+1}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:1, padding:16, display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input placeholder="Search (e.g. John 3:16)" value={bibleSearch} onChange={e=>setBibleSearch(e.target.value)} style={{ flex:1, padding:8, borderRadius:8, border:'1px solid #ccc' }} />
                <button onClick={handleBibleSearch}>Go</button>
                <button onClick={() => { setBibleSearch(''); setChapterVerses([]); }}>Clear</button>
                <div style={{ marginLeft:12 }}>
                  <button onClick={biblePrev} style={{ marginRight:8 }}>◀ Prev</button>
                  <button onClick={bibleNext}>Next ▶</button>
                </div>
                <div style={{ marginLeft:12, display:'flex', alignItems:'center', gap:8 }}>
                  {offlineDownloading || offlineDownloadingAll ? (
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {offlineDownloading ? <div style={{ fontSize:13 }}>Downloading book {offlineProgress.done}/{offlineProgress.total}</div> : null}
                      {offlineDownloadingAll ? <div style={{ fontSize:13 }}>Downloading all {offlineAllProgress.done}/{offlineAllProgress.total}</div> : null}
                      {offlineDownloadingAll ? <button onClick={cancelDownloadAll} style={{ padding:8 }}>Cancel</button> : null}
                    </div>
                  ) : (
                    <>
                      <button onClick={() => downloadBookOffline(selectedBookIndex)} style={{ padding:8 }}>Download Book Offline</button>
                      <button onClick={() => { if (confirm('Remove offline cache for this book?')) { clearBookCache(selectedBookIndex); alert('Offline cache cleared'); } }} style={{ padding:8 }}>Clear Offline</button>
                      <button onClick={() => { if (confirm('Download ALL books for offline use? This may use lots of storage and data. Continue?')) { downloadAllBooksOffline(); } }} style={{ padding:8, marginLeft:6 }}>Download All Books</button>
                    </>
                  )}
                  <div style={{ fontSize:12, color:'#666' }}>{isBookCached(selectedBookIndex) ? 'Offline ready' : ''}</div>
                </div>
                <div style={{ marginLeft:'auto' }}><button onClick={()=>setShowBible(false)}>Close</button></div>
              </div>
              <div style={{ marginTop:12, overflowY:'auto', paddingRight:8 }}>
                <h3 style={{ marginTop:0 }}>{bibleBooks[selectedBookIndex].name} {selectedChapter}</h3>
                {bibleLoading ? <div>Loading...</div> : (
                  <div>
                    {chapterVerses && chapterVerses.length ? chapterVerses.map(v => (
                      <div key={v.verse} style={{ marginBottom:8 }}><strong>{v.verse !== 0 ? v.verse : ''}</strong> <span style={{ whiteSpace:'pre-wrap' }}>{v.text}</span></div>
                    )) : <div style={{ color:'#666' }}>No content loaded — search or pick a chapter.</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showResources && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:999 }}>
          <div style={{ background: darkMode?"#3A3A3A":"#FFF", color: darkMode?"#EDEDED":"#000", padding:24, borderRadius:12, width:"90%", maxWidth:400, transform:"translateY(-50px)", opacity:0, animation:"slideIn 0.3s forwards" }}>
            <h2>Resources</h2>
            <ul>
              <li><a href="https://www.bible.com" target="_blank" style={{ color: darkMode?"#EDEDED":"#000" }}>Bible.com</a></li>
              <li><a href="https://www.youtube.com/@bibleproject" target="_blank" style={{ color: darkMode?"#EDEDED":"#000" }}>Bible Project YouTube</a></li>
            </ul>
            <div style={{ textAlign:"right", marginTop:10 }}><button onClick={()=>setShowResources(false)}>Close</button></div>
          </div>
        </div>
      )}
      {/* Policy viewer modal */}
      {showPolicyViewer && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.6)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:4000 }}>
          <div style={{ background: darkMode?"#2B2B2B":"#FFF", color: darkMode?"#EDEDED":"#000", padding:20, borderRadius:12, width:"90%", maxWidth:720, maxHeight:"80%", overflowY:"auto" }}>
            <h2>{policyToView === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
            <pre style={{ whiteSpace:'pre-wrap', fontFamily:'inherit', lineHeight:1.4, maxHeight:'60vh', overflowY:'auto', paddingRight:8 }}>{policyToView === 'privacy' ? PRIVACY_POLICY_TEXT : TOS_TEXT}</pre>
            <div style={{ marginTop:12 }}>
              <label style={{ display:'block', marginBottom:8 }}><input type="checkbox" className="consent-checkbox" checked={tosChecked} onChange={e=>setTosChecked(e.target.checked)} /> I have read and agree to the Terms of Service</label>
              <label style={{ display:'block', marginBottom:8 }}><input type="checkbox" className="consent-checkbox" checked={privacyChecked} onChange={e=>setPrivacyChecked(e.target.checked)} /> I have read and agree to the Privacy Policy</label>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12 }}>
              <div><button onClick={()=>setShowPolicyViewer(false)}>Close</button></div>
              <div><button disabled={!(tosChecked && privacyChecked)} onClick={acceptConsent} style={{ background: tosChecked && privacyChecked ? '#6B3E26' : '#DDD', color: tosChecked && privacyChecked ? '#FFF' : '#666' }}>Accept and Continue</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Consent modal (shown on first open until accepted) */}
      {showConsentModal && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.75)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:3000 }}>
          <div style={{ background: darkMode?"#2B2B2B":"#FFF", color: darkMode?"#EDEDED":"#000", padding:20, borderRadius:12, width:"92%", maxWidth:520 }}>
            <h2>Welcome — Please accept our policies</h2>
            <p style={{ lineHeight:1.4 }}>Before using this app you must accept our Terms of Service and Privacy Policy. You can read them below.</p>
            <div style={{ marginTop:8 }}>
              <label style={{ display:'block', marginBottom:6 }}>
                <input type="checkbox" className="consent-checkbox" checked={agreedAll} onChange={e=>{ const v = e.target.checked; setAgreedAll(v); setTosChecked(v); setPrivacyChecked(v); }} />
                {' '}
                I have read and agree to the Terms of Service and Privacy Policy
                {' '}
                (<button onClick={()=>{ setPolicyToView('tos'); setShowPolicyViewer(true); }}>view</button>{' / '}
                <button onClick={()=>{ setPolicyToView('privacy'); setShowPolicyViewer(true); }}>view</button>)
              </label>
            </div>
            <div style={{ marginTop:12, textAlign:'right' }}>
              <button disabled={!agreedAll} onClick={acceptConsent} style={{ background: agreedAll ? '#6B3E26' : '#DDD', color: agreedAll ? '#FFF' : '#666' }}>Accept and Continue</button>
            </div>
          </div>
        </div>
      )}
      {/* Achievement modal */}
      {showAchievementModal && activeAchievementIndex !== null && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", backgroundColor:"rgba(0,0,0,0.6)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:4000 }}>
          <div style={{ background: darkMode?"#2B2B2B":"#FFF", color: darkMode?"#EDEDED":"#000", padding:20, borderRadius:12, width:"90%", maxWidth:420 }}>
            {(() => {
              const idx = activeAchievementIndex;
              const title = (ACH_TITLES && ACH_TITLES[idx]) || (achievements && achievements[idx] && achievements[idx].title) || 'Achievement';
              const threshold = Math.ceil(((idx + 1) / 5) * totalScheduleDays);
              const pct = Math.round((threshold / totalScheduleDays) * 100);
              const item = achievements && achievements[idx];
              const earned = item && item.earned;
              const earnedAt = item && item.earnedAt;
              return (
                <div>
                  <h2 style={{ marginTop:0 }}>{title} Trophy</h2>
                  {earned ? (
                    <div>
                      <p style={{ lineHeight:1.4 }}>Congratulations — you've earned the <strong>{title}</strong> trophy by reaching day {threshold} ({pct}% of the plan).</p>
                      {earnedAt && <div style={{ fontSize:12, color:'#666' }}>Earned on: {new Date(earnedAt).toLocaleDateString()}</div>}
                    </div>
                  ) : (
                    <div>
                      <p style={{ lineHeight:1.4 }}>This trophy unlocks when you complete <strong>day {threshold}</strong> (~{pct}% of the plan). Keep going — you're getting closer!</p>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
                    <button onClick={() => setShowAchievementModal(false)}>Close</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      <style>{`@keyframes slideIn { from {opacity:0; transform:translateY(-50px);} to {opacity:1; transform:translateY(0);} }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner { display:inline-block; animation: spin 1s linear infinite; }
    .consent-checkbox { width:18px; height:18px; vertical-align:middle; margin-right:8px; accent-color:#fff; background:#fff; border:2px solid #000; border-radius:4px; transition: box-shadow .18s ease, background .18s ease, transform .12s ease; }
    .consent-checkbox:checked { background:#000; box-shadow: 0 0 10px rgba(255,215,0,0.95); transform: scale(1.02); }
    `}</style>

      {/* Navigation */}
      <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input 
          type="number" 
          placeholder="Go to day" 
          value={jumpDay} 
          onChange={e=>setJumpDay(e.target.value)} 
          style={{ 
            width:110,
            padding:6, 
            background: darkMode?"#3A3A3A":"#FFF", 
            color: darkMode?"#EDEDED":"#000", 
            border: darkMode?"1px solid #555":"1px solid #ccc",
            borderRadius:6,
            transition:"all 0.3s ease",
            outline:"none"
          }}
          onFocus={e=>e.currentTarget.style.borderColor = darkMode?"#A67C52":"#6B3E26"}
          onBlur={e=>e.currentTarget.style.borderColor = darkMode?"#555":"#ccc"}
        />
        <button 
          onClick={jumpToDay} 
          style={{
            padding:"6px 12px",
            borderRadius:6,
            border:"none",
            backgroundColor:"#6B3E26",
            color:"#FBF7F2",
            cursor:"pointer",
            transition:"transform 0.2s ease"
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >
          Go
        </button>

        <input 
          type="date" 
          value={selectedDate} 
          onChange={e=>handleDateChange(e.target.value)} 
          style={{ 
            padding:6, 
            background: darkMode?"#3A3A3A":"#FFF", 
            color: darkMode?"#EDEDED":"#000", 
            border: darkMode?"1px solid #555":"1px solid #ccc",
            borderRadius:6,
            transition:"all 0.3s ease",
            outline:"none"
          }}
          onFocus={e=>e.currentTarget.style.borderColor = darkMode?"#A67C52":"#6B3E26"}
          onBlur={e=>e.currentTarget.style.borderColor = darkMode?"#555":"#ccc"}
        />
      </div>

      {/* Progress bar */}
      <div style={{ margin:"20px 0", textAlign:"center" }}>
        <p>📊 Progress: {completedDays}/{totalScheduleDays} days ({progressPercent}%)</p>
        <div className="progress-wrap" style={{ width: "90%", margin: "0 auto" }}>
          <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Day content sections with fade transition */}
      <div style={{ opacity: dayOpacity, transition:"opacity 0.25s ease" }}>
        <section className="card" style={{ border: "1px solid "+(darkMode?"#555":"#E2D5C8"), color: darkMode?"#EDEDED":"#000" }}>
          <h3 className="section-title">📜 Old Testament</h3>
          <p>{day.oldTestament}</p>
          <div style={{ marginTop:10 }}>
            <h4 style={{ marginBottom:6 }}>Notes</h4>
            <textarea
              value={otNote}
              onChange={handleOtNoteChange}
              placeholder="Notes for the Old Testament chapter..."
              style={{
                width:"100%",
                minHeight:80,
                padding:8,
                borderRadius:6,
                border: darkMode?"1px solid #555":"1px solid #ccc",
                fontFamily:"Georgia, serif",
                background: darkMode?"#3A3A3A":"#FFF",
                color: darkMode?"#EDEDED":"#000"
              }}
            />
          </div>
          <h3 className="section-title">✝️ New Testament</h3>
          <p>{day.newTestament}</p>
          <div style={{ marginTop:10 }}>
            <h4 style={{ marginBottom:6 }}>Notes</h4>
            <textarea
              value={ntNote}
              onChange={handleNtNoteChange}
              placeholder="Notes for the New Testament chapter..."
              style={{
                width:"100%",
                minHeight:80,
                padding:8,
                borderRadius:6,
                border: darkMode?"1px solid #555":"1px solid #ccc",
                fontFamily:"Georgia, serif",
                background: darkMode?"#3A3A3A":"#FFF",
                color: darkMode?"#EDEDED":"#000"
              }}
            />
          </div>
        </section>

        <section className="card card--muted" style={{ borderLeft: "6px solid "+(darkMode?"#A67C52":"#6B3E26"), color: darkMode?"#EDEDED":"#000" }}>
          <h3 className="section-title">Reflection</h3>
          <p>{day.reflection}</p>
        </section>

        <section className="card card--muted" style={{ borderLeft: "6px solid "+(darkMode?"#C19B77":"#8A6A52"), color: darkMode?"#EDEDED":"#000" }}>
          <h3 className="section-title">Journaling Prompt</h3>
          <p>{day.prompt}</p>
          <textarea 
            value={journal} 
            onChange={handleJournalChange} 
            placeholder="Write your thoughts here..." 
            style={{ 
              width:"100%", 
              minHeight:120, 
              padding:10, 
              marginTop:10, 
              borderRadius:6, 
              border: darkMode?"1px solid #555":"1px solid #ccc", 
              fontFamily:"Georgia, serif", 
              background: darkMode?"#3A3A3A":"#FFF", 
              color: darkMode?"#EDEDED":"#000" 
            }} 
          />
        </section>
      </div>

      {/* Bottom navigation bar (fixed) */}
      <div style={{ position:'fixed', left:'50%', transform:'translateX(-50%)', bottom:18, display:'flex', gap:12, alignItems:'center', zIndex:2000, padding:'6px 10px', background:'transparent' }}>
        <button onClick={()=>setShowSettings(true)} title="Settings" style={{ width:56, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background: darkMode? '#1f1f1f':'#fff', border:'1px solid #ccc', boxShadow:'0 2px 6px rgba(0,0,0,0.12)', cursor:'pointer' }}>⚙️</button>

        <button onClick={prevDay} disabled={currentDay===1} title="Previous" style={{ width:72, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background: darkMode? '#1f1f1f':'#fff', border:'1px solid #ccc', boxShadow:'0 2px 6px rgba(0,0,0,0.12)', cursor: currentDay===1 ? 'default' : 'pointer', opacity: currentDay===1?0.45:1, padding:8 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:18, color:'#000' }}>◀️</span>
            <span style={{ fontSize:12, color:'#000' }}>Previous</span>
          </div>
        </button>

        <button onClick={()=>changeDay(1)} title="Home" style={{ width:72, height:72, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', background:'#6B3E26', color:'#FBF7F2', fontSize:22, boxShadow:'0 6px 18px rgba(0,0,0,0.25)', transform:'translateY(-6px)', cursor:'pointer' }}>🏠</button>

        <button onClick={nextDay} disabled={currentDay===totalScheduleDays} title="Next" style={{ width:72, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background: darkMode? '#1f1f1f':'#fff', border:'1px solid #ccc', boxShadow:'0 2px 6px rgba(0,0,0,0.12)', cursor: currentDay===totalScheduleDays ? 'default' : 'pointer', opacity: currentDay===totalScheduleDays?0.45:1, padding:8 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:18, color:'#000' }}>▶️</span>
            <span style={{ fontSize:12, color:'#000' }}>Next</span>
          </div>
        </button>

        <button onClick={()=>{ if (!currentUser) setShowAuthModal(true); else setShowProfileModal(true); }} title="Profile" style={{ width:56, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background: darkMode? '#1f1f1f':'#fff', border:'1px solid #ccc', boxShadow:'0 2px 6px rgba(0,0,0,0.12)', padding:4, cursor:'pointer' }}>
          <img src={profileAvatar || DEFAULT_AVATAR} style={{ width:44, height:44, borderRadius:8, objectFit:'cover' }} />
        </button>
      </div>

      {/* Music button (moved up to avoid overlapping nav) */}
      <button onClick={toggleMusic} style={{position:"fixed", bottom:100,right:20,padding:10,borderRadius:8, background:"#6B3E26", color:"#FBF7F2", zIndex:2001}}>🎵 Music</button>

      <style>{`@keyframes fadeIn { from {opacity:0;} to {opacity:1;} }`}</style>
    </div>
      </div>
    </div>
  );
}
