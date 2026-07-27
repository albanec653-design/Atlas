# Supabase Storage Setup pre Atlas

## 1. Vytvorenie Storage Buckets

Musíš vytvoriť viacero bucketov pre rôzne typy súborov:

### Bucket 1: `posts` (pre obrázky a videá v príspevkoch)
1. Choď do Supabase dashboard
2. V ľavom menu klikni **Storage**
3. Klikni **"New bucket"**
4. Vyplň:
   - **Name**: `posts`
   - **Public bucket**: Zvoľ **Public**
   - **File size limit**: 50MB
   - **Allowed MIME types**: `image/*,video/*`
5. Klikni **"Create bucket"**

### Bucket 2: `profiles` (pre profilové fotky a cover fotky)
1. Klikni **"New bucket"**
2. Vyplň:
   - **Name**: `profiles`
   - **Public bucket**: Zvoľ **Public**
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/*`
3. Klikni **"Create bucket"**

### Bucket 3: `stories` (pre story obrázky)
1. Klikni **"New bucket"**
2. Vyplň:
   - **Name**: `stories`
   - **Public bucket**: Zvoľ **Public**
   - **File size limit**: 20MB
   - **Allowed MIME types**: `image/*`
3. Klikni **"Create bucket"**

### Bucket 4: `marketplace` (pre marketplace obrázky)
1. Klikni **"New bucket"**
2. Vyplň:
   - **Name**: `marketplace`
   - **Public bucket**: Zvoľ **Public**
   - **File size limit**: 10MB
   - **Allowed MIME types**: `image/*`
3. Klikni **"Create bucket"**

### Bucket 5: `messages` (pre message prílohy)
1. Klikni **"New bucket"**
2. Vyplň:
   - **Name**: `messages`
   - **Public bucket**: Zvoľ **Public**
   - **File size limit**: 25MB
   - **Allowed MIME types**: `image/*`
3. Klikni **"Create bucket"**

## 2. Nastavenie RLS Policies pre každý bucket

### Pre `posts` bucket:

#### Policy 1: Všetci môžu čítať (public)
```sql
CREATE POLICY "posts_select_public"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'posts' );
```

#### Policy 2: Autentifikovaní môžu nahrávať
```sql
CREATE POLICY "posts_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1] );
```

#### Policy 3: Používateľ môže mazať svoje súbory
```sql
CREATE POLICY "posts_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1] );
```

### Pre `profiles` bucket:

#### Policy 1: Všetci môžu čítať (public)
```sql
CREATE POLICY "profiles_select_public"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'profiles' );
```

#### Policy 2: Autentifikovaní môžu nahrávať
```sql
CREATE POLICY "profiles_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1] );
```

#### Policy 3: Používateľ môže mazať svoje súbory
```sql
CREATE POLICY "profiles_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1] );
```

### Pre `stories` bucket:

#### Policy 1: Všetci môžu čítať (public)
```sql
CREATE POLICY "stories_select_public"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'stories' );
```

#### Policy 2: Autentifikovaní môžu nahrávať
```sql
CREATE POLICY "stories_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1] );
```

#### Policy 3: Používateľ môže mazať svoje súbory
```sql
CREATE POLICY "stories_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1] );
```

### Pre `marketplace` bucket:

#### Policy 1: Všetci môžu čítať (public)
```sql
CREATE POLICY "marketplace_select_public"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'marketplace' );
```

#### Policy 2: Autentifikovaní môžu nahrávať
```sql
CREATE POLICY "marketplace_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1] );
```

#### Policy 3: Používateľ môže mazať svoje súbory
```sql
CREATE POLICY "marketplace_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1] );
```

### Pre `messages` bucket:

#### Policy 1: Autentifikovaní môžu čítať
```sql
CREATE POLICY "messages_select_auth"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'messages' );
```

#### Policy 2: Autentifikovaní môžu nahrávať
```sql
CREATE POLICY "messages_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1] );
```

#### Policy 3: Používateľ môže mazať svoje súbory
```sql
CREATE POLICY "messages_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1] );
```

## 3. URL formát

Súbory budú dostupné na:
```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/{BUCKET_NAME}/{USER_ID}/{FILE_NAME}
```

Príklady:
- `https://xyz.supabase.co/storage/v1/object/public/posts/123e4567-e89b/photo.jpg`
- `https://xyz.supabase.co/storage/v1/object/public/profiles/123e4567-e89b/avatar.jpg`

## 4. Overenie

Skontroluj v Storage dashboard:
- Všetky 5 bucketov existujú
- Každý má 3 politiky (SELECT, INSERT, DELETE)
- Sú označené ako "Public"

## Hotovo!

Storage je pripravený na reálne nahrávanie všetkých typov súborov.
