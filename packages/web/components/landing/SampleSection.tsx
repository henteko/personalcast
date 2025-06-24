'use client';

import { useState } from 'react';

export function SampleSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  const scriptData = {
    title: "PersonalCast - あなたの一日をお届けします",
    sections: [
      {
        speaker: "あかり",
        text: "皆様、こんばんは。2024年1月20日、土曜日。『Today's You』の時間です。この番組では、皆様の日々の活動データを深く分析し、パーソナルなニュースとしてお届けします。メインキャスターのあかりです。",
      },
      {
        speaker: "けんた",
        text: "そして、コメンテーターのけんたです。本日も皆様の活動に鋭く切り込んでまいります。",
      },
      {
        speaker: "あかり",
        text: "本日注目すべきハイライトは3点です。まず、新規プロジェクトの要件定義レビューが完了したこと。次に、重要タスクの完了率が100%を達成したこと。そして、毎日のウォーキングが5日連続で達成されたことです。けんたさん、これだけでも素晴らしい成果が見て取れますね。",
      },
      {
        speaker: "けんた",
        text: "はい、あかりさん。データから、今日の活動が非常に計画的かつ効率的に進められたことが伺えます。特に重要タスクの完遂は、その日の生産性を象徴する指標ですね。",
      },
      {
        speaker: "あかり",
        text: "それでは、今日のトップニュースから見ていきましょう。本日は総活動数5件のうち、新規プロジェクトの要件定義レビューを完了し、さらに重要タスクの完了率が100%と、見事な達成度を記録しました。けんたさん、このデータはどのように評価されますか？",
      },
      {
        speaker: "けんた",
        text: "これは非常に高い評価に値しますね、あかりさん。新規プロジェクトの要件定義レビュー完了は、プロジェクト全体の方向性を固める上で極めて重要な工程であり、これが滞りなく完了したことは、今後のスムーズな進行を強く示唆しています。また、重要タスク100%完了は、計画性と実行力の高さを示す明確な証拠です。日々の業務において、最も優先すべき事項を確実に消化できているという点で、非常に堅実な活動と言えるでしょう。",
      },
      {
        speaker: "あかり",
        text: "ありがとうございます。次に、カテゴリー別の活動を見てみましょう。仕事面ではTypeScriptでの実装を開始し、進捗は約30%。学習面ではTypeScriptの条件型を新たに習得されています。そして健康面では、毎日のウォーキングを5日連続で達成。仕事、学習、健康と非常にバランスの取れた一日だったようですね。",
      },
      {
        speaker: "けんた",
        text: "その通りですね。特にTypeScriptの実装開始と条件型の習得は、技術スキルのアップデートと実務への応用が同時に進められていることを示しており、非常に効率的な学習サイクルが確立されていると評価できます。また、ウォーキングの継続は、身体的な健康維持だけでなく、日々のストレスマネジメントにも寄与するでしょう。このバランスの良さが、高い生産性にも繋がっていると考えられます。",
      },
      {
        speaker: "あかり",
        text: "重要タスクの100%完了という成果は、日々の目標達成能力の高さを示しています。これに加え、ウォーキングの継続という継続的な取り組みも素晴らしいですね。",
      },
      {
        speaker: "けんた",
        text: "はい。継続性という観点から見ると、ウォーキングの5日連続達成は特筆すべきです。短期的な成果だけでなく、長期的な健康習慣の確立に向けた着実な一歩であり、自己管理能力の高さがうかがえます。このような継続的な活動が、日々のパフォーマンスを安定させる基盤となるでしょう。",
      },
      {
        speaker: "あかり",
        text: "本日の活動を総括しますと、データからは非常に高い生産性と効率性、そしてバランスの取れた一日であったことが明確に示されました。重要タスクの完全達成と新規スキルの獲得、さらには健康習慣の継続と、多方面にわたる充実ぶりがうかがえます。けんたさん、明日に向けて何か提言はありますか？",
      },
      {
        speaker: "けんた",
        text: "はい、あかりさん。今日の活動から見えてくるのは、計画性と実行力、そして自己投資のバランスです。明日もこの高いパフォーマンスを維持するために、今日得たTypeScriptの知識をさらに深掘りするか、あるいはウォーキングの距離を少し伸ばすなど、小さな挑戦を加えてみるのはいかがでしょうか。継続は力なり、その積み重ねが未来を創ります。",
      },
      {
        speaker: "あかり",
        text: "けんたさん、ありがとうございました。データに基づいた客観的な評価と、未来への有益な洞察をお届けしました。本日の『Today's You』はここまでです。また明日、皆様の活動データでお会いしましょう。ありがとうございました。",
      },
    ],
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-blue mb-4">
            サンプルを聴いてみる
          </h2>
          <p className="text-xl text-center text-text-secondary mb-12">
            実際に生成された音声とスクリプトをご確認いただけます
          </p>

          {/* Audio Player Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-primary-blue mb-6">{scriptData.title}</h3>
            
            {/* Native Audio Player */}
            <div className="mb-8">
              <audio 
                controls 
                className="w-full"
                src="/audio/sample.mp3"
                preload="metadata"
              >
                お使いのブラウザは音声タグをサポートしていません。
              </audio>
            </div>

            {/* Script Display */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-text-primary">スクリプト</h4>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary-blue hover:text-primary-light-blue transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <span className="text-sm">閉じる</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">全文を読む</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <div className={`space-y-4 ${isExpanded ? '' : 'max-h-64 overflow-hidden relative'}`}>
                {scriptData.sections.map((section, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="font-medium text-script-speaker flex-shrink-0">
                      {section.speaker}:
                    </span>
                    <p className="text-script-text leading-relaxed">
                      {section.text}
                    </p>
                  </div>
                ))}
                
                {/* Gradient Overlay */}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
            </div>

            {/* Sample Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">サンプルについて:</span> これは実際にPersonalCastで生成された音声コンテンツです。
                あなたの活動記録からも、このような自然な対話形式の音声番組を作成できます。
              </p>
            </div>

            {/* BGM Credit */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-text-secondary">
                BGM: フリーBGM・音楽素材MusMus{' '}
                <a 
                  href="https://musmus.main.jp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-blue hover:text-primary-light-blue underline"
                >
                  https://musmus.main.jp
                </a>
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="/generate"
              className="inline-block px-8 py-4 bg-primary-blue text-white text-lg font-semibold rounded-full hover:bg-primary-light-blue transform hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              自分の活動記録で試してみる →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}