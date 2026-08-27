const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên Render.' });
    }

    const systemContext = "Bạn là trợ lý AI lịch sử Việt Nam dành cho thế hệ trẻ. Hãy trả lời hào hùng, ngắn gọn và chính xác về sự kiện ngày 2/9/1945 và Tuyên ngôn Độc lập. Câu hỏi: ";

    // Danh sách các model chuẩn từ Google AI Studio
    const modelsToTry = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash-lite'
    ];

    let lastError = null;

    for (const model of modelsToTry) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemContext + prompt }] }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                return res.json({ reply: data.candidates[0].content.parts[0].text });
            } else if (data.error) {
                lastError = data.error.message;
            }
        } catch (err) {
            lastError = err.message;
        }
    }

    // Nếu tất cả model trong danh sách trên đều không chạy, thử trực tiếp tên model theo yêu cầu hệ thống
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemContext + prompt }] }]
            })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return res.json({ reply: data.candidates[0].content.parts[0].text });
        }
    } catch (e) {}

    res.status(500).json({ error: `Lỗi Gemini API: ${lastError || 'Không thể kết nối với mô hình AI nào.'}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
