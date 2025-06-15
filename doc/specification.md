# Visual Studio Code 拡張機能：バイナリエディタ仕様書

## 概要

本ドキュメントは、Visual Studio Code 拡張機能として実装される「バイナリエディタ」の仕様を記載するものである。本拡張機能は任意のバイナリファイルを解析・表示し、構造体に基づく可視化を提供するものである。

## 1. 基本仕様

- **起動方法**：特定の拡張子に依存せず、コマンドパレット（`Ctrl+Shift+P`）からバイナリエディタビューを起動。
- **ジャンプ機能**：`Ctrl+G`で指定アドレスにジャンプ可能。
- **ツールバー**：
  - オフセット入力欄を設置し、任意のオフセットを0バイト目とみなして表示切り替え。
  - 表示単位切替（1行あたり：8, 16, 32, 64, 128バイト）
- **ステータスバー表示**：
  - 現在のカーソル位置（アドレス）
  - オフセットを考慮した実アドレス
  - 選択範囲がある場合は選択バイト数を表示

## 2. 表示モード

- **HEXビュー**：

  - 左側：アドレス
  - 中央：HEX値
  - 右側：ASCII / UTF-8 / Shift-JIS の文字列表示（切替可能）

- **構造体ビュー**：

  - ツールバーのコンボボックスで構造体ファイル（`.h`）を選択可能
  - 選択すると HEX ビューから構造体ツリービューに切り替わる
  - Visual Studio のデバッガーライクな UI でメンバを展開可能
  - "目" アイコンをオフにすると HEX ビューに戻る

## 3. 構造体定義ファイル仕様

### 3.1 構文

- C++ライクな記法（サブセット）
- 対応構文：`struct`, `enum`, メンバ変数、ネスト構造体
- `enum` は既定の型（`: int`, `: uint8_t` など）を指定可能

```cpp
struct A {
  int size;
  int flags;
  Format format;
};

  // enum の既定の型は : int, : uint8_t, : uint32_t などで明示的に指定可能
enum class Format : uint8_t {
  RGB = 0,
  RGBA = 1,
  Depth = 2
};

```

### 3.2 配列のサイズ式
- メンバ変数は、**同一スコープまたは親スコープの読み取り済み変数**を使用してサイズを定義可能
- 配列サイズの定義には **四則演算（+, -, *, /）および括弧 `()` による式のグルーピング** が使用可能
```cpp
struct Image {
  int width;
  int height;
  char pixels[width * height];
};
```

### 3.3 スコープ越え参照

- 子構造体内で `親構造体のメンバ名.変数名` によりアクセス可能

```cpp
struct WeaponInfo {
  int nameLen;
};

struct Weapon {
  char name[weaponInfo.nameLen];
};

struct Enemy {
  int tagNum;
  WeaponInfo weaponInfo;
  int weaponNum;
  Weapon weapons[weaponNum];
};
```

- 暗黙的に `Enemy.weaponInfo` を `Weapon` 側で参照している。`Weapon` 自体に `weaponInfo` が存在しない場合は、親スコープ（`Enemy`）の同名メンバを遡って検索する。

### 3.4 \$i インデックスの使用

- 配列参照時、`$i` により自身のインデックスに応じたサイズ参照が可能

```cpp
struct FileInfo {
  int nameLen;
  int dataLen;
};

struct File {
  char name[fileInfos[$i].nameLen];
  char data[fileInfos[$i].dataLen];
};

struct Archive {
  int fileNum;
  FileInfo fileInfos[fileNum];
  File files[fileNum];
};
```

- `File` の `name` や `data` のサイズが `Archive` の `fileInfos` から `$i` を用いて決定されている。
- 暗黙的に構造体定義上の並び順に従い、`files` の `$i` 番目に対応する `fileInfos[$i]` を前提とする。
- 配列が入れ子になっている場合は階層が近いものから$i, $j, $k という風にインデックス名が変わっていく

### 3.5 パースのエントリポイント

- パースの開始点は `struct Root` とする

```cpp
struct Header {
  int dataOffset;
  int dataSize;
  int footerOffset;
  int footerSize;
};

struct Footer {
  int signatureSize;
  char signature[signatureSize];
};

struct Root {
  Header header;
  char data[header.dataSize];
  Footer footer;
};
```

- メンバの読み取り順序により、`header` の `dataSize` を参照して `data` の長さを決定。
- 暗黙的に、先に定義されたメンバの読み取り後にのみ依存関係が評価される。

### 3.6 条件付きメンバ

- メンバ宣言の末尾に `if 条件式` を記述すると、その条件が真のときのみ読み取られる

```cpp
struct Bitmap {
  int bpp;
  int width;
  int height;
  Gray colors[width * height]; // if bpp == 8
  RGB  colors24[width * height]; // if bpp == 24
  RGBA colors32[width * height]; // if bpp == 32
};
```

条件式では既に読み取られたメンバの値を参照できる。

## 4. 構造体ファイルの管理

- `settings.json` にて `.h` ファイルを格納したフォルダを複数登録可能
- `ファイル名.h` と同名拡張子のファイルに対して自動的に構造体を適用（例：`tga.h` → `*.tga`）
- さらに、**ワークスペースルートに **``** が存在する場合**、このファイルに記述されたディレクトリも構造体ファイルの探索対象とする。
  - `binpp.json` に記述されるパスは、**絶対パス**または `binpp.json` からの**相対パス**で記載される
  - 形式例：

```json
{
  "includePaths": [
    "./formats",
    "/usr/local/binpp/formats"
  ]
}
```

## 5. テスト・デバッグ

- 単体テスト実行可能な構成（例：ファイル単体で構造体定義を評価）
- 構造体評価の失敗や未解決参照に対してエラー表示・ヒントを提供

## 6. 将来的な拡張項目（案）

- 構造体ビューでのフィールド編集とバイナリ反映
- フォーマット毎のカスタムビジュアライザ（画像/音声など）
- オートハイライト（ポインタやフラグへの意味づけ）
