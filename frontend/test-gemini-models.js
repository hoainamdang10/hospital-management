const { GoogleGenerativeAI } = require('@google/generative-ai');

// Paste your API key here temporarily
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log('🔍 Fetching available models...\n');

        const models = await genAI.listModels();

        console.log('✅ Available models:\n');

        models.forEach((model, index) => {
            console.log(`${index + 1}. ${model.name}`);
            console.log(`   Display Name: ${model.displayName}`);
            console.log(`   Description: ${model.description}`);
            console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
            console.log('');
        });

        console.log('\n📋 Models supporting generateContent:');
        const contentModels = models.filter(m =>
            m.supportedGenerationMethods?.includes('generateContent')
        );
        contentModels.forEach(m => {
            console.log(`   - ${m.name.replace('models/', '')}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listModels();
