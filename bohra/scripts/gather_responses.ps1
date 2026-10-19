$base = 'http://localhost:4000/api'
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTcxYmJkOWRmMzgxZjI5MjM3NDg4NDQiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluMUBnbWFpbC5jb20iLCJuYW1lIjoiQWRtaW4gT25lIiwiZG9tYWluIjoicHJvcGVydHkiLCJkZXNpZ25hdGlvbiI6ImVtcGxveWVlIiwiaWF0IjoxNzcwNjk3NDM4LCJleHAiOjE3NzA3Mjk4Mzh9.Wmttpa1bgkcTkTz7IkGaDcKh_f2BjYiuJkH2JtvwoA8'

$endpoints = @(
    @{ key = 'pleads'; url = "$base/pleads" },
    @{ key = 'fleads'; url = "$base/fleads" },
    @{ key = 'tasknotes'; url = "$base/tasknotes" },
    @{ key = 'notifications'; url = "$base/notifications" },
    @{ key = 'spendings'; url = "$base/opera/spending" },
    @{ key = 'users'; url = "$base/auth/users" }
)

$result = @{}

foreach ($e in $endpoints) {
    try {
        Write-Host "Fetching $($e.url)"
        $resp = Invoke-RestMethod -Uri $e.url -Headers @{ Authorization = "Bearer $token" } -Method Get -ErrorAction Stop
        $result[$e.key] = $resp
    } catch {
        $result[$e.key] = @{ error = $_.Exception.Message }
    }
}

$outPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) 'api_responses.json'
$result | ConvertTo-Json -Depth 10 | Out-File -FilePath $outPath -Encoding utf8
Write-Host "Saved responses to $outPath"