# バイナリビューアー仕様書

## 1. はじめに

- **目的**: ゲーム開発現場において、独自バイナリや一般的なバイナリ（TTFやMIDIなど）の構造を可視化・解析し、効率的にデータ検証やデバッグを行うこと。
- **背景・範囲**: ゲームエンジンで生成・利用される各種バイナリファイル（最大10MB程度）を対象とし、Windows/macOS/Linux上で動作する軽量なビューアを提供。

## 2. システム概要

- **プラットフォーム**: Webブラウザ上で動作するシングルページアプリケーション（SPA）
- **動作環境**: 最新のChromium系（Edge/Chrome）、Firefox、Safariなどのモダンブラウザ
- **動作モード**: 完全クライアントサイド（ローカルファイル読み込みのみ）、サーバー通信なし
- **機能概要**:
  - バイナリファイルの読み込み
  - 16進ダンプ表示
  - 文字列表示（ASCII/UTF-8）
  - オフセット・アドレス表示

## 3. 要件. 要件

### 3.1 機能要件

1. **ファイルオープン/クローズ**

   - メニューまたはツールバーからのファイルダイアログ起動
   - ファイルドラッグ＆ドロップ対応
   - 開いたファイルのパス表示
   - 複数ファイルの同時オープン（タブ切り替え方式）
   - ファイルクローズ時の変更確認ダイアログ（未保存の解析設定がある場合）

2. **任意オフセットへのジャンプ**

   - オフセット入力欄（16進/10進切替可能）
   - 「移動」ボタンで指定位置へスクロール
   - 入力値のバリデーション（範囲チェック、形式エラー時のエラーメッセージ表示）

3. **データ検索**

   - 16進値検索：バイト単位での16進文字列検索（例："0A FF 1B"）
   - 文字列検索：ASCII/UTF-8での文字列検索（大文字小文字区別オプション）
   - 検索ダイアログ：検索文字列入力、オプション選択（エンディアン考慮、部分一致、完全一致）
   - 次/前のヒット移動ボタン
   - 検索結果のハイライト表示

4. **エンディアン切替**

   - ビッグエンディアン/リトルエンディアン切り替えスイッチ
   - 2/4/8バイト単位でのワード表示（バイトグループ化）
   - 整数表示モード：符号付き/符号無し切替

5. **表示設定**

   - バイト列のグループ化（1/2/4バイトごと）
   - 表示文字エンコーディング選択（ASCII/UTF-8/Shift-JIS）
   - カラム幅/フォントサイズ調整
   - ダーク/ライトテーマ切替

6. **ステータスバー表示**

   - 現在のオフセット位置
   - 選択範囲バイト数
   - ファイルサイズ
   - 選択データの16進/10進/2進表示

7. **保存/エクスポート**

   - 現在表示範囲のダンプをテキストファイル（.txt/.csv）でエクスポート
   - 検索結果リストの保存
   - 解析設定（表示モード、エンディアン設定など）のプリセット保存・読み込み

### 3.2 非機能要件

- パフォーマンス: 大容量ファイル（数GB）対応
- プラットフォーム: Windows/macOS/Linux
- 堅牢性: 不正ファイルの読み込み時に適切にエラー処理

## 4. UI設計

### 4.1 メインウィンドウ

- **レイアウト**:
  - ヘッダー（メニューバー＋ツールバー）
  - メインペイン：水平スプリットビュー
    - 左ペイン：オフセット（アドレス）列
    - 中央ペイン：16進ダンプ列
    - 右ペイン：文字列表示列
  - フッター（ステータスバー）

```
+-------------------------------------------------------------+
| [File][Edit][View][Help]   [Open] [Save] [Search] [Endian]   |
+-------------------------------------------------------------+
| Addr      | Hex Dump                     | ASCII/Encoding   |
| 00000000h | 4D 5A 90 00 ...               | MZ..             |
| 00000010h | 03 00 00 00 ...               | ....             |
| ...       | ...                           | ...              |
+-------------------------------------------------------------+
| Offset: 0x10   Selected: 4 bytes   File: example.bin (1.2MB) |
+-------------------------------------------------------------+
```

### 4.2 メニューバー

- **File**: Open, Close, Export Dump, Exit
- **Edit**: Find, Go To Offset, Preferences
- **View**: Toggle Theme, Toggle Endian, Font Size↑/↓
- **Help**: Documentation, About

### 4.3 ツールバー

- **アイコンボタン**:
  - Open (📂)
  - Save/Export (💾)
  - Search (🔍)
  - Go To Offset (➡️)
  - Endian Toggle (BE/LE)
  - Theme Toggle (🌙/☀️)

### 4.4 コンテキストメニュー

- 右クリックで表示
  - Copy (選択範囲のバイト列コピー)
  - Bookmark (オフセットブックマーク)
  - Interpret As: UInt16/UInt32/Float
  - Highlight Selection

### 4.5 ダイアログ設計

#### 4.5.1 検索ダイアログ

- **入力欄**: 検索文字列（16進 or 文字列）
- **オプション**:
  - Data Type: Hex／ASCII／UTF-8／Shift-JIS
  - Match: 完全一致／部分一致
  - Case Sensitive
  - Endian Aware
- **ボタン**: Find Next, Find Prev, Close

#### 4.5.2 ジャンプダイアログ

- **入力欄**: Offset（16進／10進 切替チェックボックス）
- **ボタン**: Go, Cancel

#### 4.5.3 設定（Preferences）

- **タブ**:
  - Display: Font, Theme, Column Width
  - Data: Default Encoding, Default Endian
  - Export: Default Export Format（TXT/CSV）
  - Advanced: Memory Mapping vs Streaming

---

### 4.6 構造体/列挙体ビューモード

- **目的**: C++ライクな構造体やenum定義に基づき、バイナリのフィールドを名前付きで解析・表示する機能。

- **定義ファイル読み込み**:

  - ユーザーが独自の構造体/enumを記述したテキストファイル（.h/.hppライク形式）をインポート
  - 複数ファイルの同時読み込み対応
  - パーサー例：
    ```cpp
    struct A {
      int size;
      int flags;
      Format format;
    };
    enum Format {
      RGB,
      RGBA,
      Depth
    };
    ```

- **可変長配列のサポートと式評価**:

  - メンバー定義で動的長さの配列を指定可能
  - 配列長の式には同一構造体内の先行フィールドや親スコープの配列要素を使用可能
  - 親スコープ変数へのアクセスは配列名とインデックスを `$i` 形式で指定（例: `fileInfos[$i].nameLen`）
  - パーサー例：
    ```cpp
    struct Entity {
      int nameLen;
      char name[nameLen];
    };
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
  - 実装:
    1. パース時に構造体定義を解析し、配列長式の依存関係グラフを構築
    2. バイナリ読み込み時に先行フィールドや親スコープ要素の値を順次評価
    3. 配列要素数を確定し、必要バイト数を読み込んでマッピング

- **表示**:

  - 左ペインにツリービューで構造体/enum一覧を表示
  - ユーザーが構造体を選択すると、中央ペインに対応バイトレイアウトとフィールドマッピングを表示
  - フィールド毎のオフセット、サイズ、型、配列要素情報を列挙
  - 配列要素はツリー形式で子ノード表示
  - 式評価結果（例: 各要素数）を表示
  - フラグビットやenum値については対応ラベルを表示

- **編集/更新**:

  - 定義ファイル更新時に再読み込みボタンでビューを更新
  - パースエラー時にはエラーメッセージと行番号を表示

- **連携**:

  - ダンプビュー上でフィールド／配列要素をクリックすると該当オフセットへジャンプ
  - 構造体ビューペインとダンプビューは同期スクロール可能

\---## 5. ファイルフォーマット対応## 5. ファイルフォーマット対応. ファイルフォーマット対応

- 汎用バイナリ
- 特定フォーマット（PE/ELF/Mach-Oなど）への拡張検討

## 6. 操作フロー

1. ファイルを開く
2. データを読み込み表示
3. ユーザー操作（検索、ジャンプ）
4. ファイルを閉じる

## 7. 実装・技術詳細

- **開発言語**: TypeScript
- **フレームワーク/ライブラリ**: React or Vue 3（任意）、またはVanilla TypeScript + Lit
- **ビルドツール**: Vite または webpack
- **バイナリ読み込み**: HTML5 FileReader API を使用
- **メモリ管理**: ArrayBuffer, DataView でバイナリ解析
- **構造体パーサー**: 独自実装または nearley.js などのパーサーライブラリ
- **UIコンポーネント**: Tailwind CSS または shadcn/ui を利用可能
- **配布方式**: 静的ファイルとしてホスティング可能（GitHub Pages 等）
- **サーバー通信**: なし（API はローカルのみ）
- **その他ツール**:
  - ESLint + Prettier でコード品質担保
  - Jest または Vitest でユニットテスト

## 8. テスト・検証

- **ユニットテストフレームワーク**
  - **Vitest** を採用
    - 特徴: Viteとの親和性が高く、テスト実行が高速。ネイティブESMとTypeScript対応。
    - 導入: `npm install --save-dev vitest @vitest/ui @testing-library/vue` (Vue利用時) または `@testing-library/react` (React利用時)
    - 設定例: `vite.config.ts` 内に
      ```ts
      import { defineConfig } from 'vite'
      import vue from '@vitejs/plugin-vue'

      export default defineConfig({
        plugins: [vue()],
        test: {
          globals: true,
          environment: 'jsdom',
          coverage: {
            reporter: ['text', 'lcov'],
          },
        },
      })
      ```
- **テスト対象**
  - 構造体パーサーのパースロジック
  - バイナリ読み込み・DataView操作ユーティリティ
  - UIコンポーネントのレンダリングとユーザー操作（Testing Library併用）
- **CI連携 (GitHub Actions)**
  - GitHubリポジトリ上で自動テスト実行
  - サンプル `.github/workflows/test.yml`:
    ```yaml
    name: CI
    on: [push, pull_request]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - name: Setup Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18'
          - name: Install dependencies
            run: npm ci
          - name: Run tests
            run: npm run test:ci
          - name: Upload coverage report
            uses: actions/upload-artifact@v3
            with:
              name: coverage-report
              path: coverage
    ```
  - `package.json` にて:
    ```json
    {
      "scripts": {
        "test": "vitest",
        "test:ci": "vitest --run --coverage"
      }
    }
    ```

## 9. 今後の拡張

- プラグイン機構
- ファイルフォーマット解析機能

## 10. ディレクトリ構成

ローカルでTypeScript+ReactベースのSPAを想定した推奨構成例:

```
project-root/
├─ public/                 # HTMLテンプレートや静的ファイル
│   └─ index.html
├─ src/                    # アプリケーションコード
│   ├─ components/         # 汎用UIコンポーネント
│   ├─ views/              # ページ／スクリーン単位のコンポーネント
│   ├─ hooks/              # カスタムフック
│   ├─ utils/              # ユーティリティ関数
│   ├─ parser/             # バイナリパーサーおよびDataViewユーティリティ
│   ├─ store/              # 状態管理（Redux, Zustandなど）
│   ├─ styles/             # グローバルCSS／Tailwind設定
│   ├─ assets/             # 画像やフォントなどのアセット
│   ├─ format/             # カスタムフォーマットファイル保存用
│   ├─ doc/                # 設計メモ、仕様書（Markdownなど）
│   ├─ App.tsx             # ルートコンポーネント
│   └─ index.tsx           # エントリーポイント
├─ tests/                  # テストコード（ユニット／結合テスト）
├─ .github/                # GitHub ActionsなどCI設定
│   └─ workflows/
├─ vitest.config.ts        # Vitest設定
├─ tsconfig.json           # TypeScript設定
├─ package.json            # 依存関係とスクリプト
└─ vite.config.ts          # ビルドツール設定
```

- **public/**: 静的にホスティングされるファイルを配置
- **src/components/**: 再利用可能な小粒なUIパーツ
- **src/views/**: ページ全体や主要ビューをまとめる
- **src/hooks/**: ロジックを切り出したカスタムフック
- **src/parser/**: 独自のバイナリパーサー実装を配置
- **src/format/**: 独自フォーマット定義ファイル（.fmt等）を保存
- **src/doc/**: 設計メモ、仕様書Markdownなど、ドキュメント類
- **tests/**: Vitest用のテストファイル
- **.github/workflows/**: CI/CDの定義

必要に応じて `services/`, `contexts/` など追加しても構いません。

