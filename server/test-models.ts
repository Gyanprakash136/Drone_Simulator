const dotenv = require('dotenv');
dotenv.config();

async function run() {
    const key = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if(data.models) {
        data.models.forEach((m: any) => console.log(m.name));
    } else {
        console.log(data);
    }
}
run();
