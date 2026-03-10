const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// এপিআই রুট
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).json({ error: "URL missing" });

    // শক্তিশালী ৩টি সোর্স
    const sources = [
        `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`,
        `https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`,
        `https://api.vkrdownloader.com/server?v=${encodeURIComponent(videoUrl)}`
    ];

    for (let s of sources) {
        try {
            const response = await axios.get(s, { timeout: 8000 });
            const data = response.data;

            // সোর্স থেকে ভিডিও লিঙ্ক খুঁজে বের করা
            let link = data.video?.noWatermark || data.data?.play || data.url || (data.data && data.data.video);

            if (link) {
                return res.json({ download_url: link, status: "success" });
            }
        } catch (e) {
            console.log("Source failing, switching...");
            continue; 
        }
    }

    res.status(500).json({ error: "All servers are busy. Please try again." });
});

// ভিডিও সরাসরি ডাউনলোডের জন্য প্রক্সি রুট
app.get('/proxy', async (req, res) => {
    const fileUrl = req.query.url;
    if (!fileUrl) return res.status(400).send("No URL provided");

    try {
        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.setHeader('Content-Disposition', 'attachment; filename="KR_Video.mp4"');
        response.data.pipe(res);
    } catch (e) {
        res.status(500).send("Proxy failed to fetch video.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
