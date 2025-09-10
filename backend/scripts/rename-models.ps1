# scripts/rename-models.ps1
# Usage: run from backend root. Make sure to commit changes first.

$dryRun = $false   # set to $true to preview only (no file moves/edits)
$backupDir = ".\archive\model_rename_backups"
$reportFile = ".\rename_report.txt"

# canonical target folders
$academicFolder = ".\models\academic"
$coreFolder = ".\models\core"

# create folders
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Force -Path $backupDir | Out-Null }
if (-not (Test-Path $academicFolder)) { New-Item -ItemType Directory -Force -Path $academicFolder | Out-Null }
if (-not (Test-Path $coreFolder)) { New-Item -ItemType Directory -Force -Path $coreFolder | Out-Null }

# helper functions
function To-Kebab($name) {
  # convert CamelCase or PascalCase or mixed-file-name into kebab-case with .model.js suffix
  # Examples: AcademicClass -> academic-class.model.js
  #           TeacherModel.js -> teacher.model.js
  $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
  # remove trailing "Model" if present (common in your repo)
  if ($base -match "(?i)model$") {
    $base = $base -replace "(?i)model$",""
  }
  # convert Pascal/Camel to kebab: insert dash before capitals, lower
  $k = ($base -replace '([a-z0-9])([A-Z])', '$1-$2') -replace '_','-' -replace '\s+','-'
  $k = $k.Trim('-').ToLower()
  return "$k.model.js"
}

function Backup-File($path) {
  if (-not (Test-Path $path)) { return }
  $dest = Join-Path $backupDir (Split-Path $path -Leaf)
  if (-not (Test-Path $dest)) { Copy-Item -LiteralPath $path -Destination $dest -Force }
}

# collect model files we expect to rename
# We'll gather all .js files under models/ (except node_modules)
$models = Get-ChildItem -Path .\models -Recurse -File -Filter *.js | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\archive\\" }

# We'll create a mapping table: originalFullPath -> newFullPath
$map = @{}

foreach ($m in $models) {

  $rel = $m.FullName.Substring((Get-Location).Path.Length + 1)  # relative path
  # Skip files that already follow the ".model.js" kebab pattern in the correct folders
  if ($m.Name -match '\.model\.js$' -and ($m.DirectoryName -like "*\models\academic*" -or $m.DirectoryName -like "*\models\core*")) {
    Add-Content $reportFile "SKIP (already ok): $rel"
    continue
  }

  # Decide whether this model is academic or core
  # Heuristic:
  # - If path already contains "ClassManagementModels" or filename matches words: Academic, Class, Section, Enrollment, Assessment, ResultSummary, TeacherAttendance, Attendance, ClassTemplate -> academic
  # - Else -> core
  $academicKeywords = @("Academic","ClassTemplate","Class","Section","Enrollment","Assessment","ResultSummary","TeacherAttendance","Attendance","AcademicClass","AcademicSession")
  $isAcademic = $false
  foreach ($k in $academicKeywords) {
    if ($m.FullName -match [regex]::Escape($k) -or $m.Name -match [regex]::Escape($k)) { $isAcademic = $true; break }
  }

  $newFileName = To-Kebab($m.Name)
if ($isAcademic) {
  $targetDir = $academicFolder
} else {
  $targetDir = $coreFolder
}

$newFull = Join-Path $targetDir $newFileName

  # Avoid collisions: if newFull already exists, append a numeric suffix
  $counter = 1
  $candidate = $newFull
  while ((Test-Path $candidate) -and ((Get-Item $candidate).FullName -ne $m.FullName)) {
    $candidate = [System.IO.Path]::Combine($targetDir, ([System.IO.Path]::GetFileNameWithoutExtension($newFileName) + "-$counter" + ".js"))
    $counter++
  }
  $finalNew = $candidate

  $map[$m.FullName] = $finalNew
}

# Preview
Add-Content $reportFile "Model rename mapping preview: $(Get-Date -Format u)`n"
foreach ($k in $map.Keys) {
  $r = $k.Substring((Get-Location).Path.Length + 1)
  $n = $map[$k].Substring((Get-Location).Path.Length + 1)
  Add-Content $reportFile "MAP: $r -> $n"
}

if ($dryRun) {
  Write-Host "Dry run mode. No files moved. See $reportFile for mapping."
  exit 0
}

# 1) Backup all files to backupDir
foreach ($orig in $map.Keys) {
  Backup-File $orig
}

# 2) Move files
foreach ($orig in $map.Keys) {
  $dest = $map[$orig]
  $relOrig = $orig.Substring((Get-Location).Path.Length + 1)
  $relDest = $dest.Substring((Get-Location).Path.Length + 1)

  # create dest folder if not exists
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }

  # If dest exists, back it up first
  if (Test-Path $dest) {
    $bak = Join-Path $backupDir (Split-Path $dest -Leaf)
    Move-Item -Force -LiteralPath $dest -Destination $bak
    Add-Content $reportFile "BACKED EXISTING DEST: $relDest -> archive"
  }

  # Move original
  Move-Item -Force -LiteralPath $orig -Destination $dest
  Add-Content $reportFile "MOVED: $relOrig -> $relDest"
  Write-Host "MOVED: $relOrig -> $relDest"
}

# 3) Update require() strings across the repo (best effort)
Add-Content $reportFile "`nNow updating require() occurrences (best-effort replacements)`n"

# Build search/replace pairs:
$replacements = @()
foreach ($orig in $map.Keys) {
  $origName = [System.IO.Path]::GetFileNameWithoutExtension($orig)   # e.g., ClassModel
  $newName = [System.IO.Path]::GetFileNameWithoutExtension($map[$orig]) # e.g., academic-class.model
  # Create various patterns to replace:
  # require('../models/Original') OR require('../models/Original.js') OR require('../models/Folder/Original')
  # We'll replace only the filename part, preserving existing relative folder prefix where possible.
  $replacements += @{
    search = [regex]::Escape($origName)  # plain text match of file base name
    replace = $newName
  }
}

# Search all .js files excluding node_modules and archive backups
$jsFiles = Get-ChildItem -Recurse -Filter *.js -File | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\archive\\" }

foreach ($jf in $jsFiles) {
  $path = $jf.FullName
  $content = Get-Content -Raw -Path $path
  $origContent = $content
  $changed = $false

  foreach ($pair in $replacements) {
    $s = $pair.search
    $r = $pair.replace

    # Replace require('.../OrigName') => require('.../new-name.model')
    # We'll look for patterns: require(".../OrigName") or require('.../OrigName') or require("../models/OrigName")
    $pattern1 = "require\(([""'])([^""']*\/)$s(\.js)?\1\)"
    $replacement1 = "require($1`$2$r`$1)"  # careful: use backticks to escape $ inside string
    try {
      $new = [regex]::Replace($content, $pattern1, $replacement1)
      if ($new -ne $content) { $content = $new; $changed = $true }
    } catch {
      # ignore regex exceptions
    }

    # Replace require('./models/OrigName') or require('../OrigName') where no folder prefix
    $pattern2 = "require\(([""'])([^""']*\/)?$s(\.js)?\1\)"
    $replacement2 = "require($1$2$r$1)"
    try {
      $new2 = [regex]::Replace($content, $pattern2, $replacement2)
      if ($new2 -ne $content) { $content = $new2; $changed = $true }
    } catch {}
  }

  if ($changed -and $content -ne $origContent) {
    # backup original file
    $bak = $path + ".rename.bak"
    if (-not (Test-Path $bak)) { Copy-Item -LiteralPath $path -Destination $bak -Force }
    Set-Content -Path $path -Value $content -Encoding utf8
    Add-Content $reportFile "PATCHED REQUIRES: $path (backup: $bak)"
    Write-Host "PATCHED: $path"
  }
}

Add-Content $reportFile "`nRename completed at $(Get-Date -Format u) `nReview the report and the backups in $backupDir"
Write-Host "Rename script completed. See $reportFile for details and backups in $backupDir"
