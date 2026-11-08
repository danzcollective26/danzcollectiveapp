-- Metadata snapshot of the existing seven public DANZ tables, 2026-11-09.
-- TEST FIXTURE ONLY: never apply this baseline to the existing hosted project.
-- Built from pg_attribute/pg_constraint/pg_policies/pg_indexes/ACL; no records.

CREATE TABLE public."danz_admins" (
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_admins_pkey" PRIMARY KEY (user_id)
);
ALTER TABLE public."danz_admins" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."danz_attendance" (
  "user_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "granted_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_attendance_pkey" PRIMARY KEY (user_id, event_id)
);
ALTER TABLE public."danz_attendance" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."danz_event_access_codes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone,
  "max_uses" integer,
  "used_count" integer DEFAULT 0 NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_event_access_codes_code_hash_key" UNIQUE (code_hash),
  CONSTRAINT "danz_event_access_codes_max_uses_check" CHECK (max_uses IS NULL OR max_uses > 0),
  CONSTRAINT "danz_event_access_codes_pkey" PRIMARY KEY (id),
  CONSTRAINT "danz_event_access_codes_used_count_check" CHECK (used_count >= 0)
);
ALTER TABLE public."danz_event_access_codes" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."danz_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "danz_events_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  CONSTRAINT "danz_events_title_check" CHECK (length(TRIM(BOTH FROM title)) > 0),
  CONSTRAINT "event_dates_valid" CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
ALTER TABLE public."danz_events" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."danz_photo_reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "photo_id" uuid NOT NULL,
  "reporter_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_photo_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "danz_photo_reports_reason_check" CHECK (length(TRIM(BOTH FROM reason)) >= 5 AND length(TRIM(BOTH FROM reason)) <= 2000),
  CONSTRAINT "danz_photo_reports_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text]))
);
ALTER TABLE public."danz_photo_reports" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."danz_photos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_photos_pkey" PRIMARY KEY (id),
  CONSTRAINT "danz_photos_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'quarantined'::text])),
  CONSTRAINT "danz_photos_storage_path_key" UNIQUE (storage_path)
);
ALTER TABLE public."danz_photos" ENABLE ROW LEVEL SECURITY;

CREATE TABLE public."danz_profiles" (
  "user_id" uuid NOT NULL,
  "display_name" text,
  "instagram_handle" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "danz_profiles_pkey" PRIMARY KEY (user_id)
);
ALTER TABLE public."danz_profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."danz_admins" ADD CONSTRAINT "danz_admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."danz_attendance" ADD CONSTRAINT "danz_attendance_event_id_fkey" FOREIGN KEY (event_id) REFERENCES danz_events(id) ON DELETE CASCADE;
ALTER TABLE public."danz_attendance" ADD CONSTRAINT "danz_attendance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."danz_event_access_codes" ADD CONSTRAINT "danz_event_access_codes_event_id_fkey" FOREIGN KEY (event_id) REFERENCES danz_events(id) ON DELETE CASCADE;
ALTER TABLE public."danz_photo_reports" ADD CONSTRAINT "danz_photo_reports_photo_id_fkey" FOREIGN KEY (photo_id) REFERENCES danz_photos(id) ON DELETE CASCADE;
ALTER TABLE public."danz_photo_reports" ADD CONSTRAINT "danz_photo_reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."danz_photos" ADD CONSTRAINT "danz_photos_event_id_fkey" FOREIGN KEY (event_id) REFERENCES danz_events(id) ON DELETE CASCADE;
ALTER TABLE public."danz_profiles" ADD CONSTRAINT "danz_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX danz_attendance_event_idx ON public.danz_attendance USING btree (event_id);
CREATE INDEX danz_event_codes_event_idx ON public.danz_event_access_codes USING btree (event_id);
CREATE INDEX danz_photo_reports_photo_idx ON public.danz_photo_reports USING btree (photo_id);
CREATE INDEX danz_photos_event_idx ON public.danz_photos USING btree (event_id);

CREATE POLICY "admins can see own membership" ON "public"."danz_admins" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "read own attendance" ON "public"."danz_attendance" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "read attended published events" ON "public"."danz_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM danz_attendance a
  WHERE ((a.event_id = danz_events.id) AND (a.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "read own reports" ON "public"."danz_photo_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((reporter_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "report accessible published photo" ON "public"."danz_photo_reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((reporter_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM ((danz_photos p
     JOIN danz_events e ON ((e.id = p.event_id)))
     JOIN danz_attendance a ON ((a.event_id = p.event_id)))
  WHERE ((p.id = danz_photo_reports.photo_id) AND (p.status = 'published'::text) AND (e.status = 'published'::text) AND (a.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "read attended published photos" ON "public"."danz_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM (danz_attendance a
     JOIN danz_events e ON ((e.id = a.event_id)))
  WHERE ((a.event_id = danz_photos.event_id) AND (a.user_id = ( SELECT auth.uid() AS uid)) AND (e.status = 'published'::text))))));

CREATE POLICY "insert own profile" ON "public"."danz_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "read own profile" ON "public"."danz_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "update own profile" ON "public"."danz_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_admins" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_admins" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_admins" TO "service_role";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_attendance" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_attendance" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_attendance" TO "service_role";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_event_access_codes" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_event_access_codes" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_event_access_codes" TO "service_role";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_events" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_events" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_events" TO "service_role";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_photo_reports" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_photo_reports" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_photo_reports" TO "service_role";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_photos" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_photos" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_photos" TO "service_role";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_profiles" TO "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_profiles" TO "authenticated";
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public."danz_profiles" TO "service_role";

