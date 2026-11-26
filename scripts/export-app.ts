import * as fs from "node:fs";
import * as path from "path";

/**
 * Automated Handover Script for Turborepo Apps
 *
 * This script flattens a monorepo app into a standalone folder,
 * injecting local config packages and resolving dependencies.
 */

async function exportApp(appName: string) {
  const rootDir = process.cwd();
  const appDir = path.join(rootDir, "apps", appName);
  const distRootDir = path.join(rootDir, "dist", "handover");
  const targetDir = path.join(distRootDir, appName);

  if (!fs.existsSync(appDir)) {
    console.error(`Error: App directory not found: ${appDir}`);
    process.exit(1);
  }

  console.log(`🚀 Starting export for "${appName}"...`);
  console.log(`📂 Destination: ${targetDir}\n`);

  // 1. Clean and Create target directory
  if (fs.existsSync(distRootDir)) {
    console.log("🧹 Cleaning previous exports...");
    fs.rmSync(distRootDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 2. Copy App Files (excluding node_modules and .next)
  console.log("📦 Copying app files...");
  fs.cpSync(appDir, targetDir, {
    recursive: true,
    filter: (src) => !src.includes("node_modules") && !src.includes(".next") && !src.includes(".turbo"),
  });

  // 3. Setup Config Folders in Target
  const configsDir = path.join(targetDir, ".configs");
  const eslintConfigsDir = path.join(configsDir, "eslint");
  const tsConfigsDir = path.join(configsDir, "typescript");

  fs.mkdirSync(eslintConfigsDir, { recursive: true });
  fs.mkdirSync(tsConfigsDir, { recursive: true });

  // 4. Copy and Flatten Config Packages
  console.log("⚙️  Injecting configuration packages...");
  const configMapping = [
    {
      src: path.join(rootDir, "packages", "eslint-config"),
      dest: eslintConfigsDir,
      packageJsonName: "@taququr/eslint-config",
    },
    {
      src: path.join(rootDir, "packages", "typescript-config"),
      dest: tsConfigsDir,
      packageJsonName: "@taququr/typescript-config",
    },
  ];

  const requiredDeps = new Set<string>();

  for (const mapping of configMapping) {
    if (!fs.existsSync(mapping.src)) {
      console.warn(`⚠️  Warning: Config source not found: ${mapping.src}`);
      continue;
    }

    // Copy files, excluding node_modules and other artifacts
    fs.cpSync(mapping.src, mapping.dest, {
      recursive: true,
      filter: (src) => !src.includes("node_modules") && !src.includes(".git") && !src.includes(".turbo"),
    });
    const pkgJsonPath = path.join(mapping.dest, "package.json");
    if (fs.existsSync(pkgJsonPath)) fs.unlinkSync(pkgJsonPath);

    // Read source package.json to get dependencies needed by the client's app
    try {
      const pkgJsonRaw = fs.readFileSync(path.join(mapping.src, "package.json"), "utf-8");
      const pkgJson = JSON.parse(pkgJsonRaw);
      // We want the devDependencies of the config packages to be regular dependencies in the target app
      if (pkgJson.devDependencies) {
        Object.keys(pkgJson.devDependencies).forEach((dep: any) => requiredDeps.add(dep));
      }
    } catch (e) {
      console.warn(`⚠️  Could not parse package.json for ${mapping.packageJsonName}`);
    }
  }

  // 5. Copy registry configuration if it exists
  const npmrcPath = path.join(rootDir, ".npmrc");
  if (fs.existsSync(npmrcPath)) {
    console.log("📄 Copying .npmrc for authentication...");
    fs.copyFileSync(npmrcPath, path.join(targetDir, ".npmrc"));
  }

  // 6. Rewrite Config Files in Target App
  console.log("📝 Rewriting configuration imports...");

  // Transform eslint.config.mjs (if exists)
  const eslintFile = path.join(targetDir, "eslint.config.mjs");
  if (fs.existsSync(eslintFile)) {
    let content = fs.readFileSync(eslintFile, "utf-8");
    content = content.replace(/from\s+['"]@taququr\/eslint-config\/([^'"]+)['"]/g, (match, subpath) => {
      const fileSubpath = subpath === "next-js" ? "next.js" : subpath;
      return `from "./.configs/eslint/${fileSubpath}"`;
    });
    fs.writeFileSync(eslintFile, content);
    console.log(`   ✅ Updated eslint.config.mjs`);
  }

  // Transform tsconfig.json (if exists)
  const tsconfigFile = path.join(targetDir, "tsconfig.json");
  if (fs.existsSync(tsconfigFile)) {
    let content = fs.readFileSync(tsconfigFile, "utf-8");
    content = content.replace(
      /"extends":\s+"@taququr\/typescript-config\/([^'"]+)"/,
      '"extends": "./.configs/typescript/$1"',
    );
    fs.writeFileSync(tsconfigFile, content);
    console.log(`   ✅ Updated tsconfig.json`);
  }

  // 6. Update package.json in Target
  const targetPkgJsonPath = path.join(targetDir, "package.json");
  if (fs.existsSync(targetPkgJsonPath)) {
    let pkgJsonRaw = fs.readFileSync(targetPkgJsonPath, "utf-8");
    let pkgJson = JSON.parse(pkgJsonRaw);

    // Remove @taququr/* dependencies only if they are part of our config injection
    const pkgNamesToRemove = configMapping.map((m: any) => m.packageJsonName);
    const cleanDeps = (deps: any) => {
      if (!deps) return;
      Object.keys(deps).forEach((dep: string) => {
        if (pkgNamesToRemove.includes(dep)) {
          delete deps[dep];
        }
      });
    };

    cleanDeps(pkgJson.dependencies);
    cleanDeps(pkgJson.devDependencies);

    // Add the required dependencies from config packages into dependencies, 
    // but only if they aren't already listed in either dependencies or devDependencies.
    if (requiredDeps.size > 0) {
      pkgJson.dependencies = pkgJson.dependencies || {};
      for (const dep of requiredDeps) {
        const isAlreadyInDeps = pkgJson.dependencies[dep];
        const isAlreadyInDevDeps = pkgJson.devDependencies && pkgJson.devDependencies[dep];

        if (!isAlreadyInDeps && !isAlreadyInDevDeps) {
          // We don't know exact versions, so we mark them for Bun/NPM to resolve during install
          // Or we can use "*" which is safer for a client who just wants it to work.
          pkgJson.dependencies[dep] = "*";
        }
      }
    }

    fs.writeFileSync(targetPkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log("✅ Updated package.json with required dependencies");
  }

  console.log(`\n🎉 Export complete!`);
  console.log(`📂 Check your files in: ${distRootDir}`);
  console.log(`👉 To prepare for handover, run: cd "${targetDir}" && bun install\n`);
}

// Execution entry point
const appNameArg = process.argv[2];
if (!appNameArg) {
  console.error("Usage: bun scripts/export-app.ts <app_name>");
  process.exit(1);
}

exportApp(appNameArg).catch((err) => {
  console.error("❌ An error occurred:", err);
  process.exit(1);
});
