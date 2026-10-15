# Renders the app icon (spider logo on a dark rounded square) at several sizes
# as PNGs. scripts/make-icon.js then packs them into assets/icon.ico.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/make-icon.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\build\icon'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

# Rounded dark square
$radius = 48
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $radius, $radius, 180, 90)
$path.AddArc($size - $radius, 0, $radius, $radius, 270, 90)
$path.AddArc($size - $radius, $size - $radius, $radius, $radius, 0, 90)
$path.AddArc(0, $size - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 10, 10, 10))), $path)
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 0, 204, 51)), 6
$g.DrawPath($pen, $path)

$green = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 65))
$glow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 0, 255, 65))
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center

$logoFont = New-Object System.Drawing.Font 'Consolas', 58, ([System.Drawing.FontStyle]::Bold)
$nameFont = New-Object System.Drawing.Font 'Consolas', 40, ([System.Drawing.FontStyle]::Bold)
$logoRect = New-Object System.Drawing.RectangleF 0, 36, $size, 100
$nameRect = New-Object System.Drawing.RectangleF 0, 136, $size, 80

# Soft glow behind the text, then the text
foreach ($d in @(-2, 2)) {
  $g.DrawString('/\../\', $logoFont, $glow, (New-Object System.Drawing.RectangleF ($logoRect.X + $d), ($logoRect.Y + $d), $logoRect.Width, $logoRect.Height), $fmt)
  $g.DrawString('SPIDER', $nameFont, $glow, (New-Object System.Drawing.RectangleF ($nameRect.X + $d), ($nameRect.Y + $d), $nameRect.Width, $nameRect.Height), $fmt)
}
$g.DrawString('/\../\', $logoFont, $green, $logoRect, $fmt)
$g.DrawString('SPIDER', $nameFont, $green, $nameRect, $fmt)
$g.Dispose()

foreach ($s in @(256, 128, 64, 48, 32, 16)) {
  $scaled = New-Object System.Drawing.Bitmap $s, $s
  $sg = [System.Drawing.Graphics]::FromImage($scaled)
  $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $sg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $sg.DrawImage($bmp, 0, 0, $s, $s)
  $sg.Dispose()
  $scaled.Save((Join-Path $outDir "icon-$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $scaled.Dispose()
}
$bmp.Dispose()
Write-Output "wrote PNGs to $outDir"
