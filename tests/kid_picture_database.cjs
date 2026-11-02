// Runs supabase/migrations/20261102120000_set_own_avatar.sql in PGlite with simulated
// Supabase roles. Nothing touches a remote database. Pass PGLITE_MODULE to use another install.
const {PGlite}=require(process.env.PGLITE_MODULE||'../.job/db-tools/node_modules/@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key,email text unique,updated_at timestamptz);
    create table auth.identities(user_id uuid references auth.users(id) on delete cascade,provider text,identity_data jsonb,updated_at timestamptz);
    create table auth.sessions(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),created_at timestamptz default now(),updated_at timestamptz default now(),not_after timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;`);
  const files=fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')&&x<'20261021045745').sort();
  for(const f of files.filter(x=>x<'20261019201539'))await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
  const master='10000000-0000-0000-0000-000000000001',kid='10000000-0000-0000-0000-000000000002',other='10000000-0000-0000-0000-000000000003',adult='10000000-0000-0000-0000-000000000004';
  await db.query('insert into auth.users(id) values($1),($2),($3),($4)',[master,kid,other,adult]);
  await db.exec('set role service_role');
  await db.query("select public.provision_account($1,'test','Master','grownup',null)",[master]);
  await db.query("select public.provision_account($1,'sally','Sally','child',$2)",[kid,master]);
  await db.query("select public.provision_account($1,'jane','Jane','child',$2)",[other,master]);
  await db.query("select public.provision_account($1,'plain','Plain','grownup',null)",[adult]);
  await db.exec('reset role');
  for(const f of files.filter(x=>x>='20261019201539'))await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/20261102120000_set_own_avatar.sql','utf8'));
  const session=async id=>{
    const row=(await db.query("insert into auth.sessions(user_id,not_after) values($1,now()+interval '1 day') returning id",[id])).rows[0];
    await db.query('select private.initialize_session_limit($1)',[row.id]);return row.id;
  };
  const sessions=Object.fromEntries(await Promise.all([master,kid,adult].map(async id=>[id,await session(id)])));
  const as=async(id,sid=sessions[id])=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({sub:id,session_id:sid})]);await db.exec('set role authenticated');};
  const row=async id=>{await db.exec('reset role');return (await db.query('select handle,display_name,role,is_master,progress_version,avatar from public.profiles where id=$1',[id])).rows[0];};
  const set=value=>db.query('select public.set_own_avatar($1) as saved',[value]);
  const picture='data:image/jpeg;base64,/9j/4AAQ';

  const before={kid:await row(kid),other:await row(other),master:await row(master),adult:await row(adult)};
  await as(kid);assert.equal((await set(picture)).rows[0].saved,picture,'Child saves own picture');
  assert.deepEqual(await row(kid),{...before.kid,avatar:picture},'Only the avatar column changed');
  assert.deepEqual(await row(other),before.other,'Other children are untouched');
  await as(kid);await assert.rejects(db.query("update public.profiles set avatar='⭐' where id=$1",[kid]),/permission denied/,'Direct profile writes stay closed');
  await assert.rejects(set('https://example.com/x.png'),/profiles_avatar_check|check constraint/,'Avatar format rule still applies');
  await assert.rejects(set(null),/null value/);
  await assert.rejects(db.query('select public.set_own_avatar($1,$2)',[other,picture]),/does not exist/,'There is no target argument');
  await as(master);await assert.rejects(set(picture),/Child login required/,'Master is refused');
  assert.deepEqual(await row(master),before.master,'Master row unchanged');
  await as(adult);await assert.rejects(set(picture),/Child login required/,'Grown-ups use their own path');
  assert.deepEqual(await row(adult),before.adult);
  await as(kid,'10000000-0000-0000-0000-00000000ffff');await assert.rejects(set(picture),/Sign in again/,'Ended sessions are refused');
  await db.exec('reset role');await db.exec('set role anon');await assert.rejects(set(picture),/permission denied/,'Anonymous callers are refused');
  console.log('PASS kid picture database (PGlite): own avatar only, master/grown-up/anon/ended session refused, format rule kept');
})().catch(error=>{console.error(error);process.exit(1);});
