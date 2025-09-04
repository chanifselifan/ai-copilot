# Hapus semua folder .git di subdirectory (backend, mobile, infra, dll)
Get-ChildItem -Path . -Recurse -Force -Directory -Filter ".git" | ForEach-Object {
    Write-Host "Menghapus $($_.FullName) ..."
    Remove-Item -Recurse -Force -LiteralPath $_.FullName
}
Write-Host "Selesai! Semua folder .git di subdirektori sudah dihapus."
