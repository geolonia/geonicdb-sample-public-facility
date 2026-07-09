export function Attribution() {
  return (
    <p style={{ fontSize: '0.75rem', color: '#666', margin: '4px 8px' }}>
      データ:{' '}
      <a
        href="https://catalog.data.go.jp/dataset/itabashi-public-facilities"
        target="_blank"
        rel="noopener noreferrer"
      >
        板橋区 公共施設一覧
      </a>
      （デジタル庁 自治体標準オープンデータセット） /{' '}
      <a
        href="https://creativecommons.org/licenses/by/4.0/deed.ja"
        target="_blank"
        rel="noopener noreferrer"
      >
        CC BY 4.0
      </a>
    </p>
  );
}
