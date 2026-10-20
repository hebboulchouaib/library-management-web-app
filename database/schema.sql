-- 1. Tables
-- Every row carries a user_id, filled in automatically with the id of the logged-in user.
create table public.etudiants (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom        text not null,
  prenom     text not null,
  email      text not null,
  telephone  text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.livres (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titre      text not null,
  auteur     text not null,
  categorie  text not null,
  annee      integer not null check (annee >= 0),
  quantite   integer not null default 0 check (quantite >= 0),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

-- The foreign keys include user_id, so a loan can never point to another user's book or student.
-- Deleting a book or a student keeps the loan as history (the reference becomes null).
-- The loan status (en cours, rendu, en retard) is computed by the app from the dates.
create table public.emprunts (
  id                    bigint generated always as identity primary key,
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  etudiant_id           bigint,
  livre_id              bigint,
  date_emprunt          date not null,
  date_retour_prevue    date not null,
  date_retour_effective date,
  created_at            timestamptz not null default now(),
  check (date_retour_prevue >= date_emprunt),
  foreign key (etudiant_id, user_id) references public.etudiants (id, user_id) on delete set null (etudiant_id),
  foreign key (livre_id, user_id)    references public.livres (id, user_id)    on delete set null (livre_id)
);

create index on public.etudiants (user_id);
create index on public.livres (user_id);
create index on public.emprunts (user_id);
create index on public.emprunts (etudiant_id);
create index on public.emprunts (livre_id);
-- 2. Row level security: each user can only read and write their own rows
alter table public.etudiants enable row level security;
alter table public.livres    enable row level security;
alter table public.emprunts  enable row level security;

revoke all on public.etudiants, public.livres, public.emprunts from anon;
grant select, insert, update, delete on public.etudiants to authenticated;
grant select, insert, update, delete on public.livres    to authenticated;
grant select, insert, update, delete on public.emprunts  to authenticated;

create policy "etudiants: chacun ses donnees" on public.etudiants
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "livres: chacun ses donnees" on public.livres
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "emprunts: chacun ses donnees" on public.emprunts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- 3. Borrow and return as single transactions
create or replace function public.emprunter(
  p_etudiant_id bigint, p_livre_id bigint, p_date_emprunt date, p_duree integer
) returns public.emprunts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.emprunts;
begin
  if p_duree < 1 then
    raise exception 'La durée doit être d''au moins 1 jour.';
  end if;

  update public.livres
     set quantite = quantite - 1
   where id = p_livre_id and quantite > 0;
  if not found then
    raise exception 'Ce livre n''est plus disponible.';
  end if;

  insert into public.emprunts (etudiant_id, livre_id, date_emprunt, date_retour_prevue)
  values (p_etudiant_id, p_livre_id, p_date_emprunt, p_date_emprunt + p_duree)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.rendre(p_emprunt_id bigint, p_date date default current_date)
returns public.emprunts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.emprunts;
begin
  update public.emprunts
     set date_retour_effective = p_date
   where id = p_emprunt_id and date_retour_effective is null
  returning * into v_row;
  if not found then
    raise exception 'Cet emprunt est introuvable ou déjà rendu.';
  end if;

  if v_row.livre_id is not null then
    update public.livres set quantite = quantite + 1 where id = v_row.livre_id;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.emprunter(bigint, bigint, date, integer) from public, anon;
revoke execute on function public.rendre(bigint, date) from public, anon;
grant  execute on function public.emprunter(bigint, bigint, date, integer) to authenticated;
grant  execute on function public.rendre(bigint, date) to authenticated;

-- 4. Ping: a harmless call used by the scheduled keep-alive job
create or replace function public.ping() returns text
language sql security invoker set search_path = ''
as $$ select 'ok'::text $$;

revoke execute on function public.ping() from public;
grant  execute on function public.ping() to anon, authenticated;

notify pgrst, 'reload schema';
