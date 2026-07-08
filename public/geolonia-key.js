/*
 * Geolonia Maps API キーを @geolonia/embed(npm)の keyring に渡すための器。
 *
 * embed の keyring は `geolonia-api-key` クエリを持つ <script> タグの src から
 * キーを読み取る。index.html では次のように参照する:
 *   <script src="/geolonia-key.js?geolonia-api-key=%VITE_GEOLONIA_API_KEY%"></script>
 *
 * このファイル自体は意図的に空。src を「ルート絶対パスの実在 JS ファイル」に
 * することが目的で、相対 src だと SPA のサブルート直リンク時に index.html
 * (text/html) が返り MIME エラーになるのを防ぐ。
 */
