/* ==========================================================================
   Datamodell — delas mellan klient och server
   ========================================================================== */

export type PropertyStatus =
  | 'kommande'
  | 'till_salu'
  | 'budgivning'
  | 'sald'
  | 'tillbakadragen';

export type PropertyType =
  | 'lagenhet'
  | 'villa'
  | 'radhus'
  | 'fritidshus'
  | 'tomt'
  | 'gard'
  | 'lokal';

export interface Property {
  id: string;
  title: string;
  address: string;
  postal_code: string;
  city: string;
  district: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  final_price: number | null;
  monthly_fee: number;
  operating_cost: number;
  rooms: number;
  living_area: number;
  plot_area: number;
  floor: string;
  build_year: number | null;
  description: string;
  features: string[];
  image_url: string;
  images: string[];
  seller_id: string | null;
  commission: number;
  listed_at: string | null;
  sold_at: string | null;
  created_at: string;
}

export type ContactType = 'saljare' | 'kopare' | 'spekulant' | 'ovrig';
export type ContactStage =
  | 'ny'
  | 'kontaktad'
  | 'mote_bokat'
  | 'intag'
  | 'uppdrag'
  | 'avslutad';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ContactType;
  stage: ContactStage;
  source: string;
  budget_min: number | null;
  budget_max: number | null;
  wanted_area: string;
  notes: string;
  tags: string[];
  property_id: string | null;
  last_contact: string | null;
  created_at: string;
}

export type ViewingType = 'oppen' | 'privat' | 'digital';

export interface Viewing {
  id: string;
  property_id: string;
  title: string;
  start_at: string;
  end_at: string;
  type: ViewingType;
  notes: string;
  attendees: number;
  created_at: string;
}

export type BidStatus = 'aktivt' | 'hogsta' | 'avslaget' | 'accepterat';

export interface Bid {
  id: string;
  property_id: string;
  contact_id: string | null;
  bidder_name: string;
  amount: number;
  bid_at: string;
  status: BidStatus;
  note: string;
  created_at: string;
}

export type TaskStatus = 'att_gora' | 'pagar' | 'klar';
export type TaskPriority = 'lag' | 'normal' | 'hog';

export interface Task {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  property_id: string | null;
  contact_id: string | null;
  created_at: string;
}

export type DocumentCategory =
  | 'avtal'
  | 'besiktning'
  | 'planritning'
  | 'foto'
  | 'ekonomi'
  | 'ovrigt';

export interface DocumentItem {
  id: string;
  name: string;
  category: DocumentCategory;
  url: string;
  size: number;
  mime: string;
  property_id: string | null;
  created_at: string;
}

export interface NoteItem {
  id: string;
  body: string;
  property_id: string | null;
  contact_id: string | null;
  created_at: string;
}

export type TemplateCategory =
  | 'annons'
  | 'mail'
  | 'sms'
  | 'checklista'
  | 'social';

export interface TemplateItem {
  id: string;
  title: string;
  category: TemplateCategory;
  body: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  title: string;
  agency: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  commission_rate: number;
  goal_sales: number;
  goal_revenue: number;
}

/* ---------- Etiketter (svenska) ---------- */

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  kommande: 'Kommande',
  till_salu: 'Till salu',
  budgivning: 'Budgivning',
  sald: 'Såld',
  tillbakadragen: 'Tillbakadragen',
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  lagenhet: 'Lägenhet',
  villa: 'Villa',
  radhus: 'Radhus',
  fritidshus: 'Fritidshus',
  tomt: 'Tomt',
  gard: 'Gård',
  lokal: 'Lokal',
};

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  saljare: 'Säljare',
  kopare: 'Köpare',
  spekulant: 'Spekulant',
  ovrig: 'Övrig',
};

export const CONTACT_STAGE_LABEL: Record<ContactStage, string> = {
  ny: 'Ny lead',
  kontaktad: 'Kontaktad',
  mote_bokat: 'Möte bokat',
  intag: 'Intag',
  uppdrag: 'Uppdrag',
  avslutad: 'Avslutad',
};

export const CONTACT_STAGE_ORDER: ContactStage[] = [
  'ny',
  'kontaktad',
  'mote_bokat',
  'intag',
  'uppdrag',
  'avslutad',
];

export const VIEWING_TYPE_LABEL: Record<ViewingType, string> = {
  oppen: 'Öppen visning',
  privat: 'Privatvisning',
  digital: 'Digital visning',
};

export const BID_STATUS_LABEL: Record<BidStatus, string> = {
  aktivt: 'Aktivt',
  hogsta: 'Högsta bud',
  avslaget: 'Avslaget',
  accepterat: 'Accepterat',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  att_gora: 'Att göra',
  pagar: 'Pågår',
  klar: 'Klar',
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  lag: 'Låg',
  normal: 'Normal',
  hog: 'Hög',
};

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  avtal: 'Avtal',
  besiktning: 'Besiktning',
  planritning: 'Planritning',
  foto: 'Foto',
  ekonomi: 'Ekonomi',
  ovrigt: 'Övrigt',
};

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  annons: 'Annonstext',
  mail: 'E-post',
  sms: 'SMS',
  checklista: 'Checklista',
  social: 'Sociala medier',
};
