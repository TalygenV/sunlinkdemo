# Compress all battery GLB assets with Meshopt geometry + ETC1S texture compression

# Ensure the tools are installed once (will be skipped if already present)
if (-not (Get-Command 'gltf-transform' -ErrorAction SilentlyContinue)) {
    Write-Host 'Installing @gltf-transform/cli and meshoptimizer globally...' -ForegroundColor Cyan
    npm install -g @gltf-transform/cli meshoptimizer
}

# Detect KTX-Software CLI (needed for KTX2 texture compression)
$ktxAvailable = Get-Command 'ktx' -ErrorAction SilentlyContinue

# Decide texture compression flag
if ($ktxAvailable) {
    Write-Host '✓ KTX encoder found – using KTX2 texture compression.' -ForegroundColor Green
    $textureFlag = '--texture-compress ktx2'
} else {
    Write-Host '⚠ KTX encoder NOT found – falling back to original texture format (no loss of colour).' -ForegroundColor Yellow
    $textureFlag = '--texture-compress false'  # leave existing (already KTX2) textures untouched
}

# Change to the model directory (relative to repo root)
Set-Location -Path "src/products/batteries/model"

Write-Host "Compressing GLB files in $PWD" -ForegroundColor Green

# Loop through each *.glb that is NOT already compressed
Get-ChildItem -Filter "*.glb" | Where-Object { $_.Name -notmatch "-compressed\.glb$" } | ForEach-Object {
    $in  = $_.FullName
    $out = [System.IO.Path]::Combine($_.DirectoryName, "{0}-compressed.glb" -f $_.BaseName)

    Write-Host " → $($_.Name) -> $(Split-Path $out -Leaf)" -ForegroundColor Yellow

    # Remove existing compressed file if it exists so we always regenerate
    if (Test-Path $out) { Remove-Item $out -Force }

    # Run optimisation: Meshopt geometry + ETC1S texture compression (keeps colours)
    gltf-transform optimize `
        "$in" "$out" `
        --compress meshopt `
        $textureFlag `
        --texture-size 1024
}

Write-Host "Done!  Update your import paths to *-compressed.glb?url" -ForegroundColor Green 