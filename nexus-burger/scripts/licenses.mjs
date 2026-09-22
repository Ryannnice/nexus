import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'))
const visited = new Set()
const records = []

async function collect(name, from = project) {
  let location = from,
    packagePath
  while (true) {
    const candidate = join(location, 'node_modules', name)
    try {
      await readFile(join(candidate, 'package.json'), 'utf8')
      packagePath = candidate
      break
    } catch {}
    if (dirname(location) === location) return
    location = dirname(location)
  }
  if (visited.has(packagePath)) return
  visited.add(packagePath)
  const pkg = JSON.parse(await readFile(join(packagePath, 'package.json'), 'utf8'))
  const files = (await readdir(packagePath)).filter((file) =>
    /^(license|licence|copying)(\.|$)/i.test(file)
  )
  const texts = []
  for (const file of files) {
    try {
      texts.push(await readFile(join(packagePath, file), 'utf8'))
    } catch {}
  }
  records.push(
    `${pkg.name}@${pkg.version}\nLicense: ${typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license)}\n${pkg.homepage || ''}\n\n${texts.join('\n\n') || 'See the package source for license terms.'}`
  )
  for (const dependency of Object.keys(pkg.dependencies || {}))
    await collect(dependency, packagePath)
}

for (const name of Object.keys(manifest.dependencies)) await collect(name)
records.sort()
await writeFile(
  join(project, 'public', 'THIRD-PARTY-LICENSES.txt'),
  'NEXUS Burger — runtime dependency license notices\n\n' +
    records.join('\n\n' + '='.repeat(80) + '\n\n'),
  'utf8'
)
console.log(`Saved ${records.length} dependency notices.`)
