# Downloads the app's dooicons SVGs into ../assets/icons, then regenerates
# ui/icons.ts. The pairs live in ui/icons.json (key -> dooicons name), and the
# style there picks the variant: solid, stroke, duo-stroke, duo-solid or
# contrast. https://dooicons.vercel.app/icons.json lists every name and the
# styles it offers; the SVGs are 24x24 and painted with currentColor.
# Behind a proxy: pwsh -NoProfile -File ui/fetch-icons.ps1 -Proxy http://host:port
param(
    [string]$Style,
    [string]$Proxy = $env:DOOICONS_PROXY
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$spec = Get-Content (Join-Path $PSScriptRoot 'icons.json') -Raw | ConvertFrom-Json
if (-not $Style) { $Style = $spec.style }
$curl = @('-sS', '--fail', '--retry', '5', '--retry-all-errors', '--max-time', '30')
if ($Proxy) { $curl += @('-x', $Proxy) }
foreach ($entry in $spec.dooicons.PSObject.Properties) {
    $name = $entry.Value
    $url = "https://dooicons.vercel.app/svg/$Style/$name.svg"
    $dest = Join-Path $root "assets/icons/$name.svg"
    & curl.exe @curl $url -o $dest
    if (-not (Test-Path $dest)) { throw "failed to fetch $url" }
    Write-Host "  $($entry.Name) <- $name.svg ($Style)"
}
& (Join-Path $PSScriptRoot 'prepare-assets.ps1')
