---
title: "F# - Google Drive API で OCR"
emoji: "📑"
type: "tech"
topics: ["dotnet", "fsharp", "googledrive", "OCR"]
published: true
---

# 前提

- Google Drive には PDF や画像ファイルをドキュメントに変換する OCR 機能があります[^1]。

[^1]: https://support.google.com/drive/answer/176692

# 事前準備

1. Drive API、Docs API が有効な Google Cloud Platform のプロジェクトを用意する [[↗]](https://developers.google.com/workspace/guides/create-project)。
2. `credentials.json` を作る [[↗]](https://developers.google.com/workspace/guides/create-credentials)。

# 環境

- [Visual Studio Code [↗]](https://code.visualstudio.com/)
- [.NET SDK 5.0 [↗]](https://dotnet.microsoft.com/download)

# プロジェクトの構成

## プロジェクトを作成する

```powershell
dotnet new console -lang "F#" -o 場所\プロジェクト名
```

## ライブラリを追加する

作成したプロジェクトを Visual Studio Code で開き、ターミナル (Ctrl + `) で下記のコマンドを実行する。

```powershell
dotnet add package Google.Apis.Drive.v3
dotnet add package Google.Apis.Docs.v1
```

## `credentials.json` を利用できるようにする

プロジェクトフォルダの直下に `credentials.json` を配置。

```diff
  プロジェクト
   ├─ プロジェクト.fsproj
   ├─ Program.fs
+  └─ credentials.json
```

`.fsproj` に `credentials.json` を `bin\Debug\net5.0` にコピーする設定を追記する。

```diff xml:.fsproj
    <ItemGroup>
+     <Content Include="credentials.json">
+       <CopyToOutputDirectory>Always</CopyToOutputDirectory>
+     </Content>
      <Compile Include="Program.fs" />
    </ItemGroup>
```

## `Program.fs` を変更する

変数 `driveService`、`docsService` から Google Drive API、Google Docs API の機能を呼び出します。

```fsharp:Program.fs
let Scopes = [|
    Google.Apis.Drive.v3.DriveService.Scope.Drive
    Google.Apis.Docs.v1.DocsService.Scope.DocumentsReadonly
|]

let ApplicationName = "Google Drive OCR"

let fileStream = new System.IO.FileStream("credentials.json", System.IO.FileMode.Open, System.IO.FileAccess.Read)
let clientSecrets = Google.Apis.Auth.OAuth2.GoogleClientSecrets.Load(fileStream).Secrets
fileStream.Dispose()
let cancellationToken = System.Threading.CancellationToken.None
let fileDataStore = new Google.Apis.Util.Store.FileDataStore("token.json", true)
let userCredential = Google.Apis.Auth.OAuth2.GoogleWebAuthorizationBroker.AuthorizeAsync(clientSecrets, Scopes, "user", cancellationToken, fileDataStore).Result

let initializer = new Google.Apis.Services.BaseClientService.Initializer()
initializer.ApplicationName <- ApplicationName
initializer.HttpClientInitializer <- userCredential

let driveService = new Google.Apis.Drive.v3.DriveService(initializer)
let docsService = new Google.Apis.Docs.v1.DocsService(initializer)
```

### `Scopes`

プログラムが利用する機能。

- [Google.Apis.Drive.v3 [↗]](https://googleapis.dev/dotnet/Google.Apis.Drive.v3/latest/api/Google.Apis.Drive.v3.DriveService.Scope.html)
- [Google.Apis.Docs.v1 [↗]](https://googleapis.dev/dotnet/Google.Apis.Docs.v1/latest/api/Google.Apis.Docs.v1.DocsService.Scope.html)

# 実装例

```fsharp
let DeleteFile fileId =
    let deleteRequest = driveService.Files.Delete fileId
    deleteRequest.Execute() |> ignore

let CheckMimeMapping (filePath: string) =
    let ext = System.IO.Path.GetExtension(filePath).ToLower()
    match ext with
    | ".jpeg" | ".jpg" -> "image/jpeg"
    | ".png" -> "image/png"
    | ".gif" -> "image/gif"
    | ".pdf" -> "application/pdf"
    | _ -> failwith "It's not an image!"

let UploadImageFile (filePath: string) =
    let generateIdsRequest = driveService.Files.GenerateIds()
    generateIdsRequest.Count <- 1
    let id = generateIdsRequest.Execute().Ids.[0]

    let metadata = new Google.Apis.Drive.v3.Data.File()
    metadata.Id <- id

    let fileStream = new System.IO.FileStream(filePath, System.IO.FileMode.Open)
    let createMediaUpload = driveService.Files.Create(metadata, fileStream, CheckMimeMapping filePath)
    let iUploadProgress = createMediaUpload.Upload()
    fileStream.Dispose()

    if iUploadProgress.Status = Google.Apis.Upload.UploadStatus.Failed then
        raise iUploadProgress.Exception
    else
        id

let ConvertImageToDocument imageId =
    let metadata = new Google.Apis.Drive.v3.Data.File()
    metadata.MimeType <- "application/vnd.google-apps.document"

    let copyRequest = driveService.Files.Copy(metadata, imageId)
    copyRequest.OcrLanguage <- "ja"
    let documentId = copyRequest.Execute().Id

    DeleteFile imageId
    documentId

let ReadParagraphElements (element: Google.Apis.Docs.v1.Data.ParagraphElement) =
    let textRun = element.TextRun
    if textRun = null || textRun.Content = null then
        ""
    else
        textRun.Content

let rec ReadStructuralElements (elements: System.Collections.Generic.IList<Google.Apis.Docs.v1.Data.StructuralElement>) =
    let mutable text = ""

    for element in elements do
        if element.Paragraph <> null then
            for paragraphElement in element.Paragraph.Elements do
                text <- $"{text}{ReadParagraphElements paragraphElement}"
        elif element.Table <> null then
            for tableRow in element.Table.TableRows do
                for tableCell in tableRow.TableCells do
                    text <- $"{text}{ReadStructuralElements tableCell.Content}"
        elif element.TableOfContents <> null then
            text <- $"{text}{ReadStructuralElements element.TableOfContents.Content}"

    text

let GetDocumentText documentId =
    let getRequest = docsService.Documents.Get documentId
    let elements = getRequest.Execute().Body.Content
    DeleteFile documentId
    ReadStructuralElements elements

let Ocr =
    UploadImageFile
    >> ConvertImageToDocument
    >> GetDocumentText
```

```fsharp
Ocr @"画像ファイルのパス"
|> printfn "%s"
```

# 解説

今回の処理における中心的な内容を解説します。
Google.Apis.Drive.v3 を F# で使う上での基本知識は以下の記事で扱っています。

- [NET 5, F# - Google Drive API Quickstart +α [↗]](https://zenn.dev/shikatan/articles/6009f0f32358f55c1e76)

## MIME タイプの取得

ファイルパスを渡すと MIME タイプを返す関数です。
Google Drive で変換可能な形式のみ対応させています。

```fsharp
let CheckMimeMapping (filePath: string) =
    let ext = System.IO.Path.GetExtension(filePath).ToLower()
    match ext with
    | ".jpeg" | ".jpg" -> "image/jpeg"
    | ".png" -> "image/png"
    | ".gif" -> "image/gif"
    | ".pdf" -> "application/pdf"
    | _ -> failwith "It's not an image!"
```

## 画像をドキュメントに変換する

ドキュメントファイルを表す MIME タイプに変更する。

```fsharp
metadata.MimeType <- "application/vnd.google-apps.document"
```

OCR で認識する言語 (ISO 639-1 code) を設定する。
日本語を選択すれば英字も扱えるようです。

```fsharp
copyRequest.OcrLanguage <- "ja"
```

## テキストの取得

ドキュメントのデータは階層構造に格納されていて、テキスト全文が欲しい場合は自分で処理を書く必要があるようです。
今回は [公式のサンプル [↗]](https://developers.google.com/docs/api/samples/extract-text) を F# に書き換えてみました。

```fsharp
let ReadParagraphElements (element: Google.Apis.Docs.v1.Data.ParagraphElement) =
    let textRun = element.TextRun
    // 存在しない場合がある。
    if textRun = null || textRun.Content = null then
        ""
    else
        textRun.Content

let rec ReadStructuralElements (elements: System.Collections.Generic.IList<Google.Apis.Docs.v1.Data.StructuralElement>) =
    let mutable text = ""

    for element in elements do
        if element.Paragraph <> null then
            for paragraphElement in element.Paragraph.Elements do
                text <- $"{text}{ReadParagraphElements paragraphElement}"
        elif element.Table <> null then
            for tableRow in element.Table.TableRows do
                for tableCell in tableRow.TableCells do
                    text <- $"{text}{ReadStructuralElements tableCell.Content}"
        elif element.TableOfContents <> null then
            text <- $"{text}{ReadStructuralElements element.TableOfContents.Content}"

    text
```

# 関連記事

- [.NET 5, F# - Windows.Media.Ocr を使う [↗]](https://zenn.dev/shikatan/articles/451245de0f5dd70d28be)

# end