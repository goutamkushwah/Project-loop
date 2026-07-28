"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";



export function Card( { children, className = "" } ) {
  return (
    <div
      className={ `rounded-2xl ${className}` }
      style={ { background: "#14141F", border: "1px solid #232336" } }
    >
      { children }
    </div>
  );
}

export function Pill( { children, color = "#8B899C", bg = "rgba(139,137,156,0.12)" } ) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={ { color, background: bg } }
    >
      { children }
    </span>
  );
}

export function StatCard( { label, value, delta, positive } ) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium tracking-wide uppercase" style={ { color: "#8B899C" } }>
        { label }
      </div>
      <div
        className="mt-2 text-3xl font-semibold"
        style={ { fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" } }
      >
        { value }
      </div>
      { delta && (
        <div
          className="mt-2 flex items-center gap-1 text-xs font-medium"
          style={ { color: positive ? "#2DD4BF" : "#FB7166" } }
        >
          { positive ? <ArrowUpRight size={ 14 } /> : <ArrowDownRight size={ 14 } /> }
          { delta }
        </div>
      ) }
    </Card>
  );
}

/* LOOP logomark */
export function LoopMark( { size = 28, animate = false } ) {
  return (
    <svg width={ size } height={ size } viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="16" stroke="#232336" strokeWidth="3" />
      <path
        d="M20 4 A16 16 0 1 1 5.6 12"
        stroke="#7C6FFF"
        strokeWidth="3"
        strokeLinecap="round"
        style={ animate ? { transformOrigin: "20px 20px", animation: "spin 1.4s linear infinite" } : {} }
      />
      <circle cx="20" cy="20" r="5" fill="#7C6FFF" />
      <style>{ `@keyframes spin { to { transform: rotate(360deg); } }` }</style>
    </svg>
  );
}

export function AuthField( { icon: Icon, invalid, ...props } ) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg px-3.5 py-3"
      style={ { background: "#0F0F19", border: `1px solid ${invalid ? "#FB7166" : "#232336"}` } }
    >
      <Icon size={ 16 } color={ invalid ? "#FB7166" : "#8B899C" } />
      <input
        { ...props }
        className="bg-transparent outline-none text-sm w-full"
        style={ { color: "#F1F0F5" } }
      />
    </div>
  );
}

export function AuthTopBar( { nav } ) {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 py-6 max-w-6xl mx-auto w-full">
      <button onClick={ () => nav( "/" ) } className="flex items-center gap-2">
        <LoopMark size={ 26 } />
        <span
          className="text-lg font-semibold"
          style={ { fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" } }
        >
          LOOP
        </span>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={ () => nav( "/login" ) }
          className="text-sm font-medium px-4 py-2 rounded-lg"
          style={ { color: "#8B899C" } }
        >
          Log in
        </button>
        <button
          onClick={ () => nav( "/signup" ) }
          className="text-sm font-medium px-4 py-2 rounded-lg"
          style={ { background: "#7C6FFF", color: "#0A0A12" } }
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

/* ---- shared data/constants used by dashboard views ---- */
export const CHANNELS = [ "Support ticket", "App store", "NPS survey", "Sales call", "Community" ];
export const THEMES = [ "Onboarding", "Billing", "Mobile app", "Integrations", "Performance", "Support speed" ];

function seedFeedback() {
  const samples = [
    [ "Onboarding took forever, couldn't figure out how to invite my team.", "Support ticket", "neg", "Onboarding" ],
    [ "The new dashboard is gorgeous and finally fast. Huge improvement.", "App store", "pos", "Performance" ],
    [ "It does the job, but the mobile experience needs work.", "NPS survey", "neu", "Mobile app" ],
    [ "Prospect wants SSO before they'll sign, third time this month.", "Sales call", "neg", "Integrations" ],
    [ "Love the new export feature, saved me an hour today.", "Community", "pos", "Performance" ],
    [ "Billing page keeps timing out when I try to download an invoice.", "Support ticket", "neg", "Billing" ],
    [ "Support replied in under ten minutes, genuinely impressed.", "Support ticket", "pos", "Support speed" ],
    [ "Mobile app crashes every time I open the reports tab.", "App store", "neg", "Mobile app" ],
    [ "Setup wizard is clear now, took me five minutes end to end.", "NPS survey", "pos", "Onboarding" ],
    [ "We need a Slack integration before renewal, came up twice this week.", "Sales call", "neu", "Integrations" ],
    [ "Invoice history is confusing, can't tell which month is which.", "Support ticket", "neg", "Billing" ],
    [ "Team loves the new theme clustering, saves us hours weekly.", "Community", "pos", "Performance" ],
    [ "Waited two days for a reply to a critical ticket.", "Support ticket", "neg", "Support speed" ],
    [ "Android app is noticeably slower than the web version.", "App store", "neu", "Mobile app" ],
    [ "Onboarding checklist is great but the video is outdated.", "NPS survey", "neu", "Onboarding" ],
  ];
  return samples.map( ( s, i ) => ( {
    id: `FB-${1042 + i}`,
    content: s[ 0 ],
    channel: s[ 1 ],
    sentiment: s[ 2 ],
    theme: s[ 3 ],
    status: [ "NEW", "REVIEWED", "ACTIONED" ][ i % 3 ],
    date: `Jul ${28 - ( i % 12 )}`,
  } ) );
}

export const FEEDBACK = seedFeedback();

export const VOLUME_DATA = [
  { day: "Mon", items: 18 }, { day: "Tue", items: 24 }, { day: "Wed", items: 21 },
  { day: "Thu", items: 32 }, { day: "Fri", items: 28 }, { day: "Sat", items: 14 }, { day: "Sun", items: 11 },
];

export const SENTIMENT_DATA = [
  { name: "Positive", value: 46, color: "#2DD4BF" },
  { name: "Neutral", value: 27, color: "#F5A623" },
  { name: "Negative", value: 27, color: "#FB7166" },
];

export const THEME_DATA = [
  { theme: "Onboarding", count: 34 }, { theme: "Billing", count: 28 },
  { theme: "Mobile app", count: 25 }, { theme: "Integrations", count: 19 },
  { theme: "Support speed", count: 16 }, { theme: "Performance", count: 12 },
];

export const TREND_DATA = [
  { week: "W1", Onboarding: 8, Billing: 5, Mobile: 4 },
  { week: "W2", Onboarding: 12, Billing: 9, Mobile: 6 },
  { week: "W3", Onboarding: 10, Billing: 14, Mobile: 9 },
  { week: "W4", Onboarding: 19, Billing: 17, Mobile: 15 },
];

export const SENT_COLOR = { pos: "#2DD4BF", neu: "#F5A623", neg: "#FB7166" };
export const SENT_LABEL = { pos: "Positive", neu: "Neutral", neg: "Negative" };
