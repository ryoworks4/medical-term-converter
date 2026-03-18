const termInput = document.getElementById('term-input');
const charCount = document.getElementById('char-count');
const convertBtn = document.getElementById('convert-btn');
const resultArea = document.getElementById('result-area');
const copyBtn = document.getElementById('copy-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const exampleTags = document.querySelectorAll('.example-tag');

let selectedMode = 'patient';

// 文字数カウント
termInput.addEventListener('input', function () {
    charCount.textContent = this.value.length;
});

// モード切替
modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        modeButtons.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        selectedMode = this.dataset.mode;
    });
});

// サンプルタグクリック
exampleTags.forEach(function (tag) {
    tag.addEventListener('click', function () {
        termInput.value = this.textContent;
        charCount.textContent = this.textContent.length;
        termInput.focus();
    });
});

// Enterキーで変換
termInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        convertBtn.click();
    }
});

// 変換実行
convertBtn.addEventListener('click', async function () {
    var term = termInput.value.trim();

    if (!term) {
        resultArea.innerHTML = '<p class="error-text">医療用語を入力してください</p>';
        return;
    }

    if (term.length > 500) {
        resultArea.innerHTML = '<p class="error-text">500文字以内で入力してください</p>';
        return;
    }

    // ローディング表示
    convertBtn.disabled = true;
    convertBtn.textContent = '変換中...';
    copyBtn.style.display = 'none';
    resultArea.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';

    try {
        var response = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term: term, mode: selectedMode })
        });

        var responseText = await response.text();

        if (!response.ok) {
            var errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { error: '通信エラーが発生しました' };
            }
            resultArea.innerHTML = '<p class="error-text">' + escapeHtml(errorData.error) + '</p>';
            return;
        }

        var data = JSON.parse(responseText);
        resultArea.innerHTML = '<div class="result-content">' +
            '<div class="result-term">' + escapeHtml(term) + '</div>' +
            '<div class="result-text">' + escapeHtml(data.result) + '</div>' +
            '</div>';
        copyBtn.style.display = 'block';
    } catch (error) {
        resultArea.innerHTML = '<p class="error-text">通信エラーが発生しました。もう一度お試しください。</p>';
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = '変換する';
    }
});

// コピー
copyBtn.addEventListener('click', function () {
    var resultText = document.querySelector('.result-text');
    if (resultText) {
        navigator.clipboard.writeText(resultText.textContent).then(function () {
            copyBtn.textContent = 'コピーしました！';
            setTimeout(function () {
                copyBtn.textContent = 'コピー';
            }, 2000);
        });
    }
});

// HTMLエスケープ
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
