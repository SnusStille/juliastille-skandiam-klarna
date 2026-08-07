import { z } from 'zod';
import type { TableName } from './db';

/* ==========================================================================
   Validering av inkommande data (samma schema används för create & update).
   ========================================================================== */

const nullableNumber = z.union([z.number(), z.null()]).optional();
const str = z.string().optional();

export const propertySchema = z.object({
  title: z.string().min(2, 'Ange en rubrik'),
  address: z.string().min(2, 'Ange en adress'),
  postal_code: str,
  city: str,
  district: str,
  type: z.enum([
    'lagenhet',
    'villa',
    'radhus',
    'fritidshus',
    'tomt',
    'gard',
    'lokal',
  ]),
  status: z.enum([
    'kommande',
    'till_salu',
    'budgivning',
    'sald',
    'tillbakadragen',
  ]),
  price: z.number().min(0),
  final_price: nullableNumber,
  monthly_fee: z.number().min(0).optional(),
  operating_cost: z.number().min(0).optional(),
  rooms: z.number().min(0).optional(),
  living_area: z.number().min(0).optional(),
  plot_area: z.number().min(0).optional(),
  floor: str,
  build_year: nullableNumber,
  description: str,
  features: z.array(z.string()).optional(),
  image_url: str,
  images: z.array(z.string()).optional(),
  seller_id: z.union([z.string(), z.null()]).optional(),
  commission: z.number().min(0).optional(),
  listed_at: z.union([z.string(), z.null()]).optional(),
  sold_at: z.union([z.string(), z.null()]).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Ange ett namn'),
  email: z.union([z.string().email('Ogiltig e-post'), z.literal('')]).optional(),
  phone: str,
  type: z.enum(['saljare', 'kopare', 'spekulant', 'ovrig']),
  stage: z.enum(['ny', 'kontaktad', 'mote_bokat', 'intag', 'uppdrag', 'avslutad']),
  source: str,
  budget_min: nullableNumber,
  budget_max: nullableNumber,
  wanted_area: str,
  notes: str,
  tags: z.array(z.string()).optional(),
  property_id: z.union([z.string(), z.null()]).optional(),
  last_contact: z.union([z.string(), z.null()]).optional(),
});

export const viewingSchema = z.object({
  property_id: z.string().min(1, 'Välj ett objekt'),
  title: z.string().min(2, 'Ange en rubrik'),
  start_at: z.string().min(1, 'Ange starttid'),
  end_at: z.string().min(1, 'Ange sluttid'),
  type: z.enum(['oppen', 'privat', 'digital']),
  notes: str,
  attendees: z.number().min(0).optional(),
});

export const bidSchema = z.object({
  property_id: z.string().min(1, 'Välj ett objekt'),
  contact_id: z.union([z.string(), z.null()]).optional(),
  bidder_name: z.string().min(1, 'Ange budgivare'),
  amount: z.number().min(0),
  bid_at: z.string().min(1),
  status: z.enum(['aktivt', 'hogsta', 'avslaget', 'accepterat']),
  note: str,
});

export const taskSchema = z.object({
  title: z.string().min(2, 'Ange en rubrik'),
  description: str,
  due_at: z.union([z.string(), z.null()]).optional(),
  priority: z.enum(['lag', 'normal', 'hog']),
  status: z.enum(['att_gora', 'pagar', 'klar']),
  property_id: z.union([z.string(), z.null()]).optional(),
  contact_id: z.union([z.string(), z.null()]).optional(),
});

export const documentSchema = z.object({
  name: z.string().min(1, 'Ange ett filnamn'),
  category: z.enum([
    'avtal',
    'besiktning',
    'planritning',
    'foto',
    'ekonomi',
    'ovrigt',
  ]),
  url: str,
  size: z.number().min(0).optional(),
  mime: str,
  property_id: z.union([z.string(), z.null()]).optional(),
});

export const noteSchema = z.object({
  body: z.string().min(1, 'Skriv något först'),
  property_id: z.union([z.string(), z.null()]).optional(),
  contact_id: z.union([z.string(), z.null()]).optional(),
});

export const templateSchema = z.object({
  title: z.string().min(2, 'Ange en rubrik'),
  category: z.enum(['annons', 'mail', 'sms', 'checklista', 'social']),
  body: z.string().min(1, 'Mallen är tom'),
});

export const conversationSchema = z.object({
  title: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  title: str,
  agency: str,
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: str,
  bio: str,
  avatar_url: str,
  commission_rate: z.number().min(0).max(100).optional(),
  goal_sales: z.number().min(0).optional(),
  goal_revenue: z.number().min(0).optional(),
});

export const TABLE_SCHEMAS: Partial<Record<TableName, z.ZodTypeAny>> = {
  properties: propertySchema,
  contacts: contactSchema,
  viewings: viewingSchema,
  bids: bidSchema,
  tasks: taskSchema,
  documents: documentSchema,
  notes: noteSchema,
  templates: templateSchema,
  conversations: conversationSchema,
};

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Något blev fel i formuläret.';
}
