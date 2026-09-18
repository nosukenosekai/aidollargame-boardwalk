/* 下層ページ生成（日本語・英語）
   日本語: /about/ /message/ /portfolio/ /history/ /events/ と /portfolio/<slug>/（33社）
   英語  : /en/about/ … /en/portfolio/<slug>/ …（同じ構成）

   トップ（index.html / en/index.html）を元に、そのページで見せるセクションだけを残した独立ページを書き出す。
   デザイン・スクリプト・データはトップと共通なので、トップを直せば下層も揃う。

   なぜ作るか(2026-09-18):
   「boardwalk capital」「boardwalkcapitalinc」で旧さくらサイトが1位を取り続けている。
   旧サイトは About / CEO Message / Partners / Event と投資先34社の詳細ページまで独立URLを持ち、
   Googleはそれをサイトリンク(検索結果の下に並ぶ小見出し)として出している。
   こちらは1ページ構成で、Googleに見せられるページが実質1枚しかなかった。
   英語名での検索に対しては、英語のページ群(/en/...)も同じ厚みで持つ。

   使い方: node build-i18n.mjs . && node build-pages.mjs .
   (build-i18n が沿革・登壇・投資先をトップと各言語ページに焼き込んだ後に実行する) */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || HERE;
const ORIGIN = 'https://boardwalkcapitalinc.com';
const CO = 'ボードウォーク・キャピタル株式会社';
const CO_EN = 'Boardwalk Capital Inc.';
const LANGS_OTHER = ['en', 'zh', 'ko', 'it', 'fr', 'es', 'de', 'pt', 'nl', 'ru', 'ar', 'hi', 'zh-Hant'];

/* ページの定義。ja と en で文言を持つ */
const PAGES = [
  {
    slug: 'about', label: 'ABOUT',
    sections: ['philosophy', 'track', 'services', 'team', 'contact'],
    ja: {
      h1: '会社概要', title: `会社概要｜${CO}（${CO_EN}）`,
      desc: `${CO}（${CO_EN}）の会社概要。2016年7月設立、代表取締役社長 那珂通雅。アドバイザリー・インキュベーション・エンジェル投資を通じて、挑戦する企業と人材を支援しています。`,
      lead: '2016年の設立以来、アドバイザリー・インキュベーション・エンジェル投資の3つの領域で、国内外の企業と起業家を支援しています。',
    },
    en: {
      h1: 'About Us', title: `About | ${CO_EN}`,
      desc: `${CO_EN} (${CO}) is a Tokyo-based investment firm founded in July 2016 by Michimasa Naka. We support ambitious companies and entrepreneurs through advisory, incubation and angel investment.`,
      lead: 'Since our founding in 2016, we have supported companies and entrepreneurs in Japan and abroad through advisory, incubation and angel investment.',
    },
  },
  {
    slug: 'message', label: 'CEO MESSAGE',
    sections: ['message', 'contact'],
    ja: {
      h1: '代表メッセージ', title: `代表メッセージ｜${CO}（${CO_EN}）`,
      desc: `${CO} 代表取締役社長 那珂通雅からのメッセージ。「世界で通用する日本人を、一人でも多く創出したい。」35年以上国際金融の第一線で培った経験をもとに、挑戦する企業と人材を支援しています。`,
      lead: '代表取締役社長 那珂通雅より、ご挨拶を申し上げます。',
    },
    en: {
      h1: 'CEO Message', title: `CEO Message | ${CO_EN}`,
      desc: `A message from Michimasa Naka, President & CEO of ${CO_EN}. Drawing on more than 35 years at the front line of international finance, he supports ambitious companies and people.`,
      lead: 'A message from our President & CEO, Michimasa Naka.',
    },
  },
  {
    slug: 'portfolio', label: 'PARTNERS',
    sections: ['partners', 'movies', 'contact'],
    ja: {
      h1: '投資先・パートナー企業', title: `投資先・パートナー企業｜${CO}（${CO_EN}）`,
      desc: `${CO}の投資先・パートナー企業33社。ベクトル、ビジョン、アイスタイル（@cosme）、ジーニー、eWeLL、GLM、FiNC Technologies ほか。各社の事業内容・代表者・設立年を掲載しています。`,
      lead: 'ボードウォーク・キャピタルが出資・支援してきた33社です。各社の事業内容・代表者・設立年を掲載しています。',
    },
    en: {
      h1: 'Portfolio & Partners', title: `Portfolio & Partners | ${CO_EN}`,
      desc: `The 33 portfolio and partner companies of ${CO_EN}, including VECTOR, Vision, istyle (@cosme), GENIEE, eWeLL, GLM and FiNC Technologies.`,
      lead: `The 33 companies ${CO_EN} has invested in and supported, with each company's business and founding year.`,
    },
  },
  {
    slug: 'history', label: 'HISTORY',
    sections: ['news', 'contact'], hideHead: ['news'], showAll: ['newsList'],
    ja: {
      h1: '沿革', title: `沿革｜${CO}（${CO_EN}）`,
      desc: `${CO}と創業者・那珂通雅の沿革。1989年ソロモン・ブラザーズ入社、シティグループ証券取締役副社長、ストームハーバー証券設立を経て、2016年に当社を設立。`,
      lead: '創業者・那珂通雅の国際金融でのキャリアから、当社の設立、現在までの歩みです。',
    },
    en: {
      h1: 'History', title: `History | ${CO_EN}`,
      desc: `The history of ${CO_EN} and its founder Michimasa Naka: Salomon Brothers (1989), Deputy President of Citigroup Global Markets Japan, founder of Storm Harbour Securities, and the founding of ${CO_EN} in 2016.`,
      lead: `From our founder's career in international finance to the founding of ${CO_EN} and today.`,
    },
  },
  {
    slug: 'events', label: 'EVENTS',
    sections: ['event', 'contact'], hideHead: ['event'], showAll: ['eventList'],
    ja: {
      h1: '登壇・イベント', title: `登壇・イベント｜${CO}（${CO_EN}）`,
      desc: `創業者・那珂通雅の講演・登壇の記録。TEAMZ SUMMIT 2026、慶應義塾大学、DLA PIPER×Forbes JAPAN 海外進出戦略セミナー、経済界倶楽部ほか。`,
      lead: '創業者・那珂通雅が登壇・モデレーター・講評を務めたカンファレンスや講義の記録です。',
    },
    en: {
      h1: 'Speaking & Events', title: `Speaking & Events | ${CO_EN}`,
      desc: `Talks and events featuring Michimasa Naka, founder of ${CO_EN}: TEAMZ SUMMIT 2026, Keio University, the DLA Piper x Forbes JAPAN seminar and more.`,
      lead: 'Conferences and lectures where our founder Michimasa Naka spoke, moderated or gave the closing review.',
    },
  },
];

/* 言語ごとの差分 */
const L = {
  ja: { src: 'index.html', base: '', top: 'TOP', crumbSep: ' ／ ', portfolioLabel: '投資先・パートナー企業' },
  en: { src: join('en', 'index.html'), base: '/en', top: 'TOP', crumbSep: ' / ', portfolioLabel: 'Portfolio & Partners' },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SRC = { ja: readFileSync(join(HERE, L.ja.src), 'utf8'), en: readFileSync(join(HERE, L.en.src), 'utf8') };

function sectionById(html, id) {
  const m = html.match(new RegExp(`<section[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?</section>`));
  if (!m) throw new Error('section not found: ' + id);
  return m[0];
}

// 日英の対になるURLを hreflang で相互に示す(x-default は日本語)
function hreflang(path) {
  return `<link rel="alternate" hreflang="ja" href="${ORIGIN}${path}" />\n` +
         `<link rel="alternate" hreflang="en" href="${ORIGIN}/en${path}" />\n` +
         `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${path}" />`;
}

// head の差し替え(タイトル・説明・OG・canonical・hreflang・追加の構造化データ)
function setHead(html, { title, desc, path, lang, ld }) {
  const url = `${ORIGIN}${L[lang].base}${path}`;
  html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  const setMeta = (sel, val) => { html = html.replace(new RegExp(`(${sel} content=")[^"]*(")`), (m, a, b) => a + esc(val) + b); };
  setMeta('<meta name="description"', desc);
  setMeta('<meta property="og:description"', desc);
  setMeta('<meta name="twitter:description"', desc);
  setMeta('<meta property="og:title"', title);
  setMeta('<meta name="twitter:title"', title);
  setMeta('<meta property="og:url"', url);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />\n${hreflang(path)}`);
  html = html.replace('</head>', ld.map(o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join('\n') + '\n</head>');
  return html;
}

// 本文(ヘッダー直後〜フッター直前)を差し替え、リンクと画像パスを整える
function setBody(html, { slugAttr, main, keepIds, lang }) {
  html = html.replace(/<body([^>]*)>/, (m, a) => `<body${a} data-subpage="${slugAttr}">`);
  html = html.replace(/<div id="intro">[\s\S]*?<\/div>\s*<\/div>\s*/, '');
  const start = html.indexOf('<section class="hero"');
  const end = html.indexOf('<footer>');
  if (start < 0 || end < 0) throw new Error('layout markers not found');
  html = html.slice(0, start) + main + '\n\n' + html.slice(end);
  const base = L[lang].base;
  html = html.replace(/href="#([a-zA-Z0-9_-]+)"/g, (m, id) => keepIds.has(id) ? m : `href="${base}/#${id}"`);
  html = html.replace(/(src|href)="img\//g, '$1="/img/').replace(/url\((['"]?)img\//g, 'url($1/img/');
  if (lang === 'en') html = localizeNav(html, 'en');
  return html;
}

// 日本語以外のページでは、ナビ・フッターの下層リンクを英語版(/en/...)へ。
// フッターの「Top」「Contact」はそのページ自身の言語のトップへ戻す。
function localizeNav(html, homeLc) {
  for (const s of ['about', 'message', 'portfolio', 'history', 'events']) {
    html = html.replaceAll(`href="/${s}/"`, `href="/en/${s}/"`);
  }
  html = html.replace(/(<nav class="foot-nav"[^>]*>)([\s\S]*?)(<\/nav>)/, (m, a, inner, c) => a + inner
    .replace('>TOP<', '>Top<').replace('>会社概要<', '>About<').replace('>代表メッセージ<', '>CEO Message<')
    .replace('>投資先<', '>Portfolio<').replace('>沿革<', '>History<').replace('>登壇・イベント<', '>Events<')
    .replace('>お問い合わせ<', '>Contact<')
    .replace('href="/"', `href="/${homeLc}/"`).replace('href="/#contact"', `href="/${homeLc}/#contact"`) + c);
  return html;
}

function crumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: it[1] })) };
}

/* ── 下層5ページ ── */
function buildPage(pg, lang) {
  const t = pg[lang], base = L[lang].base, src = SRC[lang];
  const path = `/${pg.slug}/`;
  let html = setHead(src, {
    title: t.title, desc: t.desc, path, lang,
    ld: [crumbLd([[lang === 'ja' ? CO : CO_EN, `${ORIGIN}${base}/`], [t.h1, `${ORIGIN}${base}${path}`]])],
  });
  let body = pg.sections.map(id => {
    let sec = sectionById(src, id);
    if ((pg.hideHead || []).includes(id)) {
      sec = sec.replace(/\s*<span class="eyebrow[^"]*"[^>]*>[\s\S]*?<\/span>/, '')
               .replace(/\s*<h2 class="h2[^"]*"[^>]*>[\s\S]*?<\/h2>/, '');
    }
    return sec;
  }).join('\n\n');
  for (const listId of pg.showAll || []) {
    body = body.replace(new RegExp(`(<div class="news-list(?: ev-list)?)(" id="${listId}")`), '$1 show-all$2')
               .replace(/<button class="news-more[^>]*>[\s\S]*?<\/button>/g, '');
  }
  const main = `<section class="page-hero">
  <div class="wrap">
    <nav class="crumb" aria-label="breadcrumb"><a href="${base}/">${L[lang].top}</a>${L[lang].crumbSep}<span>${esc(t.h1)}</span></nav>
    <span class="eyebrow">${pg.label}</span>
    <h1 class="h1p jp">${esc(t.h1)}</h1>
    <p class="lead-p jp">${esc(t.lead)}</p>
  </div>
</section>

${body}`;
  html = setBody(html, { slugAttr: pg.slug, main, keepIds: new Set(pg.sections), lang });
  const dir = join(OUT, base.replace(/^\//, ''), pg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  return `${base}${path}`;
}

/* ── 投資先の個別ページ(33社) ── */
const srcJa = SRC.ja;
const PCO = new Function(srcJa.match(/const PCO=\[[\s\S]*?\n\];/)[0] + ';return PCO;')();
const CURL = new Function(srcJa.match(/const CURL=\{[\s\S]*?\};/)[0] + ';return CURL;')();
const PSLUG = new Function(srcJa.match(/const PSLUG=\{[\s\S]*?\};/)[0] + ';return PSLUG;')();
const LOGO = {
  vectorinc: 'vectorinc.webp', vision: 'vision.webp', istyle: 'istyle.webp', ewell: 'ewell.webp',
  geniee: 'geniee.webp', houyou: 'houyou.webp', glm: 'glm.webp', finc: 'finc.webp', fabbit: 'fabbit.webp',
  donutrobotics: 'donutrobotics.webp', dea: 'dea.webp', telcoin: 'telcoin.webp', ipnexus: 'ipnexus.webp',
  ecobike: 'ecobike.webp', fungroup: 'fun.webp', receptionist: 'delighted.webp', identity: 'identity.webp',
  huber: 'huber.webp', welltool: 'welltool.webp', dofa: 'dofa.svg', mgram: 'mgram.webp', entouch: 'entouch.webp',
  funup: 'fun-up.webp', xperisus: 'xperisus.webp', sharestaff: 'petitjob.webp', axion: 'axion.webp',
  baleum: 'baleum.webp', babels: 'babels.webp', qithree: 'qithree.webp', jlbc: 'jlbc.webp', wqctech: 'wqctech.webp',
};

function buildCompany(c, lang) {
  const [name, en, bizObj, rep, est] = c;
  const slug = PSLUG[name];
  if (!slug) return null;
  const base = L[lang].base, src = SRC[lang];
  const path = `/portfolio/${slug}/`;
  const url = CURL[name] || '';
  const isJa = lang === 'ja';
  const biz = bizObj ? (isJa ? (bizObj.ja || bizObj.en) : (bizObj.en || bizObj.ja)) || '' : '';
  const shown = isJa ? name : (en || name);
  const estEn = est ? est.replace(/年/, '/').replace(/月.*$/, '') : '';
  const disp = isJa ? (en ? `${name}（${en}）` : name) : (en ? `${en} (${name})` : name);
  const title = isJa ? `${disp}｜${CO} 投資先` : `${disp} | ${CO_EN} Portfolio`;
  const desc = isJa
    ? `${CO}（${CO_EN}）の投資先・パートナー企業、${disp}のご紹介。${biz ? '事業内容：' + biz + '。' : ''}${rep ? rep + '。' : ''}${est ? '設立 ' + est + '。' : ''}`
    : `${disp} is a portfolio and partner company of ${CO_EN}.${biz ? ' Business: ' + biz + '.' : ''}${estEn ? ' Founded ' + estEn + '.' : ''}`;

  const orgLd = Object.assign({ '@context': 'https://schema.org', '@type': 'Organization', name },
    en ? { alternateName: en } : {}, url ? { url } : {}, biz ? { description: biz } : {},
    est ? { foundingDate: est.replace(/年/, '-').replace(/月.*$/, '').replace(/-(\d)$/, '-0$1') } : {});
  let html = setHead(src, {
    title, desc, path, lang,
    ld: [crumbLd([[isJa ? CO : CO_EN, `${ORIGIN}${base}/`], [L[lang].portfolioLabel, `${ORIGIN}${base}/portfolio/`], [shown, `${ORIGIN}${base}${path}`]]), orgLd],
  });

  const logo = LOGO[slug]
    ? `<img src="/img/partner/co/${LOGO[slug]}" alt="${esc(shown)} logo" width="240" height="84" loading="eager" decoding="async">`
    : `<span class="noimg">${esc(en || name)}</span>`;
  const K = isJa
    ? { co: '社名', biz: '事業内容', rep: '代表者', est: '設立', web: '公式サイト', back: '← 投資先・パートナー企業の一覧へ', others: 'その他の投資先・パートナー企業', lead: `${CO}（${CO_EN}）の投資先・パートナー企業です。` }
    : { co: 'Company', biz: 'Business', rep: '', est: 'Founded', web: 'Website', back: '← Back to Portfolio & Partners', others: 'Other portfolio and partner companies', lead: `A portfolio and partner company of ${CO_EN}.` };
  const rows = [
    [K.co, esc(isJa ? name : (en || name)) + (isJa ? (en ? `<br><span style="color:var(--muted)">${esc(en)}</span>` : '') : (en ? `<br><span style="color:var(--muted)">${esc(name)}</span>` : ''))],
    biz ? [K.biz, esc(biz)] : null,
    (isJa && rep) ? [K.rep, esc(rep)] : null,
    est ? [K.est, esc(isJa ? est : estEn)] : null,
    url ? [K.web, `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`] : null,
  ].filter(Boolean).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  const others = PCO.filter(o => o[0] !== name && PSLUG[o[0]])
    .map(o => `<li><a href="${base}/portfolio/${PSLUG[o[0]]}/">${esc(isJa ? o[0] : (o[1] || o[0]))}</a></li>`).join('');

  const main = `<section class="page-hero">
  <div class="wrap">
    <nav class="crumb" aria-label="breadcrumb"><a href="${base}/">${L[lang].top}</a>${L[lang].crumbSep}<a href="${base}/portfolio/">${L[lang].portfolioLabel}</a>${L[lang].crumbSep}<span>${esc(shown)}</span></nav>
    <span class="eyebrow">PORTFOLIO</span>
    <h1 class="h1p jp">${esc(shown)}</h1>
    <p class="lead-p jp">${esc(K.lead)}</p>
  </div>
</section>

<section class="pad">
  <div class="wrap">
    <div class="co-card">
      <div class="co-logo">${logo}</div>
      <table class="co-table"><tbody>${rows}</tbody></table>
    </div>
    <a class="co-back" href="${base}/portfolio/">${K.back}</a>
    <div class="co-others">
      <h2 class="jp">${K.others}</h2>
      <ul>${others}</ul>
    </div>
  </div>
</section>

${sectionById(src, 'contact')}`;
  html = setBody(html, { slugAttr: `portfolio-${slug}`, main, keepIds: new Set(['contact']), lang });
  const dir = join(OUT, base.replace(/^\//, ''), 'portfolio', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  return `${base}${path}`;
}

/* ── 生成 ── */
const built = [];
for (const lang of ['ja', 'en']) {
  for (const pg of PAGES) built.push(buildPage(pg, lang));
  for (const c of PCO) { const p = buildCompany(c, lang); if (p) built.push(p); }
}

/* 追加の構造化データ: 代表メッセージに Person、投資先一覧に ItemList(日英) */
for (const lang of ['ja', 'en']) {
  const base = L[lang].base.replace(/^\//, '');
  const isJa = lang === 'ja';
  {
    const f = join(OUT, base, 'message', 'index.html');
    let h = readFileSync(f, 'utf8');
    const person = {
      '@context': 'https://schema.org', '@type': 'Person', name: isJa ? '那珂通雅' : 'Michimasa Naka',
      alternateName: isJa ? 'Michimasa Naka' : '那珂通雅', jobTitle: isJa ? '代表取締役社長' : 'President & CEO',
      worksFor: { '@type': 'Organization', name: isJa ? CO : CO_EN, alternateName: isJa ? CO_EN : CO, url: `${ORIGIN}/` },
      alumniOf: isJa ? '慶應義塾大学' : 'Keio University',
      sameAs: ['https://ja.wikipedia.org/wiki/%E9%82%A3%E7%8F%82%E9%80%9A%E9%9B%85', 'https://www.wikidata.org/wiki/Q11642795'],
    };
    h = h.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n</script>\n</head>`);
    writeFileSync(f, h, 'utf8');
  }
  {
    const f = join(OUT, base, 'portfolio', 'index.html');
    let h = readFileSync(f, 'utf8');
    const list = {
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: isJa ? `${CO}の投資先・パートナー企業` : `${CO_EN} portfolio and partner companies`,
      itemListElement: PCO.filter(c => PSLUG[c[0]]).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: isJa ? c[0] : (c[1] || c[0]), url: `${ORIGIN}${L[lang].base}/portfolio/${PSLUG[c[0]]}/` })),
    };
    h = h.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(list, null, 2)}\n</script>\n</head>`);
    writeFileSync(f, h, 'utf8');
  }
}

/* 日本語以外のトップ(/en/ /zh/ …)のナビとフッターは英語の下層ページへ向ける
   (日本語が読めない閲覧者を日本語ページに送らない) */
for (const lc of LANGS_OTHER) {
  const f = join(OUT, lc, 'index.html');
  let h = readFileSync(f, 'utf8');
  h = localizeNav(h, lc);
  writeFileSync(f, h, 'utf8');
}

/* sitemap に追記(build-i18n が書いたものに足す・重複は足さない) */
const smPath = join(OUT, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8');
const lastmod = new Date().toISOString().slice(0, 10);
for (const p of built) {
  const loc = `${ORIGIN}${p}`;
  if (sm.includes(`<loc>${loc}</loc>`)) continue;
  const pri = p.includes('/portfolio/') && p.split('/').filter(Boolean).length >= (p.startsWith('/en/') ? 3 : 2) ? '0.6' : '0.9';
  sm = sm.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${pri}</priority></url>\n</urlset>`);
}
writeFileSync(smPath, sm, 'utf8');

console.log('下層ページ生成:', built.length, 'ページ(日本語', built.filter(p => !p.startsWith('/en/')).length, '/ 英語', built.filter(p => p.startsWith('/en/')).length, ')');
console.log('  sitemap.xml に追記済み');
