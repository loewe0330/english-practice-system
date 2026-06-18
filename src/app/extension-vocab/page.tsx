import { extensionCategories, extensionPhrases, extensionWords, grades } from "@/lib/mock-data";

export default function ExtensionVocabPage() {
  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">课外拓展</p>
        <h1>拓展词汇库</h1>
        <p>按分类展示拓展词汇和词组，先使用 mock data，后续可以平滑迁移到数据库。</p>
      </section>

      <section className="category-stack">
        {extensionCategories.map((category) => {
          const words = extensionWords.filter((word) => word.categoryId === category.id);
          const phrases = extensionPhrases.filter((phrase) => phrase.categoryId === category.id);

          return (
            <article key={category.id} className="panel">
              <div className="section-title-row">
                <div>
                  <h2>{category.name}</h2>
                  <p>{category.description}</p>
                </div>
                <span className="pill">{words.length + phrases.length} 项</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>英文</th>
                      <th>中文</th>
                      <th>词性</th>
                  <th>推荐年级</th>
                  <th>难度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {words.map((word) => (
                      <tr key={word.id}>
                        <td>{word.english}</td>
                        <td>{word.chinese}</td>
                        <td>{word.partOfSpeech}</td>
                        <td>{word.recommendedGradeIds.map((id) => grades.find((grade) => grade.id === id)?.displayName ?? "未分类").join("、")}</td>
                        <td>{word.difficulty}</td>
                      </tr>
                    ))}
                    {phrases.map((phrase) => (
                      <tr key={phrase.id}>
                        <td>{phrase.english}</td>
                        <td>{phrase.chinese}</td>
                        <td>phrase</td>
                        <td>{phrase.recommendedGradeIds.map((id) => grades.find((grade) => grade.id === id)?.displayName ?? "未分类").join("、")}</td>
                        <td>{phrase.difficulty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
