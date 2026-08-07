import { db } from './db';
import { formatDate, formatSEK } from './utils';
import {
  CONTACT_STAGE_LABEL,
  CONTACT_TYPE_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  TASK_STATUS_LABEL,
} from './types';

/* ==========================================================================
   Systemprompt + kontext till Claude.
   ========================================================================== */

export const AI_MODES = {
  chat: {
    id: 'chat',
    label: 'Fri chatt',
    hint: 'Fråga om vad som helst i din mäklarvardag.',
  },
  annons: {
    id: 'annons',
    label: 'Annonstext',
    hint: 'Skriv en säljande objektsbeskrivning.',
  },
  mail: {
    id: 'mail',
    label: 'Kundmail',
    hint: 'Formulera ett professionellt mail.',
  },
  social: {
    id: 'social',
    label: 'Sociala medier',
    hint: 'Inlägg till Instagram eller Facebook.',
  },
  vardering: {
    id: 'vardering',
    label: 'Värderingsunderlag',
    hint: 'Resonera kring pris och prissättning.',
  },
  coach: {
    id: 'coach',
    label: 'Säljcoach',
    hint: 'Råd inför samtal, budgivning och förhandling.',
  },
} as const;

export type AiMode = keyof typeof AI_MODES;

const MODE_INSTRUCTIONS: Record<AiMode, string> = {
  chat: 'Svara hjälpsamt, konkret och kortfattat.',
  annons:
    'Skriv en objektsbeskrivning på svenska i Julias ton: varm, konkret och utan klyschor. Undvik ord som "unik pärla", "drömboende" och "solig oas". Använd korta stycken, en tydlig rubrik och avsluta med fakta (rum, boarea, område, utgångspris).',
  mail: 'Skriv ett komplett mail med ämnesrad, hälsningsfras och signatur. Professionellt men personligt, aldrig stelt. Håll det kort.',
  social:
    'Skriv ett inlägg för Instagram/Facebook. Max 90 ord, en tydlig krok i första meningen, radbrytningar för läsbarhet, 4–6 relevanta hashtaggar sist.',
  vardering:
    'Resonera strukturerat kring prissättningen: jämförbara objekt, kvadratmeterpris, skick, läge, efterfrågan och risker. Var tydlig med att detta är ett underlag, inte en formell värdering.',
  coach:
    'Agera erfaren mäklarcoach. Ge konkreta, praktiska råd. Punktlistor och färdiga formuleringar Julia kan använda direkt.',
};

export function systemPrompt(mode: AiMode, context: string, agentName: string) {
  return `Du är "Stille AI" — en personlig assistent byggd åt ${agentName}, registrerad fastighetsmäklare i Stockholm.

Om dig:
- Du svarar alltid på svenska, i ett varmt, professionellt och rakt tonläge.
- Du kan mäklarbranschen: intag, värdering, marknadsföring, visningar, budgivning, kontraktsskrivning och tillträde.
- Du känner till svensk mäklarpraxis (fastighetsmäklarlagen, budgivningens frivillighet, budförteckning, dold och öppen budgivning, besiktningsklausuler, bostadsrätt vs fastighet).
- Du hittar aldrig på siffror. Saknas underlag säger du det och frågar efter det du behöver.
- Du ger aldrig bindande juridisk eller skatterådgivning — du föreslår att en jurist eller revisor kopplas in när det behövs.

Uppgiftsläge: ${MODE_INSTRUCTIONS[mode]}

Formatering: använd markdown med korta stycken och punktlistor. Ingen inledande artighetsfras — börja direkt med svaret.

${context}`;
}

/** Bygger en kompakt textbeskrivning av aktuellt läge i systemet. */
export async function buildContext(): Promise<string> {
  const [properties, contacts, tasks, viewings, bids] = await Promise.all([
    db.properties.list(),
    db.contacts.list(),
    db.tasks.list(),
    db.viewings.list(),
    db.bids.list(),
  ]);

  const active = properties.filter((p) => p.status !== 'sald');
  const upcoming = viewings
    .filter((v) => new Date(v.start_at).getTime() > Date.now())
    .slice(0, 6);
  const openTasks = tasks.filter((t) => t.status !== 'klar').slice(0, 10);

  const lines: string[] = [];
  lines.push('--- AKTUELL DATA I JULIAS SYSTEM (använd när det är relevant) ---');

  lines.push('\nOBJEKT:');
  for (const p of properties.slice(0, 12)) {
    const bidsFor = bids.filter((b) => b.property_id === p.id);
    const highest = bidsFor.length
      ? Math.max(...bidsFor.map((b) => b.amount))
      : null;
    lines.push(
      `• ${p.address}, ${p.city} (${p.district}) — ${PROPERTY_TYPE_LABEL[p.type]}, ${
        p.rooms
      } rum, ${p.living_area} m². Status: ${PROPERTY_STATUS_LABEL[p.status]}. Utgångspris ${formatSEK(
        p.price,
      )}${highest ? `. Högsta bud ${formatSEK(highest)}` : ''}${
        p.final_price ? `. Slutpris ${formatSEK(p.final_price)}` : ''
      }. Avgift ${formatSEK(p.monthly_fee)}/mån. Byggår ${p.build_year ?? 'okänt'}. Egenskaper: ${
        p.features.join(', ') || '–'
      }.`,
    );
  }

  lines.push('\nKUNDER:');
  for (const c of contacts.slice(0, 14)) {
    lines.push(
      `• ${c.name} — ${CONTACT_TYPE_LABEL[c.type]}, steg: ${
        CONTACT_STAGE_LABEL[c.stage]
      }${
        c.budget_max ? `, budget upp till ${formatSEK(c.budget_max)}` : ''
      }${c.wanted_area ? `, söker i ${c.wanted_area}` : ''}. ${c.notes}`,
    );
  }

  if (upcoming.length) {
    lines.push('\nKOMMANDE VISNINGAR:');
    for (const v of upcoming) {
      const p = properties.find((x) => x.id === v.property_id);
      lines.push(
        `• ${formatDate(v.start_at)} — ${v.title}${p ? ` (${p.address})` : ''}`,
      );
    }
  }

  if (openTasks.length) {
    lines.push('\nÖPPNA UPPGIFTER:');
    for (const t of openTasks) {
      lines.push(
        `• ${t.title} — ${TASK_STATUS_LABEL[t.status]}${
          t.due_at ? `, deadline ${formatDate(t.due_at)}` : ''
        }`,
      );
    }
  }

  lines.push(
    `\nSAMMANFATTNING: ${active.length} aktiva objekt, ${contacts.length} kunder i registret, ${openTasks.length} öppna uppgifter.`,
  );
  lines.push('--- SLUT PÅ DATA ---');

  return lines.join('\n');
}

export const QUICK_PROMPTS: { mode: AiMode; label: string; prompt: string }[] = [
  {
    mode: 'annons',
    label: 'Annonstext för ett objekt',
    prompt:
      'Skriv en annonstext för Katarina Bangata 42. Använd faktan från mitt system.',
  },
  {
    mode: 'mail',
    label: 'Uppföljningsmail efter visning',
    prompt:
      'Skriv ett uppföljningsmail till spekulanter som var på visningen igår. Vänligt, kort och med en tydlig uppmaning att höra av sig.',
  },
  {
    mode: 'coach',
    label: 'Så hanterar jag budgivningen',
    prompt:
      'Ge mig en plan för hur jag driver budgivningen på Bergviksvägen 7 i mål den här veckan.',
  },
  {
    mode: 'social',
    label: 'Instagraminlägg om nytt objekt',
    prompt:
      'Skriv ett Instagram-inlägg om att Rissneleden 62 nu ligger ute till försäljning.',
  },
  {
    mode: 'vardering',
    label: 'Underlag inför värdering',
    prompt:
      'Hjälp mig resonera kring prissättningen av radhuset på Lindstigen 14 inför intaget.',
  },
  {
    mode: 'chat',
    label: 'Vad ska jag prioritera idag?',
    prompt:
      'Titta på mina objekt, visningar och uppgifter. Vad bör jag prioritera idag och varför?',
  },
];
