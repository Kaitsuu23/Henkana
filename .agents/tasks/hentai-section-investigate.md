# Investigation Report: Hentai Section "Lihat Semua" Wiring

## Summary Answer

**The "Lihat Semua" link currently only appears for the section whose `section` title contains the word "Baru"** (both in Next.js and Flutter). There is **no "Lihat Semua" for the Hentai section** in either codebase. The backend endpoint `/api/daftar-series?order=update&type=hentai` already exists and is fully supported — nothing needs changing on the backend. All changes are frontend (Next.js) and Flutter only.

---

## 1. Next.js — `client/src/app/page.tsx`

### How sections are iterated (lines 37–90)

`homeData.sections` (array) is iterated with `.map((section, idx) => ...)`. Three render branches exist:

1. **`section.type === 'manga'`** — renders a `MangaCard` grid, **no "Lihat Semua"**.
2. **`section.type === 'anime-tabs'`** — renders `<RecommendationSection>`, **no "Lihat Semua"**.
3. **Default (all other types including anime/hentai sections)** — renders a generic `<section>` with a conditional "Lihat Semua" link.

### Condition that triggers "Lihat Semua" (lines 65–70)

```ts
// line 65
const isBaru = typeof section.section === 'string' && section.section.toLowerCase().includes('baru');

// lines 70–73
{isBaru && (
  <Link href="/terbaru" className="...">
    Lihat Semua <span aria-hidden>→</span>
  </Link>
)}
```

The condition is: `section.section` (the display title string) **contains "baru"** (case-insensitive). Only one section matches this.

### Current "Lihat Semua" href for the 'baru' section (line 71)

```
href="/terbaru"
```

This routes to `/terbaru` → `client/src/app/terbaru/page.tsx`, which calls `getTerbaru(page)` → `fetchAPI('/daftar-series?order=update&page=N')`.

### Does any "Lihat Semua" exist for the Hentai section?

**No.** There is no condition matching the Hentai section title. The `isBaru` check only matches sections whose title contains "baru". The Hentai section (whose `section.section` title would be something like "Hentai" or "Anime Hentai") does not match.

### What needs to change in `page.tsx`

Add an `isHentai` condition parallel to `isBaru`, pointing to a new `/hentai-semua` route (or `/daftar-series?type=hentai&order=update` if a dedicated page is created):

```ts
const isHentai = typeof section.section === 'string' && section.section.toLowerCase().includes('hentai');
```

Then add a second conditional link block for `isHentai` pointing to the new page.

---

## 2. Next.js — `client/src/lib/api.ts`

`getTerbaru` (line 52) already exists:
```ts
export async function getTerbaru(page = 1) {
  return fetchAPI(`/daftar-series?order=update&page=${page}`);
}
```

`getSeries` (lines 56–67) already supports a `type` param via generic params object. A new helper is needed for the hentai listing:

```ts
export async function getHentaiSemua(page = 1) {
  return fetchAPI(`/daftar-series?order=update&type=hentai&page=${page}`);
}
```

### Existing `/terbaru` page — `client/src/app/terbaru/page.tsx`

This page already works for `order=update` (no type filter). It calls `getTerbaru(page)` and renders a paginated `AnimeCard` grid. A new `/hentai-semua` page can be modelled identically, just swapping `getTerbaru` for `getHentaiSemua`.

---

## 3. Flutter — `henkana-flutter/lib/screens/home_screen.dart`

### `_SectionWidget` and `onSeeAll` (lines ~342–355)

Inside `_SectionWidgetState.build()`, `_SectionHeader` is called with:

```dart
_SectionHeader(
  title: widget.section.title,
  onSeeAll: widget.section.title.contains('Baru')
      ? () => Navigator.push(
          context, _fadeRoute(const LatestScreen()))
      : null,
),
```

**The condition is: `section.title.contains('Baru')` (exact case-sensitive string match).** Only sections whose title contains the literal string "Baru" will show "Lihat Semua".

### `_SectionHeader` (lines ~430–480)

`onSeeAll` is a `VoidCallback?`. When non-null, it renders the "Lihat Semua" row with a `GestureDetector`. When null, nothing is rendered:

```dart
if (onSeeAll != null)
  GestureDetector(
    onTap: onSeeAll,
    child: const Row(/* "Lihat Semua" + chevron icon */),
  ),
```

### What needs to change in `home_screen.dart`

The `onSeeAll` condition needs to be extended to also match the Hentai section title. It then must navigate to `LatestScreen` with a `type: 'hentai'` parameter:

```dart
onSeeAll: widget.section.title.contains('Baru')
    ? () => Navigator.push(context, _fadeRoute(const LatestScreen()))
    : widget.section.title.contains('Hentai')   // ← add this
        ? () => Navigator.push(context, _fadeRoute(const LatestScreen(type: 'hentai')))
        : null,
```

---

## 4. Flutter — `henkana-flutter/lib/screens/latest_screen.dart`

### Does it accept a `type` filter parameter?

**No.** `LatestScreen` is declared as:

```dart
class LatestScreen extends StatefulWidget {
  const LatestScreen({super.key});   // ← no type param
```

It creates its own `LatestProvider` instance in `initState` and calls `_provider.fetch()` with no arguments — always `order=update`, no type filter.

### What needs to change

`LatestScreen` needs an optional `type` constructor parameter:

```dart
class LatestScreen extends StatefulWidget {
  final String? type;
  const LatestScreen({super.key, this.type});
```

And pass it through on `fetch()`:

```dart
_provider.fetch(type: widget.type);
```

The AppBar title should also change conditionally (e.g., "Hentai Terbaru" when `type == 'hentai'`).

---

## 5. Flutter — `henkana-flutter/lib/providers/latest_provider.dart`

### Does `fetchDaftarSeries` support a type param? Does `LatestProvider.fetch` accept one?

`LatestProvider.fetch()` currently calls:

```dart
final json = await _api.fetchDaftarSeries(
  page: _currentPage,
  order: 'update',
  // ← no type param passed
);
```

The method signature is `Future<void> fetch({bool refresh = false})` — **no `type` parameter**.

### What needs to change

Add an optional `type` field to `LatestProvider` and wire it through `fetch`:

```dart
String? _type;   // stored so loadMore() can reuse it

Future<void> fetch({bool refresh = false, String? type}) async {
  if (refresh) _type = type;   // only update on fresh fetch
  ...
  final json = await _api.fetchDaftarSeries(
    page: _currentPage,
    order: 'update',
    type: _type,
  );
```

---

## 6. Flutter — `henkana-flutter/lib/services/api_service.dart`

### Signature of `fetchDaftarSeries` (lines ~188–196)

```dart
Future<Map<String, dynamic>> fetchDaftarSeries({
  int page = 1,
  String? status,
  String? type,     // ← already exists
  String? order,
}) async {
  final params = <String, dynamic>{'page': page};
  if (status != null) params['status'] = status;
  if (type != null) params['type'] = type;
  if (order != null) params['order'] = order;
  return await _get('/daftar-series', params: params);
}
```

**`fetchDaftarSeries` already accepts `type` as a named optional parameter.** The API layer is fully ready — no changes needed here.

---

## Conclusions and Recommendations

### What works already
- `ApiService.fetchDaftarSeries` supports `type` — no change needed.
- The backend endpoint `/api/daftar-series?order=update&type=hentai` is already functional.
- The Next.js `getSeries()` helper in `lib/api.ts` already supports arbitrary params including `type`.
- The `/terbaru` page in Next.js is a ready template for a `/hentai-semua` page.

### Required changes (no backend work needed)

| File | Change |
|------|--------|
| `client/src/app/page.tsx` | Add `isHentai` condition alongside `isBaru`; add `<Link href="/hentai-semua">Lihat Semua</Link>` for hentai sections |
| `client/src/lib/api.ts` | Add `getHentaiSemua(page)` → calls `/daftar-series?order=update&type=hentai&page=N` |
| `client/src/app/hentai-semua/page.tsx` | New page, clone of `/terbaru/page.tsx` but calling `getHentaiSemua()`, title "Hentai Terbaru" |
| `client/src/app/hentai-semua/page/[page]/page.tsx` | New paginated sub-route (mirrors `/terbaru/page/[page]`) |
| `henkana-flutter/lib/providers/latest_provider.dart` | Add `String? _type` field; add `type` param to `fetch()`; pass `type: _type` to `fetchDaftarSeries` |
| `henkana-flutter/lib/screens/latest_screen.dart` | Add `final String? type` constructor param; pass to `_provider.fetch(type: widget.type)`; update AppBar title |
| `henkana-flutter/lib/screens/home_screen.dart` | Extend `onSeeAll` condition to also handle `section.title.contains('Hentai')` → navigate to `LatestScreen(type: 'hentai')` |

### Key insight on Flutter title matching
The current Flutter check is `title.contains('Baru')` (case-sensitive). The exact section title string returned by the API needs to be confirmed — if the Hentai section title is exactly `"Hentai"`, then `.contains('Hentai')` will match. If it uses Indonesian text like `"Anime Hentai"`, it still matches. Use `.toLowerCase().contains('hentai')` to be safe.
