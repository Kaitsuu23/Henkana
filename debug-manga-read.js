require('dotenv').config();
const axios   = require('axios');
const cheerio = require('cheerio');
const BASE_URL = 'https://hentaicop.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const cleanText = t => t ? t.replace(/\s+/g, ' ').trim() : null;

async function run() {
  const url = `${BASE_URL}/manga/living-with-my-teacher/?chapter=chapter-1`;
  const r = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8', Referer: BASE_URL },
    maxRedirects: 5,
  });
  const $ = cheerio.load(r.data);

  // Full reader wrap HTML
  console.log('=== #hc-reader-area HTML (3000) ===');
  console.log($.html($('#hc-reader-area')).substring(0, 3000));

  // All images in reader
  console.log('\n=== All imgs in #hc-reader-area ===');
  $('#hc-reader-area img').each((i, el) => {
    console.log(`  [${i}] src="${$(el).attr('src')?.substring(0,100)}" data-src="${$(el).attr('data-src')?.substring(0,100)}"`);
  });

  // Nav buttons
  console.log('\n=== Nav buttons ===');
  $('[class*="hc-nav"], [class*="nav"], [class*="prev"], [class*="next"]').slice(0,10).each((_, el) => {
    const cls = $(el).attr('class') || '';
    const href = $(el).attr('href') || $(el).find('a').attr('href') || '';
    const text = cleanText($(el).text())?.substring(0, 30);
    console.log(`  class="${cls.substring(0,40)}" href="${href?.substring(0,80)}" text="${text}"`);
  });

  // Chapter title
  console.log('\n=== Chapter title selectors ===');
  ['.hc-chapter-title', '.chapter-title', '[class*="chapter-title"]', '#chapter-title',
   '.hc-read-title', 'h1', 'h2', '.hc-breadcrumb'].forEach(sel => {
    const t = cleanText($(sel).first().text());
    if (t) console.log(`  ${sel}: "${t?.substring(0,60)}"`);
  });

  // Prev/next chapter URLs
  console.log('\n=== Prev/Next chapter ===');
  $('a[href*="chapter"]').each((_, a) => {
    const text = cleanText($(a).text());
    const href = $(a).attr('href');
    if (text && href) console.log(`  "${text?.substring(0,20)}" -> ${href?.substring(0,80)}`);
  });
}

run().then(() => console.log('\n✅ Done')).catch(e => console.error('ERR:', e.message));
