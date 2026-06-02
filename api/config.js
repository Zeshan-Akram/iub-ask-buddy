// api/config.js
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY || ''
    });
}