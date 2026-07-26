# Supabase Storage Setup pre Atlas

## 1. Vytvorenie Storage Bucket

1. Choď do Supabase dashboard
2. V ľavom menu klikni **Storage**
3. Klikni **"New bucket"**
4. Vyplň:
   - **Name**: `posts`
   - **Public bucket**: Zvoľ **Public** (potrebujeme pre obrázky v príspevkoch)
   - **File size limit**: 5MB (alebo viac podľa potreby)
   - **Allowed MIME types**: `image/*`
5. Klikni **"Create bucket"**

## 2. Nastavenie RLS Policies pre Storage Bucket

Po vytvorení bucketu musíme nastaviť bezpečnostné politiky:

1. V Storage dashboard klikni na bucket `posts`
2. Klikni na **"Policies"** tab
3. Pridaj nasledujúce politiky:

### Policy 1: Všetci môžu čítať obrázky (public)

```sql
-- Name: posts_select_public
-- Allowed operations: SELECT
-- Target: All roles
-- Using expression: true

CREATE POLICY "posts_select_public"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'posts' );
```

### Policy 2: Autentifikovaní používatelia môžu nahrávať

```sql
-- Name: posts_insert_auth
-- Allowed operations: INSERT
-- Target: Authenticated
-- Using expression: auth.uid()::text = (storage.foldername(name))[1]

CREATE POLICY "posts_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1] );
```

### Policy 3: Používateľ môže mazať svoje obrázky

```sql
-- Name: posts_delete_own
-- Allowed operations: DELETE
-- Target: Authenticated
-- Using expression: auth.uid()::text = (storage.foldername(name))[1]

CREATE POLICY "posts_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1] );
```

## 3. Overenie

Skontroluj v Storage dashboard:
- Bucket `posts` existuje
- Má 3 politiky (SELECT, INSERT, DELETE)
- Je označený ako "Public"

## 4. URL formát

Obrázky budú dostupné na:
```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/posts/USER_ID/FILE_NAME
```

Príklad:
```
https://xyz.supabase.co/storage/v1/object/public/posts/123e4567-e89b-12d3-a456-426614174000/photo.jpg
```

## Hotovo!

Storage je pripravený na nahrávanie obrázkov do príspevkov.
