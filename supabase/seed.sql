-- ===========================================================================
--  Julia Stille — Exempeldata
--
--  Kör supabase/migration.sql FÖRST, sedan den här filen i SQL Editor.
--  Innehåller samma demodata som appen visar när Supabase inte är kopplat.
--  Datumen är relativa till dagen du kör skriptet.
--
--  Vill du börja helt tomt? Hoppa bara över den här filen.
--  Developed by Stilledev
-- ===========================================================================

begin;

-- Rensa gammal exempeldata så skriptet går att köra om
delete from public.messages;
delete from public.conversations;
delete from public.templates;
delete from public.notes;
delete from public.documents;
delete from public.tasks;
delete from public.bids;
delete from public.viewings;
delete from public.properties;
delete from public.contacts;

-- ---------------------------------------------------------------------------
-- Kontakter
-- ---------------------------------------------------------------------------
insert into public.contacts
  (id, name, email, phone, type, stage, source, budget_min, budget_max,
   wanted_area, notes, tags, last_contact, created_at)
values
  ('c0000000-0000-4000-8000-000000000001', 'Anders Lindqvist', 'anders.lindqvist@example.se', '070-884 21 09',
   'saljare', 'uppdrag', 'Rekommendation', null, null, '',
   'Säljer sin tvåa på Söder inför flytt till Göteborg. Vill ha snabb process.',
   array['Prioriterad','Söderort'], now() - interval '2 days', now() - interval '30 days'),

  ('c0000000-0000-4000-8000-000000000002', 'Familjen Ek', 'ek.familjen@example.se', '073-441 88 20',
   'saljare', 'uppdrag', 'Egen kontakt', null, null, '',
   'Säljer villan i Boo. Känsliga för visningstider på helger.',
   array['Villa','Nacka'], now() - interval '1 day', now() - interval '45 days'),

  ('c0000000-0000-4000-8000-000000000003', 'Sara Nyström', 'sara.nystrom@example.se', '076-220 14 77',
   'spekulant', 'mote_bokat', 'Hemnet', 4000000, 5500000, 'Södermalm, Hammarby Sjöstad',
   'Söker 2:a med balkong. Lånelöfte klart. Vill gärna se Katarina Bangata igen.',
   array['Lånelöfte','Het'], now() - interval '3 days', now() - interval '14 days'),

  ('c0000000-0000-4000-8000-000000000004', 'Mikael Boström', 'mikael.bostrom@example.se', '070-555 02 31',
   'saljare', 'intag', 'Värderingsförfrågan', null, null, '',
   'Radhus i Bromma. Intagsmöte klart, fotografering bokas nästa vecka.',
   array['Bromma'], now() - interval '5 days', now() - interval '11 days'),

  ('c0000000-0000-4000-8000-000000000005', 'Elin Hagberg', 'elin.hagberg@example.se', '072-909 76 12',
   'kopare', 'kontaktad', 'Instagram', 6000000, 8000000, 'Bromma, Äppelviken',
   'Familj med två barn, söker radhus med trädgård till hösten.',
   array['Familj','Radhus'], now() - interval '6 days', now() - interval '16 days'),

  ('c0000000-0000-4000-8000-000000000006', 'Peter Aho', 'peter.aho@example.se', '070-311 45 66',
   'spekulant', 'ny', 'Hemnet', 11000000, 13500000, 'Nacka, Värmdö',
   'Lade bud på Bergviksvägen. Vill ha besiktningsprotokoll.',
   array['Budgivare'], now() - interval '1 day', now() - interval '8 days'),

  ('c0000000-0000-4000-8000-000000000007', 'Nadia Karlsson', 'nadia.karlsson@example.se', '073-118 90 44',
   'kopare', 'ny', 'Öppen visning', 2000000, 2800000, 'Sundbyberg, Solna',
   'Förstagångsköpare. Behöver hjälp att förstå processen.',
   array['Förstagångsköpare'], now() - interval '4 days', now() - interval '4 days'),

  ('c0000000-0000-4000-8000-000000000008', 'Johan & Vera Sund', 'sund.johan@example.se', '070-777 12 08',
   'kopare', 'avslutad', 'Rekommendation', 13000000, 16000000, 'Östermalm',
   'Köpte takvåningen på Grev Turegatan. Otroligt nöjda — be om omdöme.',
   array['Avslutad affär','Omdöme'], now() - interval '34 days', now() - interval '96 days');

-- ---------------------------------------------------------------------------
-- Objekt
-- ---------------------------------------------------------------------------
insert into public.properties
  (id, title, address, postal_code, city, district, type, status, price, final_price,
   monthly_fee, operating_cost, rooms, living_area, plot_area, floor, build_year,
   description, features, image_url, images, seller_id, commission, listed_at, sold_at, created_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'Ljus sekelskiftesetta med fiskbensparkett',
   'Katarina Bangata 42, 3 tr', '116 39', 'Stockholm', 'Södermalm', 'lagenhet', 'till_salu',
   4950000, null, 3240, 480, 2, 58, 0, '3 av 5', 1911,
   'En ovanligt ljus tvåa i ett välskött sekelskifteshus mitt på Södermalm. Fiskbensparkett, stuckatur och tvåglasfönster i original mot en tyst innergård. Renoverat kök från 2021 och ett badrum med golvvärme.',
   array['Fiskbensparkett','Stuckatur','Balkong mot gård','Hiss','Renoverat kök 2021'],
   '/objekt/obj-1.jpg', array['/objekt/obj-1.jpg'],
   'c0000000-0000-4000-8000-000000000001', 123750,
   now() - interval '12 days', null, now() - interval '20 days'),

  ('a0000000-0000-4000-8000-000000000002', 'Arkitektritad villa med skärgårdskänsla',
   'Bergviksvägen 7', '132 37', 'Saltsjö-Boo', 'Nacka', 'villa', 'budgivning',
   12500000, null, 0, 4100, 6, 194, 1420, '1 plan', 2019,
   'Arkitektritad enplansvilla i svartlaserat trä, uppförd 2019 på en naturtomt med berg i dagen och tallar. Öppna sociala ytor, stora glaspartier och en skyddad uteplats i sydvästläge.',
   array['Bergvärme','Golvvärme','Sjöglimt','Dubbelgarage','Solceller'],
   '/objekt/obj-2.jpg', array['/objekt/obj-2.jpg'],
   'c0000000-0000-4000-8000-000000000002', 312500,
   now() - interval '25 days', null, now() - interval '38 days'),

  ('a0000000-0000-4000-8000-000000000003', 'Familjeradhus i barnvänligt kvarter',
   'Lindstigen 14', '167 65', 'Bromma', 'Bromma', 'radhus', 'kommande',
   7250000, null, 4870, 1900, 5, 132, 210, '2 plan + källare', 1974,
   'Falurött radhus i ett lugnt och grönt kvarter med lekplats runt hörnet. Fem rum fördelat på två plan plus källare, egen täppa med syrenberså och kvällssol.',
   array['Egen täppa','Källare','Nytt tak 2020','Carport'],
   '/objekt/obj-3.jpg', array['/objekt/obj-3.jpg'],
   'c0000000-0000-4000-8000-000000000004', 181250,
   null, null, now() - interval '6 days'),

  ('a0000000-0000-4000-8000-000000000004', 'Sjötomt med gäststuga och egen brygga',
   'Vikvägen 3', '184 95', 'Ljusterö', 'Österåker', 'fritidshus', 'till_salu',
   6900000, null, 0, 1450, 4, 96, 2600, '1 plan', 1998,
   'Sjönära fritidshus med inglasad veranda, gäststuga och egen brygga. Kvällssol över vattnet och 2 600 kvm naturtomt med björk och berg.',
   array['Egen brygga','Gäststuga','Bastu','Sjötomt','Vedeldad kamin'],
   '/objekt/obj-4.jpg', array['/objekt/obj-4.jpg'],
   null, 172500,
   now() - interval '40 days', null, now() - interval '52 days'),

  ('a0000000-0000-4000-8000-000000000005', 'Takvåning med utsikt över stadens tak',
   'Grev Turegatan 28, 6 tr', '114 38', 'Stockholm', 'Östermalm', 'lagenhet', 'sald',
   14900000, 15750000, 6890, 900, 4, 138, 0, '6 av 6', 1929,
   'Exklusiv takvåning med fri utsikt, ekgolv i ljus ton, stenbänkskiva och mässingsdetaljer. Terrass i västerläge om 24 kvm.',
   array['Takterrass','Fri utsikt','Hiss till våningsplan','Kamin'],
   '/objekt/obj-5.jpg', array['/objekt/obj-5.jpg'],
   null, 393750,
   now() - interval '88 days', now() - interval '34 days', now() - interval '102 days'),

  ('a0000000-0000-4000-8000-000000000006', 'Smart etta med perfekt planlösning',
   'Rissneleden 62, 5 tr', '174 57', 'Sundbyberg', 'Rissne', 'lagenhet', 'till_salu',
   2450000, null, 2180, 320, 1, 34, 0, '5 av 7', 2016,
   'Nyproducerad etta med genomtänkt planlösning, stor förvaring och balkong i söderläge. Tunnelbanan ligger fem minuters promenad bort.',
   array['Balkong','Nyproduktion','Nära tunnelbana','Bra förvaring'],
   '/objekt/obj-6.jpg', array['/objekt/obj-6.jpg'],
   null, 61250,
   now() - interval '4 days', null, now() - interval '9 days');

-- Koppla kontakterna till rätt objekt
update public.contacts set property_id = 'a0000000-0000-4000-8000-000000000001'
  where id in ('c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000003');
update public.contacts set property_id = 'a0000000-0000-4000-8000-000000000002'
  where id in ('c0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000006');
update public.contacts set property_id = 'a0000000-0000-4000-8000-000000000003'
  where id in ('c0000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000005');
update public.contacts set property_id = 'a0000000-0000-4000-8000-000000000005'
  where id = 'c0000000-0000-4000-8000-000000000008';
update public.contacts set property_id = 'a0000000-0000-4000-8000-000000000006'
  where id = 'c0000000-0000-4000-8000-000000000007';

-- ---------------------------------------------------------------------------
-- Visningar
-- ---------------------------------------------------------------------------
insert into public.viewings
  (property_id, title, start_at, end_at, type, notes, attendees, created_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'Öppen visning — Katarina Bangata 42',
   (current_date + 2) + time '12:00', (current_date + 2) + time '12:45', 'oppen',
   'Ta med extra objektsbeskrivningar. Tänd lamporna i hallen.', 0, now() - interval '5 days'),

  ('a0000000-0000-4000-8000-000000000001', 'Privatvisning — Sara Nyström',
   (current_date + 3) + time '17:30', (current_date + 3) + time '18:00', 'privat',
   'Andra visningen. Vill mäta i sovrummet.', 2, now() - interval '2 days'),

  ('a0000000-0000-4000-8000-000000000002', 'Öppen visning — Bergviksvägen 7',
   (current_date + 1) + time '11:00', (current_date + 1) + time '12:00', 'oppen',
   'Parkering längs vägen. Öppna altandörrarna.', 0, now() - interval '9 days'),

  ('a0000000-0000-4000-8000-000000000004', 'Visning Ljusterö — samåkning från färjan',
   (current_date + 6) + time '13:00', (current_date + 6) + time '14:30', 'oppen',
   'Möt upp vid färjeläget 12:45.', 0, now() - interval '3 days'),

  ('a0000000-0000-4000-8000-000000000006', 'Öppen visning — Rissneleden 62',
   (current_date - 3) + time '12:00', (current_date - 3) + time '12:30', 'oppen',
   'Genomförd. 14 besökare, 3 intresseanmälningar.', 14, now() - interval '10 days');

-- ---------------------------------------------------------------------------
-- Bud
-- ---------------------------------------------------------------------------
insert into public.bids
  (property_id, contact_id, bidder_name, amount, bid_at, status, note, created_at)
values
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000006',
   'Peter Aho', 12750000, now() - interval '1 day', 'hogsta', 'Villkorat av besiktning.', now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000002', null,
   'Budgivare 2', 12600000, now() - interval '1 day' - interval '2 hours', 'aktivt', '', now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000002', null,
   'Budgivare 3', 12500000, now() - interval '2 days', 'aktivt', 'Kontantinsats klar.', now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000008',
   'Johan & Vera Sund', 15750000, now() - interval '40 days', 'accepterat', 'Accepterat av säljaren.', now() - interval '40 days');

-- ---------------------------------------------------------------------------
-- Uppgifter
-- ---------------------------------------------------------------------------
insert into public.tasks
  (title, description, due_at, priority, status, property_id, contact_id, created_at)
values
  ('Beställ fotografering — Lindstigen 14', 'Boka Emma på Ljusbild. Helst morgonljus, gärna torsdag.',
   (current_date + 1) + time '09:00', 'hog', 'att_gora',
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', now() - interval '4 days'),

  ('Skicka budhistorik till säljaren', 'Familjen Ek vill ha uppdatering varje kväll under budgivningen.',
   current_date + time '20:00', 'hog', 'pagar',
   'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', now() - interval '2 days'),

  ('Ring Sara Nyström om andra visning', '',
   current_date + time '16:00', 'normal', 'att_gora',
   'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', now() - interval '3 days'),

  ('Uppdatera Hemnet-annonsen med nya bilder', 'De nya kvällsbilderna på verandan.',
   (current_date + 3) + time '12:00', 'normal', 'att_gora',
   'a0000000-0000-4000-8000-000000000004', null, now() - interval '2 days'),

  ('Beställ energideklaration', 'Behövs innan publicering.',
   (current_date + 5) + time '10:00', 'lag', 'att_gora',
   'a0000000-0000-4000-8000-000000000003', null, now() - interval '1 day'),

  ('Be Johan & Vera om ett omdöme', 'Gärna citat till hemsidan och Instagram.',
   (current_date - 2) + time '10:00', 'lag', 'klar',
   'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000008', now() - interval '12 days'),

  ('Förbered tillträdesmöte', 'Boka bank, checka likvidavräkning.',
   (current_date + 9) + time '14:00', 'normal', 'att_gora',
   'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000008', now() - interval '6 days');

-- ---------------------------------------------------------------------------
-- Dokument
-- ---------------------------------------------------------------------------
insert into public.documents (name, category, url, size, mime, property_id, created_at)
values
  ('Uppdragsavtal — Katarina Bangata 42.pdf', 'avtal', '', 284000, 'application/pdf',
   'a0000000-0000-4000-8000-000000000001', now() - interval '19 days'),
  ('Besiktningsprotokoll — Bergviksvägen 7.pdf', 'besiktning', '', 1940000, 'application/pdf',
   'a0000000-0000-4000-8000-000000000002', now() - interval '14 days'),
  ('Planritning — Bergviksvägen 7.pdf', 'planritning', '', 620000, 'application/pdf',
   'a0000000-0000-4000-8000-000000000002', now() - interval '24 days'),
  ('Årsredovisning BRF Nyckelpigan 2025.pdf', 'ekonomi', '', 3100000, 'application/pdf',
   'a0000000-0000-4000-8000-000000000001', now() - interval '18 days'),
  ('Fotopaket — Vikvägen 3.zip', 'foto', '', 48300000, 'application/zip',
   'a0000000-0000-4000-8000-000000000004', now() - interval '39 days');

-- ---------------------------------------------------------------------------
-- Anteckningar
-- ---------------------------------------------------------------------------
insert into public.notes (body, property_id, contact_id, created_at)
values
  ('Säljaren vill absolut inte ha visning söndag förmiddag. Boka lördag istället.',
   'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', now() - interval '7 days'),
  ('Sara nämnde att hon kan tänka sig att gå upp till 5,3 mkr om köket får behållas.',
   'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', now() - interval '3 days');

-- ---------------------------------------------------------------------------
-- Mallar
-- ---------------------------------------------------------------------------
insert into public.templates (title, category, body, created_at)
values
  ('Annonstext — lägenhet', 'annons',
   E'Välkommen till {{adress}} — en {{rum}} rums {{typ}} om {{boarea}} kvm i hjärtat av {{omrade}}.\n\nHär möts du av {{karaktarsdrag}}. Bostaden har {{hojdpunkter}} och ett läge som gör vardagen enkel: {{narhet}}.\n\nUtgångspris {{pris}} kr. Varmt välkommen på visning!\n\nJulia Stille · Stille Mäkleri · 070-123 45 67',
   now() - interval '60 days'),

  ('Mail — tack efter visning', 'mail',
   E'Hej {{namn}},\n\nTack för att du kom på visningen av {{adress}} idag — det var trevligt att träffas!\n\nBifogar objektsbeskrivning och planritning. Har du några frågor om föreningen, driftkostnaden eller processen framåt så ringer du mig direkt på 070-123 45 67.\n\nOm du vill anmäla intresse inför budgivningen svarar du bara på det här mailet.\n\nVarma hälsningar,\nJulia Stille\nRegistrerad fastighetsmäklare · Stille Mäkleri',
   now() - interval '60 days'),

  ('SMS — påminnelse om visning', 'sms',
   'Hej {{namn}}! Påminnelse om visningen av {{adress}} {{tid}}. Ses vi där? Hälsningar Julia, Stille Mäkleri.',
   now() - interval '60 days'),

  ('Checklista — inför visning', 'checklista',
   E'☐ Tänd alla lampor, även i garderober\n☐ Lufta 15 min innan\n☐ Objektsbeskrivningar (20 st) + planritningar\n☐ Skoskydd och skohorn\n☐ Blommor i vardagsrummet\n☐ Dölj personliga foton och post\n☐ Ladda telefonen, öppna intresselistan\n☐ Kolla parkeringsläget och skylta vägen',
   now() - interval '60 days'),

  ('Instagram — nytt objekt', 'social',
   E'NYTT PÅ MARKNADEN ✦ {{adress}}\n\n{{rum}} rum · {{boarea}} kvm · {{omrade}}\n{{en_mening_om_kanslan}}\n\nVisning {{visningstid}} — länk i bio.\n\n#mäklare #{{omrade_taggar}} #tillsalu #stillemäkleri',
   now() - interval '60 days');

-- ---------------------------------------------------------------------------
-- AI-konversation
-- ---------------------------------------------------------------------------
insert into public.conversations (id, title, created_at)
values ('b0000000-0000-4000-8000-000000000001', 'Annonstext Katarina Bangata', now() - interval '2 days');

insert into public.messages (conversation_id, role, content, created_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'user',
   'Skriv en annonstext för en sekelskiftestvåa på Södermalm, 58 kvm, fiskbensparkett och balkong mot gård.',
   now() - interval '2 days'),
  ('b0000000-0000-4000-8000-000000000001', 'assistant',
   E'Här kommer ett förslag:\n\n**Sekelskiftets lugn, mitt i stan**\n\nBakom en tung ekport på Katarina Bangata ligger en tvåa som fått åldras vackert. Fiskbensparketten knarrar lite på rätt ställen, stuckaturen är intakt och ljuset faller in genom höga tvåglasfönster hela eftermiddagen.\n\nKöket är varsamt renoverat 2021 och balkongen mot gården är den där platsen där morgonkaffet drar ut på tiden.\n\n58 kvm · 2 rum · Södermalm · Utgångspris 4 950 000 kr',
   now() - interval '2 days' + interval '1 minute');

commit;
