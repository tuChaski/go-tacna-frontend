# T102: emite JWT temporales solo dentro de una aplicación local/de pruebas.
# No cambia el reloj del sistema ni las cuentas, y no imprime credenciales.
param(
    [string]$Contenedor = 'gotacna-local-backend-1',
    [string]$Api = 'http://127.0.0.1:8001/api/v1'
)
$ErrorActionPreference = 'Stop'
$direccion = [Uri]$Api
if ($direccion.Host -notin @('127.0.0.1', 'localhost', '[::1]', '::1')) {
    throw 'La prueba solo admite una API en loopback.'
}
$emisor = @'
<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! $app->environment('local', 'testing')) {
    throw new RuntimeException('Los tokens de prueba solo se emiten en local/testing.');
}
$correo = getenv('T102_CORREO_PRUEBA');
if (! in_array($correo, ['admin@gotacna.pe', 'admin.empresa@gotacna.pe'], true)) {
    throw new RuntimeException('La cuenta no es una cuenta de demostración prevista.');
}
$usuario = App\Models\Usuario::where('correo', $correo)->where('activo', true)->firstOrFail();
$vigente = auth('api')->login($usuario);
Carbon\Carbon::setTestNow(Carbon\Carbon::now()->subMinutes(59)->subSeconds(30));
$corto = auth('api')->login($usuario);
Carbon\Carbon::setTestNow();
Carbon\Carbon::setTestNow(Carbon\Carbon::now()->subHours(2));
$vencido = auth('api')->login($usuario);
Carbon\Carbon::setTestNow();
echo json_encode(['rol' => $usuario->rol, 'vigente' => $vigente, 'corto' => $corto, 'vencido' => $vencido]);
'@

$variables = @('GOTACNA_API', 'GOTACNA_TOKEN_VIGENTE', 'GOTACNA_TOKEN_CORTO', 'GOTACNA_TOKEN_VENCIDO', 'GOTACNA_ROL_PRUEBA')
$anteriores = @{}
foreach ($nombre in $variables) { $anteriores[$nombre] = [Environment]::GetEnvironmentVariable($nombre, 'Process') }
try {
    foreach ($correo in @('admin@gotacna.pe', 'admin.empresa@gotacna.pe')) {
        $salida = $emisor | docker exec -i -e "T102_CORREO_PRUEBA=$correo" $Contenedor php
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron emitir los JWT temporales.' }
        $datos = ($salida -join "`n") | ConvertFrom-Json
        $env:GOTACNA_API = $Api
        $env:GOTACNA_TOKEN_VIGENTE = $datos.vigente
        $env:GOTACNA_TOKEN_CORTO = $datos.corto
        $env:GOTACNA_TOKEN_VENCIDO = $datos.vencido
        $env:GOTACNA_ROL_PRUEBA = $datos.rol
        node (Join-Path $PSScriptRoot 'integracion-sesion.mjs')
        if ($LASTEXITCODE -ne 0) { throw "Fallo la integración de $($datos.rol)." }
    }
} finally {
    foreach ($nombre in $variables) { [Environment]::SetEnvironmentVariable($nombre, $anteriores[$nombre], 'Process') }
}
