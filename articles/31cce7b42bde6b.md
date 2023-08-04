---
title: "[PowerShell 7] npmのグローバルインストールを管理するスクリプト"
emoji: "🐚"
type: "tech"
topics: ["powershell", "npm"]
published: true
---

# 一覧のパッケージをインストール

```
📁
 ├ 📄 list (一覧)
 └ 📄 install.ps1
```

```txt:list
package-spec-aaa
package-spec-bbb
```

```powershell:install.ps1
Get-Content "$PSScriptRoot/list"
| Where-Object {
  $_ -ne ''
}
| & {
  if (!$input.MoveNext()) {
    exit
  }
  else {
    $input.Reset()
  }
  npm install --global $input
}
```

# 全てのパッケージをアンインストール

```powershell:uninstall.ps1
try {
  npm ls --global --depth=0 --json
  | ConvertFrom-Json
  | Select-Object -ExpandProperty dependencies -ErrorAction Stop
  | Get-Member -MemberType NoteProperty
  | Select-Object -ExpandProperty Name
  | & {
    npm uninstall --global $input
  }
  Remove-Item -Recurse "$(npm root --global)/@*"
}
catch {}
```

# 全てのパッケージをアップデート

```powershell:update.ps1
npm outdated --global --json
| ConvertFrom-Json
| Get-Member -MemberType NoteProperty
| Select-Object -ExpandProperty Name
| & {
  if (!$input.MoveNext()) {
    exit
  }
  else {
    $input.Reset()
  }
  npm uninstall --global $input
  npm install --global $input
}
```

# end
