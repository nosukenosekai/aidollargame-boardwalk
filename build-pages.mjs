/* 下層ページ生成: /about/ /message/ /portfolio/ /history/ /events/
   トップ(index.html)を元に、そのページで見せるセクションだけを残した独立ページを書き出す。
   デザイン・スクリプト・データはトップと共通なので、トップを直せば下層も揃う。

   なぜ作るか(2026-09-18):
   「boardwalk capital」「boardwalkcapitalinc」で旧さくらサイトが1位を取り続けている。
   旧サイトは About / CEO Message / Partners / Event と投資先34社の詳細ページまで独立URLを持ち、
   Googleはそれをサイトリンク(検索結果の下に並ぶ小見出し)として出している。
   こちらは1ページ構成で、Googleに見せられるページが実質1枚しかなかった。

   使い方: node build-i18n.mjs . && node build-pages.mjs .
   (build-i18n が沿革・登壇・投資先をトップに焼き込んだ後に実行する) */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || HERE;
const ORIGIN = 'https://boardwalkcapitalinc.com';
const CO = 'ボードウォーク・キャピタル株式会社';
const CO_EN = 'Boardwalk Capital Inc.';

const PAGES = [
  {
    slug: 'about', label: 'ABOUT', h1: '会社概要',
    title: `会社概要｜${CO}（${CO_EN}）`,
    desc: `${CO}（${CO_EN}）の会社概要。2016年7月設立、代表取締役社長 那珂通雅。アドバイザリー・インキュベーション・エンジェル投資を通じて、挑戦する企業と人材を支援しています。`,
    lead: '2016年の設立以来、アドバイザリー・インキュベーション・エンジェル投資の3つの領域で、国内外の企業と起業家を支援しています。',
    sections: ['philosophy', 'track', 'services', 'team', 'contact'],
  },
  {
    slug: 'message', label: 'CEO MESSAGE', h1: '代表メッセージ',
    title: `代表メッセージ｜${CO}（${CO_EN}）`,
    desc: `${CO} 代表取締役社長 那珂通雅からのメッセージ。「世界で通用する日本人を、一人でも多く創出したい。」35年以上国際金融の第一線で培った経験をもとに、挑戦する企業と人材を支援しています。`,
    lead: '代表取締役社長 那珂通雅より、ご挨拶を申し上げます。',
    sections: ['message', 'contact'],
  },
  {
    slug: 'portfolio', label: 'PARTNERS', h1: '投資先・パートナー企業',
    title: `投資先・パートナー企業｜${CO}（${CO_EN}）`,
    desc: `${CO}の投資先・パートナー企業33社。ベクトル、ビジョン、アイスタイル（@cosme）、ジーニー、eWeLL、GLM、FiNC Technologies ほか。各社の事業内容・代表者・設立年を掲載しています。`,
    lead: 'ボードウォーク・キャピタルが出資・支援してきた33社です。各社の事業内容・代表者・設立年を掲載しています。',
    sections: ['partners', 'movies', 'contact'],
  },
  {
    slug: 'history', label: 'HISTORY', h1: '沿革',
    title: `沿革｜${CO}（${CO_EN}）`,
    desc: `${CO}と創業者・那珂通雅の沿革。1989年ソロモン・ブラザーズ入社、シティグループ証券取締役副社長、ストームハーバー証券設立を経て、2016年に当社を設立。`,
    lead: '創業者・那珂通雅の国際金融でのキャリアから、当社の設立、現在までの歩みです。',
    sections: ['news', 'contact'], hideHead: ['news'], showAll: ['newsList'],
  },
  {
    slug: 'events', label: 'EVENTS', h1: '登壇・イベント',
    title: `登壇・イベント｜${CO}（${CO_EN}）`,
    desc: `創業者・那珂通雅の講演・登壇の記録。TEAMZ SUMMIT 2026、慶應義塾大学、DLA PIPER×Forbes JAPAN 海外進出戦略セミナー、経済界倶楽部ほか。`,
    lead: '創業者・那珂通雅が登壇・モデレーター・講評を務めたカンファレンスや講義の記録です。',
    sections: ['event', 'contact'], hideHead: ['event'], showAll: ['eventList'],
  },
];

const src = readFileSync(join(HERE, 'index.html'), 'utf8');

// <section ... id="xxx"> ... </section> を id で取り出す
function sectionById(html, id) {
  const re = new RegExp(`<section[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?</section>`);
  const m = html.match(re);
  if (!m) throw new Error('section not found: ' + id);
  return m[0];
}

function build(pg) {
  let html = src;

  // --- head ---
  html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g, '');  // 下層は日本語のみ
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${pg.title}</title>`);
  const setMeta = (sel, val) => { html = html.replace(new RegExp(`(${sel} content=")[^"]*(")`), (m, a, b) => a + val + b); };
  setMeta('<meta name="description"', pg.desc);
  setMeta('<meta property="og:description"', pg.desc);
  setMeta('<meta name="twitter:description"', pg.desc);
  setMeta('<meta property="og:title"', pg.title);
  setMeta('<meta name="twitter:title"', pg.title);
  setMeta('<meta property="og:url"', `${ORIGIN}/${pg.slug}/`);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${ORIGIN}/${pg.slug}/" />`);

  // パンくずを構造化データに追加
  const crumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: CO, item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: pg.h1, item: `${ORIGIN}/${pg.slug}/` },
    ],
  };
  html = html.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(crumb, null, 2)}\n</script>\n</head>`);

  // --- body ---
  html = html.replace(/<body([^>]*)>/, (m, a) => `<body${a} data-subpage="${pg.slug}">`);
  html = html.replace(/<div id="intro">[\s\S]*?<\/div>\s*<\/div>\s*/, '');    // オープニング演出は出さない

  // トップの本文(ヘッダー直後〜フッター直前)を、このページのセクションだけに差し替える
  const start = html.indexOf('<section class="hero"');
  const end = html.indexOf('<footer>');
  if (start < 0 || end < 0) throw new Error('layout markers not found');
  let body = pg.sections.map(id => {
    let sec = sectionById(src, id);
    if ((pg.hideHead || []).includes(id)) {
      // ページのh1と同じ見出しになるセクション見出しは外す(説明文は残す)
      sec = sec.replace(/\s*<span class="eyebrow[^"]*"[^>]*>[\s\S]*?<\/span>/, '')
               .replace(/\s*<h2 class="h2[^"]*"[^>]*>[\s\S]*?<\/h2>/, '');
    }
    return sec;
  }).join('\n\n');
  // 「すべて見る」で畳む一覧は、専用ページでは最初から全部開く
  for (const listId of pg.showAll || []) {
    body = body.replace(new RegExp(`(id="${listId}"[^>]*class="[^"]*|class="([^"]*)"([^>]*)id="${listId}")`), m => m)
               .replace(new RegExp(`(<div class="news-list(?: ev-list)?)(" id="${listId}")`), '$1 show-all$2')
               .replace(/<button class="news-more[^>]*>[\s\S]*?<\/button>/g, '');
  }
  const hero = `<section class="page-hero">
  <div class="wrap">
    <nav class="crumb" aria-label="パンくず"><a href="/">TOP</a> ／ <span>${pg.h1}</span></nav>
    <span class="eyebrow">${pg.label}</span>
    <h1 class="h1p jp">${pg.h1}</h1>
    <p class="lead-p jp">${pg.lead}</p>
  </div>
</section>

`;
  html = html.slice(0, start) + hero + body + '\n\n' + html.slice(end);

  // ページ内に無いセクションへのアンカーはトップへ飛ばす
  const here = new Set(pg.sections);
  html = html.replace(/href="#([a-zA-Z0-9_-]+)"/g, (m, id) => here.has(id) ? m : `href="/#${id}"`);

  // 相対パスをルート基準に(/about/ などの階層から画像等を読めるように)
  html = html.replace(/(src|href)="img\//g, '$1="/img/').replace(/url\((['"]?)img\//g, 'url($1/img/');

  const dir = join(OUT, pg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  return { slug: pg.slug, bytes: html.length };
}

const res = PAGES.map(build);

/* ─────────────────────────────────────────────────────────────
   投資先の個別ページ /portfolio/<slug>/ (33社)
   旧サイトは partner/vision.php などを1社ずつ持ち、Googleがそれを
   「株式会社ビジョン Vision Inc.」のようなサイトリンクとして出していた。同じ粒度で持つ。
   ───────────────────────────────────────────────────────────── */
const PCO = new Function(src.match(/const PCO=\[[\s\S]*?\n\];/)[0] + ';return PCO;')();
const CURL = new Function(src.match(/const CURL=\{[\s\S]*?\};/)[0] + ';return CURL;')();
const PSLUG = new Function(src.match(/const PSLUG=\{[\s\S]*?\};/)[0] + ';return PSLUG;')();
// slug → ロゴファイル(旧サイトから回収した img/partner/co/ の名前)。無い会社は社名の文字で代替
const LOGO = {
  vectorinc: 'vectorinc.webp', vision: 'vision.webp', istyle: 'istyle.webp', ewell: 'ewell.webp',
  geniee: 'geniee.webp', houyou: 'houyou.webp', glm: 'glm.webp', finc: 'finc.webp', fabbit: 'fabbit.webp',
  donutrobotics: 'donutrobotics.webp', dea: 'dea.webp', telcoin: 'telcoin.webp', ipnexus: 'ipnexus.webp',
  ecobike: 'ecobike.webp', fungroup: 'fun.webp', receptionist: 'delighted.webp', identity: 'identity.webp',
  huber: 'huber.webp', welltool: 'welltool.webp', dofa: 'dofa.svg', mgram: 'mgram.webp', entouch: 'entouch.webp',
  funup: 'fun-up.webp', xperisus: 'xperisus.webp', sharestaff: 'petitjob.webp', axion: 'axion.webp',
  baleum: 'baleum.webp', babels: 'babels.webp', qithree: 'qithree.webp', jlbc: 'jlbc.webp', wqctech: 'wqctech.webp',
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildCompany(c) {
  const [name, en, bizObj, rep, est] = c;
  const slug = PSLUG[name];
  if (!slug) return null;
  const biz = bizObj ? (bizObj.ja || bizObj.en || '') : '';
  const url = CURL[name] || '';
  const disp = en ? `${name}（${en}）` : name;
  const title = `${disp}｜${CO} 投資先`;
  const desc = `${CO}（${CO_EN}）の投資先・パートナー企業、${disp}のご紹介。${biz ? '事業内容：' + biz + '。' : ''}${rep ? rep + '。' : ''}${est ? '設立 ' + est + '。' : ''}`;
  let html = src;

  html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  const setMeta = (sel, val) => { html = html.replace(new RegExp(`(${sel} content=")[^"]*(")`), (m, a, b) => a + esc(val) + b); };
  setMeta('<meta name="description"', desc);
  setMeta('<meta property="og:description"', desc);
  setMeta('<meta name="twitter:description"', desc);
  setMeta('<meta property="og:title"', title);
  setMeta('<meta name="twitter:title"', title);
  setMeta('<meta property="og:url"', `${ORIGIN}/portfolio/${slug}/`);
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${ORIGIN}/portfolio/${slug}/" />`);

  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: CO, item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: '投資先・パートナー企業', item: `${ORIGIN}/portfolio/` },
      { '@type': 'ListItem', position: 3, name: name, item: `${ORIGIN}/portfolio/${slug}/` },
    ] },
    Object.assign({ '@context': 'https://schema.org', '@type': 'Organization', name },
      en ? { alternateName: en } : {}, url ? { url } : {}, biz ? { description: biz } : {},
      est ? { foundingDate: est.replace(/年/, '-').replace(/月.*$/, '').replace(/-(\d)$/, '-0$1') } : {}),
  ];
  html = html.replace('</head>', ld.map(o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join('\n') + '\n</head>');

  html = html.replace(/<body([^>]*)>/, (m, a) => `<body${a} data-subpage="portfolio-${slug}">`);
  html = html.replace(/<div id="intro">[\s\S]*?<\/div>\s*<\/div>\s*/, '');

  const logo = LOGO[slug]
    ? `<img src="/img/partner/co/${LOGO[slug]}" alt="${esc(name)} ロゴ" width="240" height="84" loading="eager" decoding="async">`
    : `<span class="noimg">${esc(en || name)}</span>`;
  const rows = [
    ['社名', esc(name) + (en ? `<br><span style="color:var(--muted)">${esc(en)}</span>` : '')],
    biz ? ['事業内容', esc(biz)] : null,
    rep ? ['代表者', esc(rep)] : null,
    est ? ['設立', esc(est)] : null,
    url ? ['公式サイト', `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`] : null,
  ].filter(Boolean).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  const others = PCO.filter(o => o[0] !== name && PSLUG[o[0]])
    .map(o => `<li><a href="/portfolio/${PSLUG[o[0]]}/">${esc(o[0])}</a></li>`).join('');

  const main = `<section class="page-hero">
  <div class="wrap">
    <nav class="crumb" aria-label="パンくず"><a href="/">TOP</a> ／ <a href="/portfolio/">投資先・パートナー企業</a> ／ <span>${esc(name)}</span></nav>
    <span class="eyebrow">PORTFOLIO</span>
    <h1 class="h1p jp">${esc(name)}</h1>
    <p class="lead-p jp">${CO}（${CO_EN}）の投資先・パートナー企業です。</p>
  </div>
</section>

<section class="pad">
  <div class="wrap">
    <div class="co-card">
      <div class="co-logo">${logo}</div>
      <table class="co-table"><tbody>${rows}</tbody></table>
    </div>
    <a class="co-back" href="/portfolio/">← 投資先・パートナー企業の一覧へ</a>
    <div class="co-others">
      <h2 class="jp">その他の投資先・パートナー企業</h2>
      <ul>${others}</ul>
    </div>
  </div>
</section>

`;
  const start = html.indexOf('<section class="hero"');
  const end = html.indexOf('<footer>');
  html = html.slice(0, start) + main + sectionById(src, 'contact') + '\n\n' + html.slice(end);
  html = html.replace(/href="#([a-zA-Z0-9_-]+)"/g, (m, id) => id === 'contact' ? m : `href="/#${id}"`);
  html = html.replace(/(src|href)="img\//g, '$1="/img/').replace(/url\((['"]?)img\//g, 'url($1/img/');

  const dir = join(OUT, 'portfolio', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  return slug;
}
const coSlugs = PCO.map(buildCompany).filter(Boolean);

/* 代表メッセージ: 那珂通雅の Person 構造化データ / 投資先一覧: ItemList */
{
  const f = join(OUT, 'message', 'index.html');
  let h = readFileSync(f, 'utf8');
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: '那珂通雅', alternateName: 'Michimasa Naka',
    jobTitle: '代表取締役社長', worksFor: { '@type': 'Organization', name: CO, alternateName: CO_EN, url: `${ORIGIN}/` },
    alumniOf: '慶應義塾大学', sameAs: ['https://ja.wikipedia.org/wiki/%E9%82%A3%E7%8F%82%E9%80%9A%E9%9B%85'],
  };
  h = h.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n</script>\n</head>`);
  writeFileSync(f, h, 'utf8');
}
{
  const f = join(OUT, 'portfolio', 'index.html');
  let h = readFileSync(f, 'utf8');
  const list = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: `${CO}の投資先・パートナー企業`,
    itemListElement: PCO.filter(c => PSLUG[c[0]]).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], url: `${ORIGIN}/portfolio/${PSLUG[c[0]]}/` })),
  };
  h = h.replace('</head>', `<script type="application/ld+json">\n${JSON.stringify(list, null, 2)}\n</script>\n</head>`);
  writeFileSync(f, h, 'utf8');
}

// sitemap に下層ページを追記(build-i18n が書いたものに足す・重複は足さない)
const smPath = join(OUT, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8');
const lastmod = new Date().toISOString().slice(0, 10);
const addLoc = (loc, pri) => {
  if (sm.includes(`<loc>${loc}</loc>`)) return;
  sm = sm.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>${pri}</priority></url>\n</urlset>`);
};
for (const pg of PAGES) addLoc(`${ORIGIN}/${pg.slug}/`, '0.9');
for (const sl of coSlugs) addLoc(`${ORIGIN}/portfolio/${sl}/`, '0.6');
writeFileSync(smPath, sm, 'utf8');

console.log('下層ページ生成:');
res.forEach(r => console.log('  ', '/' + r.slug + '/', r.bytes, 'bytes'));
console.log('  投資先の個別ページ:', coSlugs.length, '社');
console.log('  sitemap.xml に追記済み');
