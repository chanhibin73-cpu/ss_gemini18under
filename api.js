export default async function handler(req, res) {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { type, subject, messages, difficulty, noLaTeXDollar } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        text: "⚠️ サーバー側の環境変数 GEMINI_API_KEY が設定されていません。Vercelの設定を確認してください。"
      });
    }

    // システムプロンプト作成
    let systemInstruction = `あなたは親切で分かりやすい優秀なAI家庭教師です。対象教科は「${subject}」です。中高生にも理解しやすいように丁寧に説明してください。画像が添付されている場合は画像の内容を正確に読み取り解説を行ってください。`;
    
    if (noLaTeXDollar) {
      systemInstruction += `\n【絶対ルール】数式や記号（θ, log, sin, cos, ±など）を表示する際は、LaTeXのドル記号「$」や「$$」を絶対に使用しないでください。Unicode記号（θ、Θなど）や通常の文字をそのまま記述してください。`;
    }

    if (type === 'test') {
      systemInstruction += `\n現在【${difficulty}】レベルの小テストを出題するリクエストを受けています。1問、確認用の問題を提示してください。`;
    } else if (type === 'review') {
      systemInstruction += `\n現在【テスト復習・間違えた問題の分析】のリクエストを受けています。
送られてきた問題画像やテキストに対して、以下の3つの構成で分かりやすく解説・指導を行ってください：

1. 【問題の要点と解説】
   - どこがポイントか、どう解けばよいかを丁寧に解説してください。
2. 【復習ポイント・弱点分析】
   - つまずきやすい箇所や、覚えておくべき公式・考え方を整理してください。
3. 【チャレンジ類題（1問）】
   - 理解度を確認するための類似問題を1問出題してください。`;
    }

    // Gemini API用の会話フォーマット変換（テキスト＋画像データの構築）
    const contents = (messages || []).map(m => {
      const parts = [];

      // 画像データがある場合は inline_data として追加
      if (m.imageData) {
        parts.push({
          inline_data: {
            mime_type: m.imageData.mimeType,
            data: m.imageData.data
          }
        });
      }

      // テキストがある場合に追加
      if (m.text) {
        parts.push({ text: m.text });
      }

      return {
        role: m.role === 'ai' ? 'model' : 'user',
        parts: parts
      };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: contents
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ text: `⚠️ APIエラーが発生しました: ${data.error.message}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "応答を取得できませんでした。";

    return res.status(200).json({ text: replyText });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
