/* 言語別 静的ページ生成: 各言語のテキストを焼き込んだ /xx/index.html を出力し、hreflang で相互リンク。
   使い方: node build-i18n.mjs <出力ルート>  (例: node build-i18n.mjs /tmp/bwc-demo) */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || join(HERE, 'dist');
const ORIGIN = 'https://boardwalkcapitalinc.com';
// 生成対象(root=ja)。言語メニューと完全一致させる(メニューにあるのに404を防ぐ)+zh-Hant。
const LANGS = ['en','zh','ko','it','fr','es','de','pt','nl','ru','ar','hi','zh-Hant'];
const OG_LOCALE = { en:'en_US', zh:'zh_CN', 'zh-Hant':'zh_TW', ko:'ko_KR', it:'it_IT', fr:'fr_FR', es:'es_ES', de:'de_DE', pt:'pt_BR', nl:'nl_NL', ru:'ru_RU', ar:'ar_AR', hi:'hi_IN' };

let src = readFileSync(join(HERE, 'index.html'), 'utf8');
// 冪等化: 既存のhreflang注入を除去(sourceが過去のビルド出力を兼ねても重複しない)。canonicalは残す。
src = src.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g, '');
// 冪等化: 前回焼き込んだ沿革/登壇のカードを空に戻す(ルートにも焼くようになったため二重焼きを防ぐ)
src = src.replace(/(<div class="news-list" id="newsList"[^>]*>)[\s\S]*?(<\/div>\s*<button)/, '$1$2');
src = src.replace(/(<div class="news-list ev-list" id="eventList"[^>]*>)[\s\S]*?(<\/div>\s*<button)/, '$1$2');
src = src.replace(/(<div class="pcompanies" id="pcompanies"[^>]*>)[\s\S]*?(<\/div><\/div>\s*<\/section>)/, '$1$2');
const m = src.match(/const I18N=[\s\S]*?const SUPPORTED=Object\.keys\(I18N\);/)[0];
const I18N = new Function(m + ';return I18N;')();
const NEWS = new Function(src.match(/const NEWS=\[[\s\S]*?\];/)[0] + ';return NEWS;')();
const PCO = new Function(src.match(/const PCO=\[[\s\S]*?\n\];/)[0] + ';return PCO;')();
const CURL = new Function(src.match(/const CURL=\{[\s\S]*?\};/)[0] + ';return CURL;')();
const PSLUG = new Function(src.match(/const PSLUG=\{[\s\S]*?\};/)[0] + ';return PSLUG;')();
const EVENTS = new Function(src.match(/const EVENTS=\[[\s\S]*?\n\];/)[0] + ';return EVENTS;')();
const en = I18N.en;
const T = (lc, k) => (I18N[lc] && I18N[lc][k] != null) ? I18N[lc][k] : en[k];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripTags = s => (s || '').replace(/<[^>]+>/g, '');

// data-i18n のキー一覧
const keys = [...new Set([...src.matchAll(/data-i18n="([^"]+)"/g)].map(x => x[1]))];
const phKeys = [...new Set([...src.matchAll(/data-i18n-ph="([^"]+)"/g)].map(x => x[1]))];

function renderNews(lc) {
  return NEWS.map(n => {
    const cat = (n.cat && (n.cat[lc] || n.cat.en)) || '';
    const ttl = (n.title[lc] || n.title.en);
    const thumb = n.logo ? `<div class="thumb logo"><img src="/${n.logo}" alt="" loading="lazy" decoding="async"></div>` : n.img ? `<div class="thumb"><img src="/${n.img}" alt="" loading="lazy" decoding="async"></div>` : '';
    const hasImg = n.logo || n.img;
    return `<div class="news-card${hasImg ? '' : ' no-img'}"><div class="body"><div class="meta"><span class="date">${n.date}</span><span class="cat">${cat}</span></div><div class="ttl">${ttl}</div></div>${thumb}</div>`;
  }).join('');
}

function renderPartners(lc, rootRelative) {
  return PCO.map(c => {
    const biz = c[2] ? (c[2][lc] || c[2].en || '') : '';
    const est = c[4] ? c[4].replace(/年/, '/').replace(/月.*$/, '') : '';
    const meta = lc === 'ja'
      ? [c[3], c[4] ? '設立 ' + c[4] : ''].filter(Boolean).join('　/　')
      : (est ? 'Founded ' + est : '');
    const inner = `<span class="nm">${c[0]}</span>${c[1] ? `<small>${c[1]}</small>` : ''}${biz ? `<span class="biz">${biz}</span>` : ''}${meta ? `<span class="meta2">${meta}</span>` : ''}`;
    const sl = PSLUG[c[0]];
    return sl ? `<a class="pc" href="/portfolio/${sl}/">${inner}<span class="ext">\u2192</span></a>` : `<div class="pc">${inner}</div>`;
  }).join('');
}

function renderEvents(lc) {
  return EVENTS.map(n => {
    const ttl = (n.title[lc] || n.title.en);
    const a = ttl.replace(/"/g, '&quot;');
    const thumb = n.img ? `<div class="thumb"><img src="/${n.img}" alt="${a}" loading="lazy" decoding="async"></div>` : '';
    const cat = (n.cat && (n.cat[lc] || n.cat.en)) || '';
    const cls = 'news-card ev-card' + (n.img ? '' : ' no-img');
    const body = `<div class="body"><div class="meta"><span class="date">${n.date}</span>${cat ? `<span class="cat">${cat}</span>` : ''}</div><div class="ttl">${ttl}</div>${n.url ? '<span class="ext">Detail →</span>' : ''}</div>`;
    return n.url
      ? `<a class="${cls}" href="${n.url}" target="_blank" rel="noopener">${body}${thumb}</a>`
      : `<div class="${cls}">${body}${thumb}</div>`;
  }).join('');
}

function hreflang() {
  let out = `<link rel="alternate" hreflang="ja" href="${ORIGIN}/" />\n`;
  for (const lc of LANGS) out += `<link rel="alternate" hreflang="${lc}" href="${ORIGIN}/${lc}/" />\n`;
  out += `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />`;
  return out;
}

function build(lc, isRoot) {
  let html = src;
  if (isRoot) {
    // ルートは日本語。i18nの置換は不要だが、沿革/登壇はJS任せにせず日本語で焼き込む
    // (英語ページだけ本文が厚い状態だと、日本語クエリでルートが不利になる)
    html = html.replace(/(<div class="news-list" id="newsList"[^>]*>)(\s*)(<\/div>)/, (mm, a, sp, c) => a + renderNews('ja').replace(/src="\//g, 'src="') + c);
    html = html.replace(/(<div class="news-list ev-list" id="eventList"[^>]*>)(\s*)(<\/div>)/, (mm, a, sp, c) => a + renderEvents('ja').replace(/src="\//g, 'src="') + c);
    html = html.replace(/(<div class="pcompanies" id="pcompanies"[^>]*>)(\s*)(<\/div><\/div>\s*<\/section>)/, (mm, a, sp, c) => a + renderPartners('ja') + c);
  }
  if (!isRoot) {
    // 各data-i18n要素の内側を当該言語に置換(全出現)
    for (const k of keys) {
      const v = T(lc, k); if (v == null) continue;
      const re = new RegExp('(<([a-zA-Z0-9]+)\\b[^>]*\\sdata-i18n="' + esc(k) + '"[^>]*>)([\\s\\S]*?)(</\\2>)', 'g');
      html = html.replace(re, (mm, open, tag, inner, close) => open + v + close);
    }
    // placeholder
    for (const k of phKeys) {
      const v = T(lc, k); if (v == null) continue;
      html = html.replace(new RegExp('(data-i18n-ph="' + esc(k) + '"[^>]*?placeholder=")[^"]*(")'), (mm, a, b) => a + v + b);
      html = html.replace(new RegExp('(placeholder=")[^"]*("[^>]*?data-i18n-ph="' + esc(k) + '")'), (mm, a, b) => a + v + b);
    }
    // News事前描画
    html = html.replace(/(<div class="news-list" id="newsList"[^>]*>)(\s*)(<\/div>)/, (mm, a, s, c) => a + renderNews(lc) + c);
    // Event事前描画
    html = html.replace(/(<div class="news-list ev-list" id="eventList"[^>]*>)(\s*)(<\/div>)/, (mm, a, s, c) => a + renderEvents(lc) + c);
    // 投資先グリッド事前描画
    html = html.replace(/(<div class="pcompanies" id="pcompanies"[^>]*>)(\s*)(<\/div><\/div>\s*<\/section>)/, (mm, a, s, c) => a + renderPartners(lc) + c);
    // <html lang> と data-lang(アラビア語はRTL)
    html = html.replace(/<html lang="ja">/, `<html lang="${lc}" data-lang="${lc}"${lc === 'ar' ? ' dir="rtl"' : ''}>`);
    // og:locale を言語に合わせる
    html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, (mm, a, b) => a + (OG_LOCALE[lc] || 'en_US') + b);
    // サブフォルダから参照できるよう画像等の相対パスを絶対化(#アンカーは温存)
    // href="img/..."(ヒーロー画像のpreload)も絶対化。/en/ 等から /en/img/... を読みに行って404になっていた
    html = html.replace(/(src|href)="img\//g, '$1="/img/').replace(/url\((['"]?)img\//g, 'url($1/img/');
    // 文字体系別Webフォントを該当言語ページのみ注入(端末フォント任せ=豆腐/フォント混在を防ぐ。他言語ページは重くしない)。
    // CJK(ko/zh/zh-Hant)は基底CSSに書体指定が無いので<style>も注入。ar/hiは基底CSSに既定ありのためリンクのみ。
    const PERLANG = { ko:['Noto Sans KR','400;500;700;900'], zh:['Noto Sans SC','400;500;700;900'], 'zh-Hant':['Noto Sans TC','400;500;700;900'], ar:['Noto Sans Arabic','400;500;700'], hi:['Noto Sans Devanagari','400;500;700'] };
    if (PERLANG[lc]) {
      const [fam, wght] = PERLANG[lc];
      html = html.replace('&display=swap', `&family=${fam.replace(/ /g, '+')}:wght@${wght}&display=swap`);
      if (lc === 'ko' || lc === 'zh' || lc === 'zh-Hant') {
        const ov = `<style>html[lang="${lc}"] body,html[lang="${lc}"] .jp{font-family:"${fam}","Noto Sans JP",sans-serif}</style>`;
        html = html.replace('</head>', ov + '\n</head>');
      }
    }
  }
  // title / description(タイトルも各言語のヒーローコピーで言語化)
  const desc = stripTags(T(lc, 'hero.lead'));
  // 英語ページは英文の正式社名で始める。旧サイトが "boardwalk capital" の検索で勝っている理由が
  // h1="Boardwalk Capital Inc." の完全一致だったため、こちらも社名を先頭に置く。
  // 日本語(ルート)のタイトルは1位を取れている形なので触らない。
  const title = (lc === 'ja')
    ? 'BOARDWALK CAPITAL｜ボードウォーク・キャピタル株式会社（Boardwalk Capital Inc.）'
    : (lc === 'en')
      ? 'Boardwalk Capital Inc. | Advisory · Incubation · Angel Investment'
      : `BOARDWALK CAPITAL | ${stripTags(T(lc, 'hero.t1'))} ${stripTags(T(lc, 'hero.t2'))}`.replace(/\s+/g, ' ').trim();
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, (mm, a, b) => a + desc + b);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, (mm, a, b) => a + desc + b);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, (mm, a, b) => a + desc + b);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, (mm, a, b) => a + title + b);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, (mm, a, b) => a + title + b);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, (mm, a, b) => a + (isRoot ? ORIGIN + '/' : ORIGIN + '/' + lc + '/') + b);
  // canonical + hreflang
  const canonical = isRoot ? `${ORIGIN}/` : `${ORIGIN}/${lc}/`;
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />\n${hreflang()}`);
  // 出力
  const dir = isRoot ? OUT : join(OUT, lc);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  return { lc: isRoot ? 'ja(root)' : lc, bytes: html.length };
}

// sitemap
function sitemap() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [`${ORIGIN}/`, ...LANGS.map(l => `${ORIGIN}/${l}/`)];
  const body = urls.map(u => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${u === ORIGIN + '/' ? '1.0' : '0.8'}</priority></url>`).join('\n');
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, 'utf8');
}

const results = [build('ja', true), ...LANGS.map(l => build(l, false))];
sitemap();
console.log('生成完了:');
results.forEach(r => console.log('  ', r.lc, r.bytes, 'bytes'));
console.log('  sitemap.xml (', 1 + LANGS.length, 'URL )');
