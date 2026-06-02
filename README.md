# 🎓 IUB Assistant — Configuration Guide

## 📋 Overview

IUB Assistant is an AI-powered chatbot for Islamia University of Bahawalpur. It uses **OpenRouter** to access multiple free LLM models with automatic fallback support.

## 🔑 Setup Instructions

### 1. Get Your API Key
- Visit [OpenRouter](https://openrouter.ai/keys) to create a free account
- Copy your API key

### 2. Configure .env File
Edit `.env` in the root directory:

```env
# Your OpenRouter API key
OPEN_ROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx

# Primary model (tried first)
OPEN_ROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Fallback models (comma-separated list)
OPEN_ROUTER_MODELS=meta-llama/llama-3.1-8b-instruct:free,meta-llama/llama-3.2-3b-instruct:free,google/gemma-2-9b-it:free,mistralai/mistral-7b-instruct:free,qwen/qwen-2-7b-instruct:free,microsoft/phi-3-mini-128k-instruct:free
```

## 🔄 Multiple Model Fallback System

### How It Works

When a user sends a message:

1. **Primary Model** → Tries `OPEN_ROUTER_MODEL` first
2. **Model Fails?** → Automatically switches to next model in `OPEN_ROUTER_MODELS` list
3. **Seamless Experience** → User sees a toast notification but chat continues uninterrupted
4. **Multiple Attempts** → Tries all models in the list before giving an error

### Failure Scenarios Handled

✅ Rate limits (HTTP 429)  
✅ Server errors (HTTP 500+)  
✅ Model quota exceeded  
✅ Network issues  
✅ Empty responses  

### Supported Free Models

| Model | Notes |
|-------|-------|
| `meta-llama/llama-3.1-8b-instruct:free` | **Recommended** - Best quality |
| `meta-llama/llama-3.2-3b-instruct:free` | Faster, lighter |
| `google/gemma-2-9b-it:free` | Good quality alternative |
| `mistralai/mistral-7b-instruct:free` | Fast responses |
| `qwen/qwen-2-7b-instruct:free` | Multilingual support |
| `microsoft/phi-3-mini-128k-instruct:free` | Compact, efficient |

## 📁 Project Structure

```
iub-assistant/
├── index.html          # Clean HTML (structure only)
├── styles.css          # All styling
├── script.js           # JavaScript logic
├── env.js              # Environment loader
├── .env                # Configuration (API key & models)
└── README.md           # This file
```

## 🚀 Usage

### Running Locally

```bash
# Open in browser
start index.html

# Or use a local server
python -m http.server 8000
# Then visit http://localhost:8000
```

### Deployment

- **Vercel**: Automatically deploys from git
- **Netlify**: Supports static files
- **GitHub Pages**: Works without backend
- **Any static host**: Just upload the files

## 🎯 Features

✨ **AI-Powered Chat** - Real-time responses with streaming  
🔄 **Automatic Fallback** - Seamless model switching  
⚡ **No API Key in UI** - Secure .env configuration  
📱 **Responsive Design** - Mobile & desktop friendly  
🌈 **Beautiful UI** - Gradient header, smooth animations  
💬 **Context Aware** - Remembers last 24 messages  
🎓 **IUB Specific** - Trained on university information  

## 🔒 Security Notes

- **API Key Security**: Never commit `.env` to git
- **Stored in .env Only**: Not in localStorage or UI
- **No Sensitive Data**: Chat history kept client-side only
- **Environment Variables**: Loaded at runtime from `.env`

## 🛠️ Troubleshooting

### No API Key
```
❌ API key not configured. Set OPEN_ROUTER_API_KEY in .env
```
**Solution**: Add your API key to `.env` file

### All Models Failing
```
❌ Unable to complete the request
```
**Check**:
- API key is valid
- Internet connection is working
- OpenRouter status page: https://status.openrouter.ai
- Try adding more models to fallback list

### Model Not Responding
- System automatically tries next model (check toast notification)
- User sees seamless continuation of chat

## 📊 Model Performance

| Model | Speed | Quality | Size |
|-------|-------|---------|------|
| Llama 3.1 8B | 🟡 | 🟢 | Medium |
| Llama 3.2 3B | 🟢 | 🟡 | Small |
| Gemma 2 9B | 🟡 | 🟢 | Medium |
| Mistral 7B | 🟢 | 🟡 | Medium |
| Qwen 2 7B | 🟡 | 🟡 | Medium |
| Phi-3 Mini | 🟢 | 🟡 | Small |

## 🤖 System Prompt

The assistant is trained to answer questions about:
- **Admissions** - Undergraduate, graduate, PhD programs
- **Academic Programs** - All faculties and departments
- **Campus Information** - Multiple campuses and locations
- **Student Life** - Hostels, facilities, societies
- **Results & Transcripts** - Academic records
- **Scholarships** - HEC, merit-based, financial aid

## 🔧 Advanced Configuration

### Add Custom Models

Edit `.env` to add more models:

```env
OPEN_ROUTER_MODELS=model1,model2,model3,model4,model5
```

See all free models at: https://openrouter.ai/docs/models

### Change System Prompt

Edit `script.js` and modify the `SYSTEM_PROMPT` constant to customize assistant behavior.

### Adjust Parameters

In `script.js`, find `callOpenRouter()` and modify:
- `temperature`: 0.7 (randomness: 0-2)
- `max_tokens`: 1024 (response length)
- `stream`: true (real-time display)

## 📞 Support

- **OpenRouter Help**: https://openrouter.ai/docs
- **Free API Key**: https://openrouter.ai/keys
- **Status**: https://status.openrouter.ai

## 📝 Notes

- Free models may have rate limits
- Requests are sent directly to OpenRouter
- No data stored on servers
- Works offline after models are cached (browser)

---

**Last Updated**: June 2, 2026  
**Version**: 1.0.0
