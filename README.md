## register — バーコードで外部検索

USBバーコードリーダー（HIDキーボード型）でバーコードを「ピッ」すると、読み取った数字を検索語にして外部サイトを別タブで開くだけのアプリです。アプリ内では商品情報を一切保持・解析しません。

- 通常モード: Google で `JAN:<digits>` を検索 → `https://www.google.com/search?q=JAN:...`
- 「ほんをけんさく」ON: 楽天ブックスで検索 → `https://books.rakuten.co.jp/search?sitem=...`

直近 1.5 秒以内に同じコードを再読み取りした場合は無視します（連打防止）。

### 起動

```bash
npm install
npm run dev
```

<http://localhost:3000> を開いてバーコードリーダーで読むか、画面下の入力欄に数字を入れて「けんさく」。
