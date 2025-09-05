# ===============================
# GitHub Webhook Manual Test Script
# ===============================

# 1. Configuration
$NgrokUrl = "https://5ae6c7885a97.ngrok-free.app"   # <-- Replace with your active ngrok URL
$WebhookPath = "/webhooks/github"
$TestFile = ".\test.json"
$WebhookSecret = "mysecret123!@#"  # Must match your .env GITHUB_WEBHOOK_SECRET

Write-Host "=== GitHub Webhook Test Script ===" -ForegroundColor Cyan

# 2. Ensure test.json exists, or create a new one
if (!(Test-Path $TestFile)) {
    Write-Host "test.json not found. Creating a new one..." -ForegroundColor Yellow
    @"
{
  "action": "opened",
  "pull_request": {
    "number": 1,
    "title": "Test Pull Request",
    "user": { "login": "Mahfooz" },
    "state": "open",
    "html_url": "https://github.com/Mohammed-bm/exam-app/pull/1",
    "diff_url": "https://github.com/Mohammed-bm/exam-app/pull/1.diff"
  },
  "repository": {
    "full_name": "Mohammed-bm/exam-app"
  }
}
"@ | Out-File -Encoding UTF8 $TestFile
    Write-Host "Created test.json with sample data." -ForegroundColor Green
} else {
    Write-Host "Found existing test.json file." -ForegroundColor Green
}

# 3. Load JSON body
try {
    $body = Get-Content -Raw -Path $TestFile
    Write-Host "Loaded test.json into memory." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to read test.json. Check the file path!" -ForegroundColor Red
    exit 1
}

# 4. Generate X-Hub-Signature-256 header
$Hmac = New-Object System.Security.Cryptography.HMACSHA256
$Hmac.Key = [Text.Encoding]::UTF8.GetBytes($WebhookSecret)
$BodyBytes = [Text.Encoding]::UTF8.GetBytes($body)
$HashBytes = $Hmac.ComputeHash($BodyBytes)

# Convert bytes to lowercase hex string
$HexHash = -join ($HashBytes | ForEach-Object { "{0:x2}" -f $_ })
$Signature = "sha256=$HexHash"

Write-Host "Generated HMAC signature: $Signature" -ForegroundColor Yellow

# 5. Full webhook URL
$FullUrl = "$NgrokUrl$WebhookPath"
Write-Host "Sending POST request to: $FullUrl" -ForegroundColor Cyan

# 6. Send POST request to webhook
$response = Invoke-WebRequest `
    -Method POST `
    -Uri $FullUrl `
    -Headers @{
        "Content-Type" = "application/json";
        "X-GitHub-Event" = "pull_request";
        "X-Hub-Signature-256" = $Signature
    } `
    -Body $body

# 7. Output response
Write-Host "=== Response ===" -ForegroundColor Yellow
$response.Content

Write-Host "=== Test Completed ===" -ForegroundColor Cyan
