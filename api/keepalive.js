// Vercel Serverless Function: Keepalive ping to Supabase
// Keeps the free Supabase database active to prevent the 7-day auto-pause

export default async function handler(req, res) {
    const sbUrl = process.env.SUPABASE_URL || 'https://qqvwrliuhomyecyvbbep.supabase.co';
    const sbKey = process.env.SUPABASE_KEY || 'sb_publishable_9uhFuw4MYnFLGORNRKWZ_w_yfH1Qdx2';

    try {
        const fetchUrl = `${sbUrl}/rest/v1/inventario_secure_v1_9x8b7c?id=eq.1&select=id`;
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'apikey': sbKey,
                'Authorization': `Bearer ${sbKey}`
            }
        });

        return res.status(200).json({
            success: true,
            status: response.status,
            message: 'Supabase keepalive ping sent successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
