# Tiny static file server for previewing the site: powershell -File serve.ps1 [port]
# Also accepts POST /save?name=<file>.mp4|.webm and writes the body to the user's Desktop (used by promo.html to export the video).
param([int]$Port = 5173)
$root = $PSScriptRoot
$types = @{ ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript"; ".css" = "text/css"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".png" = "image/png"; ".svg" = "image/svg+xml"; ".tsx" = "text/plain; charset=utf-8"; ".mp4" = "video/mp4"; ".webm" = "video/webm" }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $root on http://localhost:$Port/"
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    if ($c.Request.HttpMethod -eq "POST" -and $c.Request.Url.AbsolutePath -eq "/save") {
      $name = $c.Request.QueryString["name"]
      if ($name -match '^[A-Za-z0-9._-]{1,80}\.(mp4|webm)$') {
        $out = Join-Path ([Environment]::GetFolderPath("Desktop")) $name
        $fs = [IO.File]::Create($out)
        $c.Request.InputStream.CopyTo($fs)
        $fs.Close()
        $msg = [Text.Encoding]::UTF8.GetBytes("saved " + (Get-Item $out).Length)
        $c.Response.StatusCode = 200
        $c.Response.OutputStream.Write($msg, 0, $msg.Length)
      } else { $c.Response.StatusCode = 400 }
    } else {
      $rel = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart("/")
      if (-not $rel) { $rel = "index.html" }
      $path = Join-Path $root $rel
      if ((Test-Path -LiteralPath $path -PathType Leaf) -and ((Resolve-Path -LiteralPath $path).Path.StartsWith($root))) {
        $bytes = [IO.File]::ReadAllBytes($path)
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $c.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
        $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $c.Response.StatusCode = 404
      }
    }
  } catch { $c.Response.StatusCode = 500 }
  $c.Response.Close()
}
