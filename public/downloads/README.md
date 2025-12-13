# SiteHub 客户端下载

## 📦 构建和发布流程

### 1. Android APK
```bash
cd desktop-apps/android-twa
./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../../public/downloads/sitehub-android.apk
```

### 2. Windows MSI
```bash
cd desktop-apps/windows-tauri
cargo tauri build
cp src-tauri/target/release/bundle/msi/SiteHub_*.msi ../../public/downloads/sitehub-windows-x64.msi
```

### 3. macOS DMG (Intel)
```bash
cd desktop-apps/mac-tauri
cargo tauri build --target x86_64-apple-darwin
cp src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/SiteHub_*.dmg ../../public/downloads/sitehub-macos-x64.dmg
```

### 4. macOS DMG (Apple Silicon)
```bash
cd desktop-apps/mac-tauri
cargo tauri build --target aarch64-apple-darwin
cp src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/SiteHub_*.dmg ../../public/downloads/sitehub-macos-arm64.dmg
```

### 5. iOS App Store
- 在 `desktop-apps/ios-capacitor` 目录中构建
- 通过 Xcode Archive 并提交到 App Store
- 更新下载组件中的 App Store URL

## 🔧 配置说明

- 所有客户端应用都会自动加载当前环境的网站URL
- 国内版本通过 `NEXT_PUBLIC_DEPLOYMENT_REGION=china` 环境变量启用
- 国外版本通过 `NEXT_PUBLIC_DEPLOYMENT_REGION=overseas` 环境变量启用

## 📋 验收标准

- [ ] Android APK 可以正常安装和运行
- [ ] Windows MSI 可以正常安装和运行
- [ ] macOS DMG 可以正常安装和运行
- [ ] iOS App Store 应用可以正常下载
- [ ] 所有客户端启动后显示正确的网站内容
- [ ] 中英文界面显示正常
