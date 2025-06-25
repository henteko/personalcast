'use client';

import { useRouter } from 'next/navigation';
import { SampleSection } from '@/components/landing/SampleSection';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-blue mb-6">
              あなたの一日を、
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-light-blue">
                ニュース番組に変える
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8">
              PersonalCastは、日々の活動記録から
              <br />
              AIパーソナリティが対話形式で紹介する音声コンテンツを自動生成します
            </p>
            <button
              onClick={() => router.push('/generate')}
              className="px-8 py-4 bg-primary-blue text-white text-lg font-semibold rounded-full hover:bg-primary-light-blue transform hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              今すぐ試す →
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-blue/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-light-blue/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-blue mb-16">
            PersonalCastの特徴
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">簡単な記録</h3>
              <p className="text-text-secondary">
                日々の活動をテキストで記録するだけ。
                フォーマットは自由です。
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI分析</h3>
              <p className="text-text-secondary">
                高度なAIがあなたの活動を分析し、
                客観的な視点でハイライトを抽出。
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl hover:shadow-xl transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎙️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">プロ品質の音声</h3>
              <p className="text-text-secondary">
                2人のAIパーソナリティが自然な対話で
                あなたの一日を紹介します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-blue mb-16">
            使い方は簡単3ステップ
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary-blue text-white rounded-full flex items-center justify-center text-xl font-bold">
                      1
                    </div>
                    <h3 className="text-xl font-semibold ml-4">活動を記録</h3>
                  </div>
                  <p className="text-text-secondary">
                    今日の出来事、完了したタスク、感じたことなどを自由に記録
                  </p>
                </div>
              </div>
              
              <div className="hidden md:block">
                <span className="text-4xl text-gray-300">→</span>
              </div>
              
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary-blue text-white rounded-full flex items-center justify-center text-xl font-bold">
                      2
                    </div>
                    <h3 className="text-xl font-semibold ml-4">AIが分析</h3>
                  </div>
                  <p className="text-text-secondary">
                    AIがあなたの活動を分析し、ニューススクリプトを自動生成
                  </p>
                </div>
              </div>
              
              <div className="hidden md:block">
                <span className="text-4xl text-gray-300">→</span>
              </div>
              
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary-blue text-white rounded-full flex items-center justify-center text-xl font-bold">
                      3
                    </div>
                    <h3 className="text-xl font-semibold ml-4">音声で聴く</h3>
                  </div>
                  <p className="text-text-secondary">
                    プロ品質の音声で、あなたの一日をニュース番組として楽しめます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Section */}
      <SampleSection />

      {/* Demo Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-blue mb-8">
              毎日の振り返りが楽しくなる
            </h2>
            <p className="text-xl text-text-secondary mb-12">
              PersonalCastは、あなたの活動を客観的に分析し、
              <br />
              まるで本物のニュース番組のような音声コンテンツを作成します。
              <br />
              日々の成長を実感し、モチベーションを維持するのに最適です。
            </p>
            
            <div className="bg-blue-50 rounded-2xl p-8 mb-12">
              <h3 className="text-2xl font-semibold mb-4">こんな方におすすめ</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>日記や活動記録を続けたい方</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>自分の成長を客観的に振り返りたい方</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>音声コンテンツが好きな方</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>新しい自己分析ツールを探している方</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4">
                    ローカル環境でも使える
                  </h2>
                  <p className="text-lg mb-6 opacity-90">
                    PersonalCastはCLIツールとしても提供されています。
                    <br />
                    お使いのPC上で、ニュース番組を生成できます。
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>カスタマイズ可能な設定</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>バッチ処理・自動化に対応</span>
                    </div>
                  </div>
                  <a
                    href="https://henteko.github.io/personalcast/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span>CLIツールを試す</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-black/20 rounded-lg p-4 font-mono text-sm">
                    <div className="text-gray-300 mb-2">$ personalcast init</div>
                    <div className="text-green-400 mb-2">$ personalcast generate -i activity.txt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-blue to-primary-light-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            今すぐPersonalCastを試してみませんか？
          </h2>
          <p className="text-xl mb-12 opacity-90">
            登録不要・無料で、すぐにお使いいただけます
          </p>
          <button
            onClick={() => router.push('/generate')}
            className="px-8 py-4 bg-white text-primary-blue text-lg font-semibold rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all shadow-lg cursor-pointer"
          >
            無料で始める →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-70">
            © 2025 henteko. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}