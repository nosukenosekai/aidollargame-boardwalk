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

// sitemap に下層ページを追記(build-i18n が書いたものに足す・重複は足さない)
const smPath = join(OUT, 'sitemap.xml');
let sm = readFileSync(smPath, 'utf8');
const lastmod = new Date().toISOString().slice(0, 10);
for (const pg of PAGES) {
  const loc = `${ORIGIN}/${pg.slug}/`;
  if (sm.includes(`<loc>${loc}</loc>`)) continue;
  sm = sm.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>\n</urlset>`);
}
writeFileSync(smPath, sm, 'utf8');

console.log('下層ページ生成:');
res.forEach(r => console.log('  ', '/' + r.slug + '/', r.bytes, 'bytes'));
console.log('  sitemap.xml に追記済み');
