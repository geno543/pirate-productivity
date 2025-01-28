# Sound file URLs (using direct MP3 files)
$sounds = @{
    "button-click.mp3" = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
    "notification.mp3" = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    "quest-complete.mp3" = "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"
    "coin-collect.mp3" = "https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3"
    "ship-move.mp3" = "https://assets.mixkit.co/active_storage/sfx/2064/2064-preview.mp3"
    "new-quest.mp3" = "https://assets.mixkit.co/active_storage/sfx/2530/2530-preview.mp3"
    "sail.mp3" = "https://assets.mixkit.co/active_storage/sfx/2528/2528-preview.mp3"
    "storm.mp3" = "https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3"
}

# Create sounds directory if it doesn't exist
$soundsDir = "public/sounds"
if (-not (Test-Path $soundsDir)) {
    New-Item -ItemType Directory -Path $soundsDir | Out-Null
}

# Download each sound file
foreach ($sound in $sounds.GetEnumerator()) {
    $outputFile = Join-Path $soundsDir $sound.Key
    Write-Host "Downloading $($sound.Key)..."
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $sound.Value -OutFile $outputFile -Headers @{
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            "Accept" = "audio/mpeg,audio/*;q=0.9,*/*;q=0.8"
            "Referer" = "https://mixkit.co/"
        }
        Write-Host "Successfully downloaded $($sound.Key)"
    }
    catch {
        Write-Host "Failed to download $($sound.Key): $_"
    }
}

Write-Host "All sound downloads completed!"
