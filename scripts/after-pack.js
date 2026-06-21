/**
 * afterPack hook — runs after electron-builder unpacks the app but BEFORE
 * NSIS creates the installer.  We use rcedit to embed the custom icon directly
 * into the .exe so we don't need winCodeSign (which requires Developer Mode
 * on Windows to extract its symlinked macOS libraries).
 */

const path = require('path')
const { execFileSync } = require('child_process')

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return

  const exeName = `${context.packager.appInfo.productName}.exe`
  const exePath  = path.join(context.appOutDir, exeName)

  // Prefer the 64-bit binary shipped with the rcedit npm package.
  const rceditExe = path.resolve(
    __dirname, '..', 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe'
  )

  const iconPath = path.resolve(__dirname, '..', 'resources', 'icon.ico')

  console.log(`[afterPack] embedding icon into ${exeName} …`)

  execFileSync(rceditExe, [
    exePath,
    '--set-icon', iconPath,
    '--set-version-string', 'FileDescription', 'Ban — Local-first Kanban',
    '--set-version-string', 'ProductName',     'Ban',
    '--set-version-string', 'CompanyName',     'Ban',
    '--set-file-version',   '0.1.0.0',
    '--set-product-version','0.1.0.0',
    '--set-requested-execution-level', 'asInvoker',
  ])

  console.log('[afterPack] icon embedded successfully.')
}
