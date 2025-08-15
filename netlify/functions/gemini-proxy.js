// netlify/functions/gemini-proxy.js
const fetch = require('node-fetch'); // Importa node-fetch para fazer requisições HTTP no Node.js

exports.handler = async function (event, context) {
    // Verifica se o método é POST e se há um corpo na requisição
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed or missing body' }),
        };
    }

    try {
        // Analisa o corpo da requisição JSON enviado do seu frontend
        const { prompt, generationConfig } = JSON.parse(event.body);

        // A chave de API é acessada de forma segura via variável de ambiente do Netlify
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Define a URL da API Gemini que será chamada
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

        // Constrói o payload para a API Gemini
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: generationConfig // Inclui as configurações de geração (JSON, texto, etc.)
        };

        // Faz a requisição para a API Gemini
        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Se a resposta da Gemini não for OK, retorna o erro
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ error: 'Erro da API Gemini', details: errorData }),
            };
        }

        const geminiResult = await geminiResponse.json();

        // Retorna a resposta da Gemini para o seu frontend
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Permite CORS para qualquer origem (ajuste se souber a origem exata)
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify(geminiResult),
        };

    } catch (error) {
        console.error('Erro na função Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
        };
    }
};