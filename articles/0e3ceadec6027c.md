---
title: "【.NET5, F#】System.Text.Json 基礎"
emoji: "📄"
type: "tech"
topics: [fsharp, json]
published: true
---

# System.Text.Json

.NET で JSON を扱うための標準ライブラリです。
JSON 文字列と .NET のコレクション型の相互変換を行う仕組みを含みます。

> https://docs.microsoft.com/ja-jp/dotnet/api/system.text.json

# この記事の目的

System.Text.Json を C# で使用する方法は[公式のページ](https://docs.microsoft.com/ja-jp/dotnet/standard/serialization/system-text-json-how-to)など充実しています。
この記事は、それらの情報を F# に利用するための補足記事となるように意識しています。

# この記事の構成

1. コレクション型について
2. 各方向の変換メソッドの記述方法
3. 対応する、型・コレクション・JSON の一覧

# コレクション型

System.Text.Json は標準だと F# 特有のコレクション型に対応していません[^1]。
特別な理由がなければ下記の .NET と共通の型を使用すると楽に使えます。

[^1]: https://docs.microsoft.com/ja-jp/dotnet/standard/serialization/system-text-json-supported-collection-types

```txt
{} → record
[] → array
```

# コレクション → JSON

```fsharp:実行部分
System.Text.Json.JsonSerializer.Serialize<📝型>(📝コレクション)
```

```fsharp:パスカルケース → キャメルケース
System.Text.Json.JsonSerializer.Serialize<📝型>(
    📝コレクション,
    System.Text.Json.JsonSerializerOptions(PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase)
)
```

# JSON → コレクション

```fsharp:実行部分
System.Text.Json.JsonSerializer.Deserialize<📝型>(📝JSON)
```

```fsharp:キャメルケース → パスカルケース
System.Text.Json.JsonSerializer.Deserialize<📝型>(
    📝JSON,
    System.Text.Json.JsonSerializerOptions(PropertyNameCaseInsensitive = true)
)
```

# object

```fsharp:型
type JsonX = {n: int}
```

```fsharp:コレクション
{ n = 10 }
```

```json:JSON
{"n":10}
```

# object#object

```fsharp:型 (1)
type JsonXObj = {n: int}
type JsonX = {obj: JsonXObj}
```

```fsharp:コレクション (1)
{ obj = { n = 20 } }
```

object の入れ子は匿名レコードでも表現できます。

```fsharp:型 (2)
type JsonX = {obj: {|n: int|}}
```

```fsharp:コレクション (2)
{ obj = {| n = 20 |} }
```

```json:JSON
{"obj":{"n":20}}
```

# array

```fsharp:型
type JsonX = {ary: array<int>}
```

```fsharp:コレクション
{ ary = [| 10; 20 |] }
```

```json:JSON
{"ary":[10,20]}
```

# プロパティ名の制御

```fsharp:型
type JsonX = {[<System.Text.Json.Serialization.JsonPropertyName("x-n")>] XN: int}
```

```fsharp:コレクション
{ XN = 30 }
```

```json:JSON
{"x-n":30}
```

# end
