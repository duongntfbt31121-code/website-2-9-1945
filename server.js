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

    try {
        // Cập nhật endpoint chính thức v1 với model gemini-2.5-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemContext + prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else if (data.error) {
            res.status(500).json({ error: `Lỗi Gemini API: ${data.error.message}` });
        } else {
            res.status(500).json({ error: 'Không nhận được phản hồi hợp lệ từ AI.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Lỗi kết nối máy chủ.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
