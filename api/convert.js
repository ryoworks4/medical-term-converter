export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST のみ対応しています' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'APIキーが設定されていません' });
    }

    const { term, mode } = req.body;

    if (!term || typeof term !== 'string') {
        return res.status(400).json({ error: '医療用語を入力してください' });
    }

    if (term.length > 500) {
        return res.status(400).json({ error: '500文字以内で入力してください' });
    }

    const allowedModes = ['patient', 'child', 'detail'];
    const selectedMode = allowedModes.includes(mode) ? mode : 'patient';

    const modePrompts = {
        patient: `あなたは医療従事者向けの翻訳アシスタントです。
以下の医療用語や検査名を、患者さん（一般の方）にもわかるように、やさしい日本語で説明してください。

ルール:
- 専門用語は使わず、日常的な言葉で説明する
- 「つまり○○ということです」のような言い換えを含める
- 100〜200文字程度で簡潔に
- 不安をあおらない、ニュートラルな表現にする
- 医学的なアドバイスはしない`,

        child: `あなたは子ども向けの医療説明アシスタントです。
以下の医療用語を、小学生にもわかるように、とてもかんたんな言葉で説明してください。

ルール:
- 小学3年生でもわかる言葉を使う
- たとえ話や身近なものに例える
- 100文字程度で短く
- 怖がらせない、やさしい表現にする
- 「〜だよ」「〜なんだ」のようなやさしい口調で`,

        detail: `あなたは医療情報の解説アシスタントです。
以下の医療用語について、一般の方向けに詳しく説明してください。

ルール:
- 最初に一言でかんたんに説明する
- その後、もう少し詳しく解説する（原因・症状・検査の目的など）
- 200〜400文字程度
- 専門用語を使う場合は（）で読み仮名や補足を入れる
- 医学的なアドバイスや診断はしない
- 「詳しくは医師にご相談ください」で締める`
    };

    const prompt = `${modePrompts[selectedMode]}

医療用語: 「${term}」

説明:`;

    try {
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 2048,
                        temperature: 0.3
                    }
                })
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'AIからの応答でエラーが発生しました'
            });
        }

        const data = JSON.parse(responseText);
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!result) {
            return res.status(500).json({ error: '変換結果を取得できませんでした' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        return res.status(500).json({ error: '通信エラーが発生しました' });
    }
}
