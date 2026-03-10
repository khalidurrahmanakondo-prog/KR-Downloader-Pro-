‎const express = require('express');
‎const axios = require('axios');
‎const cors = require('cors');
‎const path = require('path');
‎const app = express();
‎
‎// ১. বেসিক কনফিগারেশন
‎app.use(cors());
‎app.use(express.static(__dirname));
‎
‎// ২. হোম পেজ রাউট (লিঙ্কে ঢুকলে যেন index.html দেখা যায়)
‎app.get('/', (req, res) => {
‎    res.sendFile(path.join(__dirname, 'index.html'));
‎});
‎
‎// ৩. মেইন ডাউনলোড এপিআই রাউট
‎app.get('/download', async (req, res) => {
‎    const videoUrl = req.query.url;
‎    if (!videoUrl) return res.status(400).json({ error: "ভিডিওর লিঙ্ক প্রয়োজন।" });
‎
‎    // শক্তিশালী সোর্সসমূহ
‎    const sources = [
‎        `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`,
‎        `https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`,
‎        `https://api.vkrdownloader.com/server?v=${encodeURIComponent(videoUrl)}`
‎    ];
‎
‎    for (let s of sources) {
‎        try {
‎            const response = await axios.get(s, { timeout: 10000 });
‎            const data = response.data;
‎
‎            // এপিআই থেকে ভিডিও লিঙ্ক খুঁজে বের করার লজিক
‎            let link = data.video?.noWatermark || 
‎                       data.data?.play || 
‎                       data.url || 
‎                       (data.data && data.data.video);
‎
‎            if (link) {
‎                return res.json({ download_url: link, status: "success" });
‎            }
‎        } catch (e) {
‎            console.log("একটি সার্ভার কাজ করছে না, পরেরটি চেষ্টা করা হচ্ছে...");
‎            continue; 
‎        }
‎    }
‎
‎    res.status(500).json({ error: "দুঃখিত, কোনো ভিডিও পাওয়া যায়নি বা সার্ভার ব্যস্ত।" });
‎});
‎
‎// ৪. ভিডিও ফাইল প্রক্সি রাউট (সরাসরি ডাউনলোডের জন্য)
‎app.get('/proxy', async (req, res) => {
‎    const fileUrl = req.query.url;
‎    if (!fileUrl) return res.status(400).send("No URL provided");
‎
‎    try {
‎        const response = await axios({
‎            method: 'get',
‎            url: fileUrl,
‎            responseType: 'stream',
‎            headers: { 
‎                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
‎            }
‎        });
‎        res.setHeader('Content-Disposition', 'attachment; filename="KR_Video.mp4"');
‎        response.data.pipe(res);
‎    } catch (e) {
‎        res.status(500).send("ভিডিও প্রক্সি করতে সমস্যা হয়েছে।");
‎    }
‎});
‎
‎// ৫. সার্ভার পোর্ট সেটআপ
‎const PORT = process.env.PORT || 3000;
‎app.listen(PORT, () => {
‎    console.log(`সার্ভার চালু হয়েছে পোর্ট: ${PORT}`);
‎});
‎