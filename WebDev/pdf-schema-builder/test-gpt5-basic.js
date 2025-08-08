const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

async function testGPT5Nano() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Testing basic GPT-5 Nano without images...');
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: "Say 'Hello, I am GPT-5 Nano' if you can receive this message"
        }
      ],
      max_completion_tokens: 50
    });

    console.log('\n=== GPT-5 Nano Response ===');
    console.log(response.choices[0].message.content);
    console.log('\n=== Token Usage ===');
    console.log('Prompt tokens:', response.usage.prompt_tokens);
    console.log('Completion tokens:', response.usage.completion_tokens);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGPT5Nano();