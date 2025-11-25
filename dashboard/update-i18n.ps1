# Script para actualizar todos los archivos de next-intl a nuestro provider personalizado

$files = @(
    "app\[locale]\(auth)\register\page.tsx",
    "app\[locale]\(dashboard)\dashboard\admin\page.tsx",
    "app\[locale]\(dashboard)\dashboard\admin\customers\page.tsx",
    "app\[locale]\(dashboard)\dashboard\admin\customers\[id]\page.tsx",
    "app\[locale]\(dashboard)\dashboard\admin\plans\page.tsx",
    "app\[locale]\(dashboard)\dashboard\admin\subscriptions\page.tsx",
    "app\[locale]\(dashboard)\dashboard\admin\users\page.tsx",
    "app\[locale]\(dashboard)\dashboard\billing\page.tsx",
    "app\[locale]\(dashboard)\dashboard\chatbots\page.tsx",
    "app\[locale]\(dashboard)\dashboard\chatbots\[id]\page.tsx",
    "app\[locale]\(dashboard)\dashboard\conversations\page.tsx",
    "app\[locale]\(dashboard)\dashboard\conversations\[id]\page.tsx",
    "app\[locale]\(dashboard)\dashboard\knowledge\page.tsx",
    "app\[locale]\(dashboard)\dashboard\knowledge\[id]\page.tsx",
    "app\[locale]\(dashboard)\dashboard\settings\page.tsx",
    "app\[locale]\(dashboard)\dashboard\whatsapp\page.tsx",
    "app\[locale]\(dashboard)\dashboard\whatsapp\cloud\page.tsx",
    "app\[locale]\(dashboard)\dashboard\whatsapp\qr\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Actualizando: $file"
        $content = Get-Content $file -Raw
        
        # Reemplazar import de next-intl
        $content = $content -replace "from 'next-intl'", "from '@/components/i18n-provider'"
        
        # Guardar el archivo
        Set-Content -Path $file -Value $content -NoNewline
        
        Write-Host "✓ Actualizado: $file"
    } else {
        Write-Host "✗ No encontrado: $file"
    }
}

Write-Host "`n¡Actualización completada!"
