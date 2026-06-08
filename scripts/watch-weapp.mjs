import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const watchTargets = ['src', 'config', 'types'].map((target) =>
  path.join(rootDir, target),
)

let building = false
let pendingBuild = false
let buildTimer = null

const runBuild = () => {
  if (building) {
    pendingBuild = true
    return
  }

  building = true
  console.log('[weapp-sync] building mini program...')

  const child = spawn('corepack', ['pnpm', 'build:weapp'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  })

  child.on('close', (code) => {
    building = false

    if (code === 0) {
      console.log('[weapp-sync] build complete.')
    } else {
      console.log(`[weapp-sync] build exited with code ${code}.`)
    }

    if (pendingBuild) {
      pendingBuild = false
      runBuild()
    }
  })
}

const scheduleBuild = () => {
  if (buildTimer) {
    clearTimeout(buildTimer)
  }

  buildTimer = setTimeout(() => {
    buildTimer = null
    runBuild()
  }, 250)
}

const watchers = watchTargets.map((target) =>
  watch(
    target,
    {
      recursive: true,
    },
    (_eventType, filename) => {
      if (!filename) {
        return
      }

      const normalizedName = filename.toString().replaceAll('\\', '/')
      if (normalizedName.includes('/dist/') || normalizedName.startsWith('dist/')) {
        return
      }

      console.log(`[weapp-sync] change detected: ${normalizedName}`)
      scheduleBuild()
    },
  ),
)

process.on('SIGINT', () => {
  watchers.forEach((watcher) => watcher.close())
  process.exit(0)
})

process.on('SIGTERM', () => {
  watchers.forEach((watcher) => watcher.close())
  process.exit(0)
})

runBuild()
