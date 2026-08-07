'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { Field, Modal, useToast } from '@/components/ui';
import { create, patch } from '@/lib/client';
import {
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  type Contact,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from '@/lib/types';
import { toInputDate } from '@/lib/utils';

const IMAGE_CHOICES = [
  '/objekt/obj-1.jpg',
  '/objekt/obj-2.jpg',
  '/objekt/obj-3.jpg',
  '/objekt/obj-4.jpg',
  '/objekt/obj-5.jpg',
  '/objekt/obj-6.jpg',
];

interface FormState {
  title: string;
  address: string;
  postal_code: string;
  city: string;
  district: string;
  type: PropertyType;
  status: PropertyStatus;
  price: string;
  final_price: string;
  monthly_fee: string;
  operating_cost: string;
  rooms: string;
  living_area: string;
  plot_area: string;
  floor: string;
  build_year: string;
  description: string;
  features: string;
  image_url: string;
  seller_id: string;
  commission: string;
  listed_at: string;
  sold_at: string;
}

const EMPTY: FormState = {
  title: '',
  address: '',
  postal_code: '',
  city: 'Stockholm',
  district: '',
  type: 'lagenhet',
  status: 'kommande',
  price: '',
  final_price: '',
  monthly_fee: '',
  operating_cost: '',
  rooms: '',
  living_area: '',
  plot_area: '',
  floor: '',
  build_year: '',
  description: '',
  features: '',
  image_url: IMAGE_CHOICES[0],
  seller_id: '',
  commission: '',
  listed_at: '',
  sold_at: '',
};

function fromProperty(property: Property): FormState {
  return {
    title: property.title,
    address: property.address,
    postal_code: property.postal_code,
    city: property.city,
    district: property.district,
    type: property.type,
    status: property.status,
    price: String(property.price ?? ''),
    final_price: property.final_price ? String(property.final_price) : '',
    monthly_fee: String(property.monthly_fee ?? ''),
    operating_cost: String(property.operating_cost ?? ''),
    rooms: String(property.rooms ?? ''),
    living_area: String(property.living_area ?? ''),
    plot_area: String(property.plot_area ?? ''),
    floor: property.floor,
    build_year: property.build_year ? String(property.build_year) : '',
    description: property.description,
    features: property.features.join(', '),
    image_url: property.image_url,
    seller_id: property.seller_id ?? '',
    commission: String(property.commission ?? ''),
    listed_at: toInputDate(property.listed_at),
    sold_at: toInputDate(property.sold_at),
  };
}

const num = (value: string) => {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function PropertyForm({
  open,
  onClose,
  property,
  contacts,
}: {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
  contacts: Contact[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(property ? fromProperty(property) : EMPTY);
      setError(null);
    }
  }, [open, property]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit() {
    if (busy) return;
    setError(null);

    if (form.title.trim().length < 2) return setError('Ange en rubrik.');
    if (form.address.trim().length < 2) return setError('Ange en adress.');
    if (!form.price.trim()) return setError('Ange ett utgångspris.');

    const payload = {
      title: form.title.trim(),
      address: form.address.trim(),
      postal_code: form.postal_code.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      type: form.type,
      status: form.status,
      price: num(form.price),
      final_price: form.final_price ? num(form.final_price) : null,
      monthly_fee: num(form.monthly_fee),
      operating_cost: num(form.operating_cost),
      rooms: num(form.rooms),
      living_area: num(form.living_area),
      plot_area: num(form.plot_area),
      floor: form.floor.trim(),
      build_year: form.build_year ? num(form.build_year) : null,
      description: form.description.trim(),
      features: form.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      image_url: form.image_url,
      images: form.image_url ? [form.image_url] : [],
      seller_id: form.seller_id || null,
      commission: form.commission
        ? num(form.commission)
        : Math.round(num(form.price) * 0.025),
      listed_at: form.listed_at ? new Date(form.listed_at).toISOString() : null,
      sold_at: form.sold_at ? new Date(form.sold_at).toISOString() : null,
    };

    setBusy(true);
    try {
      if (property) {
        await patch('properties', property.id, payload);
        push('Objektet är uppdaterat.');
      } else {
        await create('properties', payload);
        push('Objektet är sparat.');
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara.');
    } finally {
      setBusy(false);
    }
  }

  const sellers = contacts.filter(
    (c) => c.type === 'saljare' || c.type === 'ovrig',
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={property ? 'Redigera objekt' : 'Nytt objekt'}
      description={
        property
          ? 'Ändringarna sparas direkt när du klickar Spara.'
          : 'Fyll i det du vet nu — du kan komplettera senare.'
      }
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {property ? 'Spara ändringar' : 'Skapa objekt'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <p role="alert" className="rounded-md border border-clay/30 bg-clay/8 px-3.5 py-2.5 text-sm text-clay">
            {error}
          </p>
        )}

        <Field label="Rubrik">
          <input
            className="field"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ljus sekelskiftesetta med fiskbensparkett"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Adress">
            <input
              className="field"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Katarina Bangata 42, 3 tr"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Postnummer">
              <input
                className="field"
                value={form.postal_code}
                onChange={(e) => set('postal_code', e.target.value)}
                placeholder="116 39"
              />
            </Field>
            <Field label="Ort">
              <input
                className="field"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Område">
            <input
              className="field"
              value={form.district}
              onChange={(e) => set('district', e.target.value)}
              placeholder="Södermalm"
            />
          </Field>
          <Field label="Bostadstyp">
            <select
              className="field"
              value={form.type}
              onChange={(e) => set('type', e.target.value as PropertyType)}
            >
              {Object.entries(PROPERTY_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="field"
              value={form.status}
              onChange={(e) => set('status', e.target.value as PropertyStatus)}
            >
              {Object.entries(PROPERTY_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="hairline" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Utgångspris (kr)">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="4950000"
            />
          </Field>
          <Field label="Slutpris (kr)" hint="Fylls i vid såld affär">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.final_price}
              onChange={(e) => set('final_price', e.target.value)}
            />
          </Field>
          <Field label="Provision (kr)" hint="Lämna tomt för 2,5 %">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.commission}
              onChange={(e) => set('commission', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Avgift/mån">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.monthly_fee}
              onChange={(e) => set('monthly_fee', e.target.value)}
            />
          </Field>
          <Field label="Driftkostnad/mån">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.operating_cost}
              onChange={(e) => set('operating_cost', e.target.value)}
            />
          </Field>
          <Field label="Antal rum">
            <input
              className="field tnum"
              inputMode="decimal"
              value={form.rooms}
              onChange={(e) => set('rooms', e.target.value)}
            />
          </Field>
          <Field label="Boarea (m²)">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.living_area}
              onChange={(e) => set('living_area', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tomtarea (m²)">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.plot_area}
              onChange={(e) => set('plot_area', e.target.value)}
            />
          </Field>
          <Field label="Våning / planlösning">
            <input
              className="field"
              value={form.floor}
              onChange={(e) => set('floor', e.target.value)}
              placeholder="3 av 5"
            />
          </Field>
          <Field label="Byggår">
            <input
              className="field tnum"
              inputMode="numeric"
              value={form.build_year}
              onChange={(e) => set('build_year', e.target.value)}
            />
          </Field>
        </div>

        <div className="hairline" />

        <Field label="Beskrivning">
          <textarea
            className="field min-h-[130px]"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Berätta om bostaden…"
          />
        </Field>

        <Field
          label="Egenskaper"
          hint="Separera med komma, t.ex. Balkong, Hiss, Nytt kök"
        >
          <input
            className="field"
            value={form.features}
            onChange={(e) => set('features', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Säljare">
            <select
              className="field"
              value={form.seller_id}
              onChange={(e) => set('seller_id', e.target.value)}
            >
              <option value="">Ingen vald</option>
              {sellers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Publicerad">
            <input
              type="date"
              className="field"
              value={form.listed_at}
              onChange={(e) => set('listed_at', e.target.value)}
            />
          </Field>
          <Field label="Såld">
            <input
              type="date"
              className="field"
              value={form.sold_at}
              onChange={(e) => set('sold_at', e.target.value)}
            />
          </Field>
        </div>

        <div>
          <span className="label">Huvudbild</span>
          <div className="flex flex-wrap gap-2.5">
            {IMAGE_CHOICES.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => set('image_url', src)}
                aria-label={`Välj bild ${src}`}
                className={`h-16 w-24 overflow-hidden rounded-md border-2 transition ${
                  form.image_url === src
                    ? 'border-brass'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => set('image_url', '')}
              className={`flex h-16 w-24 items-center justify-center rounded-md border-2 border-dashed text-xs transition ${
                form.image_url === ''
                  ? 'border-brass text-brass'
                  : 'border-line text-faint hover:text-muted'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            className="field mt-2.5"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="Eller klistra in en bild-URL (t.ex. från Supabase Storage)"
          />
        </div>
      </div>
    </Modal>
  );
}
