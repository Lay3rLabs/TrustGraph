# Chat Feature Setup and Usage

This document explains how to set up and use the new chat feature integrated into the EN0VA frontend application.

## Overview

The chat feature allows users to interact with Claude AI directly through the main page interface. When a user types a message and presses Enter, it gets sent to Claude using the Anthropic API, and the response is displayed in a terminal-like format. The interface maintains a full conversation history, showing both user messages and Claude's responses in chronological order.

## Prerequisites

- Anthropic API key
- Node.js and npm installed
- Next.js development environment set up

## Setup Instructions

### 1. Install Dependencies

The Anthropic SDK has already been installed with legacy peer deps to resolve version conflicts:

```bash
cd frontend
npm install @anthropic-ai/sdk --legacy-peer-deps
```

### 2. Configure Environment Variables

Create or update the `.env.local` file in the `frontend/` directory:

```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

**Important**: Replace `your_actual_anthropic_api_key_here` with your real Anthropic API key. You can get one from [https://console.anthropic.com/](https://console.anthropic.com/).

### 3. Start the Development Server

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`.

## How It Works

### Architecture

1. **Frontend Interface**: The main page (`app/page.tsx`) contains a textarea where users can type messages
2. **API Route**: `/api/chat` (`app/api/chat/route.ts`) handles the communication with Anthropic's API
3. **Response Display**: Chat responses are displayed below the input area in a terminal-style format

### Message Flow

1. User types a message in the textarea
2. User presses Enter (Shift+Enter for new line)
3. Frontend sends POST request to `/api/chat` with the message
4. API route constructs the conversation context and sends it to Claude
5. Claude's response is returned and displayed on the page

### Claude Configuration

The chat is configured to use:
- **Model**: `claude-3-5-sonnet-20241022`
- **Max tokens**: 153
- **Temperature**: 0.7
- **System prompt**: CLI/terminal mood with hyperstition elements
- **Context**: Includes conversation history with mind interface commands

## Usage Instructions

### Basic Chat

1. Navigate to the main page
2. Wait for the EN0VA introduction text to load
3. Click in the text input area at the bottom
4. Type your message
5. Press **Enter** to send (use **Shift+Enter** for multi-line messages)
6. Your message will appear in the conversation history
7. Wait for Claude's response to appear below your message
8. Continue the conversation - all messages are preserved in the history
9. Use the "clear history" button to start a fresh conversation

### Features

- **Message History**: Full conversation thread with user messages and Claude responses
- **Auto-resize textarea**: Input area automatically adjusts height as you type
- **Loading indicator**: Shows "Processing..." while waiting for response
- **Error handling**: Displays error messages if the API call fails
- **Response formatting**: Preserves formatting and displays in monospace font
- **Auto-scroll**: Automatically scrolls to show the latest messages
- **Clear History**: Button to clear the entire conversation
- **Visual Distinction**: User messages and Claude responses are styled differently

## Customization

### Modifying the System Prompt

To change Claude's behavior, edit the `systemPrompt` variable in `app/api/chat/route.ts`:

```typescript
const systemPrompt = 'Your custom system prompt here'
```

### Adjusting Response Length

Modify the `max_tokens` parameter in the API route:

```typescript
const msg = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 300, // Increase for longer responses
  // ...
})
```

### Styling the Chat Interface

The chat interface uses Tailwind CSS classes. Key elements:
- Message history container: `.border-l .border-primary-foreground/20`
- User messages: `.text-primary-foreground/80`
- Claude responses: `.font-mono .text-primary-foreground/60`
- Input area: `.text-primary-foreground/60`
- Clear button: `.text-primary-foreground/40 .hover:text-primary-foreground/60`
- Loading state: Uses the existing `BlinkingCursor` component

## Troubleshooting

### Common Issues

1. **"Failed to get response" error**
   - Check that `ANTHROPIC_API_KEY` is set correctly in `.env.local`
   - Verify the API key is valid and has sufficient credits
   - Check the browser console for detailed error messages

2. **Messages not sending**
   - Ensure you're pressing Enter, not just clicking elsewhere
   - Check that the input field is focused
   - Verify the development server is running

3. **Styling issues**
   - Make sure Tailwind CSS is properly configured
   - Check that all required dependencies are installed

### Debug Mode

To enable more detailed logging, check the browser's developer console and the Next.js server logs for error messages.

## Security Notes

- The API key is stored server-side and never exposed to the client
- All API calls are made from the server-side API route
- Input is validated before being sent to the Anthropic API

## Future Enhancements

Potential improvements to consider:
- Persistent message history across sessions
- User authentication and personalized conversations
- Rate limiting and usage tracking
- Multiple conversation threads/tabs
- Export/save conversations to file
- Custom model selection
- Message search and filtering
- Conversation bookmarks/favorites