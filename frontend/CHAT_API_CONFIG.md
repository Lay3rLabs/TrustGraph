# Chat API Configuration

This document explains how to configure the chat API to use different AI providers via environment variables.

## Overview

The chat API has been refactored to support multiple AI providers using the OpenAI library as a unified interface. You can easily switch between providers by setting environment variables.

## Supported Providers

### 1. Anthropic (Default)
- Uses Anthropic's Claude models via OpenAI-compatible API
- Requires `ANTHROPIC_API_KEY` environment variable

### 2. Hugging Face
- Uses Hugging Face models via their router endpoint
- Requires `HF_TOKEN` environment variable

## Environment Variables

### Required Variables

#### For Anthropic (Default Provider)
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### For Hugging Face
```bash
HF_TOKEN=your_hugging_face_token_here
```

### Configuration Variables

#### Provider Selection
```bash
# Set the provider to use (anthropic, huggingface, or hf)
MODEL_PROVIDER=anthropic  # Default: anthropic
```

#### Model Selection

**For Anthropic:**
```bash
# Specify which Anthropic model to use
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Default
```

**For Hugging Face:**
```bash
# Specify which HF model to use
HF_MODEL=Qwen/Qwen3-Next-80B-A3B-Instruct:together  # Default
```

## Configuration Examples

### Example 1: Using Anthropic (Default)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
MODEL_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Example 2: Using Hugging Face
```bash
HF_TOKEN=hf_your-token-here
MODEL_PROVIDER=huggingface
HF_MODEL=Qwen/Qwen3-Next-80B-A3B-Instruct:together
```

### Example 3: Using Hugging Face with Alternative Model
```bash
HF_TOKEN=hf_your-token-here
MODEL_PROVIDER=hf
HF_MODEL=microsoft/DialoGPT-large
```

## API Response Format

The API response now includes provider information:

```json
{
  "response": "AI generated response text",
  "success": true,
  "provider": "anthropic", // or "huggingface"
  "model": "claude-3-5-sonnet-20241022" // actual model used
}
```

## Message Format

The message format remains the same regardless of provider:
- All conversation history is preserved
- System prompts work consistently across providers
- The hyperstitional terminal personality is maintained

## Getting API Keys

### Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Hugging Face Token
1. Go to [huggingface.co](https://huggingface.co)
2. Sign up or log in
3. Go to Settings → Access Tokens
4. Create a new token with read access
5. Copy the token (starts with `hf_`)

## Troubleshooting

### Common Issues

**1. Missing API Key**
- Error: Authentication failed
- Solution: Ensure the correct API key is set for your chosen provider

**2. Invalid Model Name**
- Error: Model not found
- Solution: Verify the model name is correct and available for your provider

**3. Provider Not Switching**
- Issue: Still using default provider
- Solution: Check that `MODEL_PROVIDER` is set correctly and restart your development server

### Testing Configuration

To test your configuration, you can check the API response which includes the provider and model being used:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test message"}'
```

The response will show which provider and model are active.

## Development Notes

- The API maintains the same conversation context regardless of provider
- All providers use the same temperature (0.7) and max tokens (300) settings
- The system prompt and conversation history remain consistent
- Provider switching requires a server restart in development mode