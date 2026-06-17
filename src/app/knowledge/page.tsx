import { books, units } from "@/lib/mock-data";

export default function KnowledgePage() {
  const book = books[0];

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">校内知识清单</p>
        <h1>知识清单库</h1>
        <p>按教材和单元整理课内单词、词组、句子和语法点，后续可替换为 Supabase 数据源。</p>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>{book.name}</h2>
            <p>{book.publisher} · {book.grade}</p>
          </div>
          <span className="pill">当前教材</span>
        </div>

        <div className="unit-list">
          {units.map((unit) => (
            <details key={unit.id} className="unit-details" open>
              <summary>
                <span>
                  <strong>{unit.name}</strong>
                  <small>{unit.title}</small>
                </span>
                <span className="summary-stats">
                  单词 {unit.words.length} · 词组 {unit.phrases.length} · 句子 {unit.sentences.length}
                </span>
              </summary>

              <div className="content-columns">
                <article>
                  <h3>单词</h3>
                  <ul className="term-list">
                    {unit.words.map((word) => (
                      <li key={word.id}>
                        <strong>{word.english}</strong>
                        <span>{word.chinese}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article>
                  <h3>词组</h3>
                  <ul className="term-list">
                    {unit.phrases.map((phrase) => (
                      <li key={phrase.id}>
                        <strong>{phrase.english}</strong>
                        <span>{phrase.chinese}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="wide-column">
                  <h3>句子</h3>
                  <ul className="sentence-list">
                    {unit.sentences.map((sentence) => (
                      <li key={sentence.id}>
                        <strong>{sentence.english}</strong>
                        <span>{sentence.chinese}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
