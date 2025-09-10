# ---------------------------
# Save & run from project root
# ---------------------------
$exclude = @('node_modules','uploads')
$maxDepth = 5
$outFile = "tree.txt"

function Print-Tree {
    param(
        [string]$path,
        [int]$level,
        [int]$max
    )

    if ($level -gt $max) { return }

    # list directories first, then files (sorted)
    $dirs = Get-ChildItem -LiteralPath $path -Directory -Force 2>$null |
            Where-Object { $exclude -notcontains $_.Name } |
            Sort-Object Name
    $files = Get-ChildItem -LiteralPath $path -File -Force 2>$null |
             Where-Object { $exclude -notcontains $_.Directory.Name -and $exclude -notcontains $_.Name } |
             Sort-Object Name

    foreach ($d in $dirs) {
        $indent = ('│   ' * ($level)) + "├── "
        "$indent$d" 
        Print-Tree -path $d.FullName -level ($level + 1) -max $max
    }

    foreach ($f in $files) {
        $indent = ('│   ' * ($level)) + "├── "
        "$indent$($f.Name)"
    }
}

# Print root
$root = Get-Location
"$(Get-Date -Format u)  Project tree (root: $($root.Path))" | Out-File -FilePath $outFile -Encoding utf8
"Exclude: $($exclude -join ', '); MaxDepth: $maxDepth" | Out-File -FilePath $outFile -Encoding utf8 -Append
" " | Out-File -FilePath $outFile -Encoding utf8 -Append

# Print top-level entries (folders/files in root)
$topDirs = Get-ChildItem -LiteralPath $root -Directory -Force 2>$null | Where-Object { $exclude -notcontains $_.Name } | Sort-Object Name
$topFiles = Get-ChildItem -LiteralPath $root -File -Force 2>$null | Where-Object { $exclude -notcontains $_.Name } | Sort-Object Name

foreach ($d in $topDirs) {
    "├── $($d.Name)" | Out-File -FilePath $outFile -Encoding utf8 -Append
    Print-Tree -path $d.FullName -level 1 -max $maxDepth | Out-File -FilePath $outFile -Encoding utf8 -Append
}
foreach ($f in $topFiles) {
    "├── $($f.Name)" | Out-File -FilePath $outFile -Encoding utf8 -Append
}

" " | Out-File -FilePath $outFile -Encoding utf8 -Append
"Finished writing tree to $outFile" | Out-File -FilePath $outFile -Encoding utf8 -Append
Write-Host "Tree written to $outFile"
