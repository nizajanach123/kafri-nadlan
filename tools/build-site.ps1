<#
  Builds the static site from src/ into the repo root (Netlify just serves the result; no build step there).

    powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-site.ps1

  Reads : src/css/site.css + src/css/extra.css, src/js/site.js, assets/nav.js (compiled from src/js/nav.tsx),
          src/partials/*.html, src/pages/*.html
  Writes: index.html, rehovot/index.html, 404.html, sitemap.xml, robots.txt, _headers, assets/site.css, assets/site.js

  Change $SiteUrl when the site gets its own domain, then rebuild.
#>
$ErrorActionPreference = 'Stop'
$Root    = Split-Path $PSScriptRoot
$SiteUrl = 'https://kafri-nadlan.co.il'
$Brand   = 'קבוצת כפרי נדל״ן'
$Phone   = '+972-54-265-3666'
$Today   = (Get-Date).ToString('yyyy-MM-dd')
$utf8    = New-Object Text.UTF8Encoding($false)

function ReadFile($p)  { [IO.File]::ReadAllText((Join-Path $Root $p), [Text.Encoding]::UTF8) }
function WriteFile($p, $text) {
  $full = Join-Path $Root $p; $dir = Split-Path $full
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  [IO.File]::WriteAllText($full, $text.Replace("`r`n", "`n"), $utf8)
}
function Hash($p) { $b = [IO.File]::ReadAllBytes((Join-Path $Root $p)); ([BitConverter]::ToString([Security.Cryptography.MD5]::Create().ComputeHash($b)) -replace '-', '').Substring(0, 8).ToLower() }
function Esc($s)  { [Net.WebUtility]::HtmlEncode($s) }
function J($s)    { '"' + ($s -replace '\\', '\\' -replace '"', '\"' -replace "`r?`n", ' ') + '"' }
function Strip($html) { ([regex]::Replace($html, '<[^>]+>', '') -replace '\s+', ' ').Trim() }

# ---------- assets ----------
WriteFile 'assets/site.css' ((ReadFile 'src/css/site.css') + "`n" + (ReadFile 'src/css/extra.css'))
WriteFile 'assets/site.js'  (ReadFile 'src/js/site.js')
$cssV = Hash 'assets/site.css'; $jsV = Hash 'assets/site.js'; $navV = Hash 'assets/nav.js'

$footer    = ReadFile 'src/partials/footer.html'
$headerSrc = ReadFile 'src/partials/header.html'

# ---------- page layout ----------
function Page($o) {
  # $o: path, title, description, body, navActive, home (bool), schema (array of json strings), ogType, noindex
  $url = $SiteUrl + $o.path
  $base = if ($o.home) { '' } else { '/' }
  $header = $headerSrc
  if (-not $o.home) { $header = $header.Replace('href="#', 'href="/#') }
  $header = $header.Replace('href="/#"', 'href="/"')
  $robots = if ($o.noindex) { 'noindex, follow' } else { 'index, follow, max-image-preview:large' }
  $og = $SiteUrl + '/assets/img/hero.jpg'
  $schema = ($o.schema | ? { $_ } | % { '<script type="application/ld+json">' + $_ + '</script>' }) -join "`n"
  $extraHead = if ($o.home) { "<script>if(/^#\/rehovot\/?$/.test(location.hash))location.replace('/rehovot/')</script>`n<link rel=`"preload`" as=`"image`" href=`"/assets/img/hero.jpg`" fetchpriority=`"high`">" } else { '' }
  $nav = if ($o.navActive) { ' data-nav-active="' + $o.navActive + '"' } else { '' }
  @"
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$(Esc $o.title)</title>
<meta name="description" content="$(Esc $o.description)">
<meta name="robots" content="$robots">
<link rel="canonical" href="$url">
<meta name="theme-color" content="#16264a">
<link rel="icon" type="image/png" href="/assets/img/favicon.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="$Brand">
<meta property="og:type" content="$($o.ogType)">
<meta property="og:title" content="$(Esc $o.title)">
<meta property="og:description" content="$(Esc $o.description)">
<meta property="og:url" content="$url">
<meta property="og:image" content="$og">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$(Esc $o.title)">
<meta name="twitter:description" content="$(Esc $o.description)">
<meta name="twitter:image" content="$og">
$extraHead
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=$cssV">
$schema
</head>
<body data-base="$base"$nav>
<a class="skip" href="#main">דלג לתוכן הראשי</a>

$header

<main id="main">
$($o.body)
</main>

$footer

<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin defer></script>
<script src="/assets/nav.js?v=$navV" defer></script>
<script src="/assets/site.js?v=$jsV" defer></script>
</body>
</html>
"@
}

function Breadcrumb($items) {
  $i = 0; $els = ($items | % { $i++; '{"@type":"ListItem","position":' + $i + ',"name":' + (J $_[0]) + ',"item":' + (J ($SiteUrl + $_[1])) + '}' }) -join ','
  '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + $els + ']}'
}
function FaqSchema($html) {
  $ms = [regex]::Matches($html, '(?s)<details><summary>(.*?)</summary><p>(.*?)</p></details>')
  if (-not $ms.Count) { return '' }
  $q = ($ms | % { '{"@type":"Question","name":' + (J (Strip $_.Groups[1].Value)) + ',"acceptedAnswer":{"@type":"Answer","text":' + (J (Strip $_.Groups[2].Value)) + '}}' }) -join ','
  '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[' + $q + ']}'
}
$orgSchema = '{"@context":"https://schema.org","@type":"RealEstateAgent","@id":"' + $SiteUrl + '/#organization","name":' + (J $Brand) + ',"url":"' + $SiteUrl + '/","logo":"' + $SiteUrl + '/assets/img/logo-hero.png","image":"' + $SiteUrl + '/assets/img/hero.jpg","telephone":"' + $Phone + '","description":"שיווק זכויות בקרקעות פרטיות הרשומות בטאבו, עם בדיקות יסודיות, שקיפות וליווי אישי.","areaServed":{"@type":"Country","name":"ישראל"},"founder":{"@type":"Person","name":"אלעזר כפרי"},"availableLanguage":"he"}'
$siteSchema = '{"@context":"https://schema.org","@type":"WebSite","@id":"' + $SiteUrl + '/#website","url":"' + $SiteUrl + '/","name":' + (J $Brand) + ',"inLanguage":"he","publisher":{"@id":"' + $SiteUrl + '/#organization"}}'

# ---------- home ----------
$homeBody = ReadFile 'src/pages/home.html'
WriteFile 'index.html' (Page @{
  path = '/'; home = $true; ogType = 'website'; navActive = ''
  title = "$Brand | השקעה בקרקעות – שקיפות, בדיקות יסודיות וליווי אישי"
  description = 'קבוצת כפרי נדל״ן משווקת זכויות בקרקעות פרטיות הרשומות בטאבו. מציגים את התמונה המלאה: זכויות, מצב תכנוני, עלויות וסיכונים, עם חוות דעת שמאית וליווי משפטי.'
  body = $homeBody
  schema = @($orgSchema, $siteSchema, (FaqSchema $homeBody))
})

# ---------- Rehovot project page ----------
$rvBody = ReadFile 'src/pages/rehovot.html'
WriteFile 'rehovot/index.html' (Page @{
  path = '/rehovot/'; home = $false; ogType = 'website'; navActive = 'projects'
  title = "קרקע להשקעה במזרח רחובות (גוש 3693, חלקה 17) | $Brand"
  description = 'קרקע חקלאית במזרח רחובות, כ-150 מטר משכונת רחובות מזרח (תמ״ל 3003). חוות דעת שמאית לפי תקן 22, הסכם שיתוף אחד ונאמנות. החל מ-190,000 ש"ח.'
  body = $rvBody
  schema = @($orgSchema, (Breadcrumb @(@('דף הבית', '/'), @('קרקע להשקעה במזרח רחובות', '/rehovot/'))), (FaqSchema $rvBody))
})

# ---------- 404 ----------
WriteFile '404.html' (Page @{
  path = '/404.html'; home = $false; ogType = 'website'; navActive = ''; noindex = $true
  title = "העמוד לא נמצא | $Brand"; description = 'העמוד שחיפשתם לא נמצא.'
  body = '<section class="nf"><div class="container"><span class="eyebrow">404</span><h1 class="title">העמוד שחיפשתם לא נמצא</h1><p class="lead">ייתכן שהכתובת השתנתה. אפשר לחזור לדף הבית.</p><p style="text-align:center"><a href="/" class="btn btn-navy">לדף הבית</a></p></div></section>'
  schema = @()
})

# ---------- sitemap / robots / headers ----------
$urls = @(@('/', '1.0'), @('/rehovot/', '0.9'))
$sm = '<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "`n" +
  (($urls | % { "  <url><loc>$SiteUrl$($_[0])</loc><lastmod>$Today</lastmod><priority>$($_[1])</priority></url>" }) -join "`n") + "`n</urlset>`n"
WriteFile 'sitemap.xml' $sm
WriteFile 'robots.txt' "User-agent: *`nAllow: /`nDisallow: /404.html`n`nSitemap: $SiteUrl/sitemap.xml`n"
WriteFile '_headers' @"
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/assets/*
  Cache-Control: public, max-age=86400
"@
"built: index, rehovot, 404, sitemap, robots"
