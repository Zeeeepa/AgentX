# WebSocket Server for AgentX

Provides WebSocket server to forward Agent events to browser clients.

## Features

- ✅ **Dual Mode**: Standalone or embedded into existing HTTP server
- ✅ **Event Forwarding**: Automatically forwards all Agent events
- ✅ **Simple API**: Just 3 lines of code to start
- ✅ **Type Safe**: Full TypeScript support

## Quick Start

### Standalone Mode

Create a WebSocket server with its own HTTP server:

```typescript
import { createAgent, createWebSocketServer } from '@deepractice-ai/agentx-node'

const agent = createAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const wsServer = createWebSocketServer({
  agent,
  port: 5200,
})

console.log('WebSocket URL:', wsServer.getUrl())
// ws://0.0.0.0:5200/ws
```

### Embedded Mode

Attach to existing Express server:

```typescript
import express from 'express'
import { createAgent, createWebSocketServer } from '@deepractice-ai/agentx-node'

const app = express()

// Your HTTP API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const httpServer = app.listen(3000)

// Create agent
const agent = createAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Attach WebSocket server
const wsServer = createWebSocketServer({
  agent,
  server: httpServer,
  path: '/ws',
})

console.log('HTTP API: http://localhost:3000')
console.log('WebSocket:', wsServer.getUrl())
```

## API Reference

### `createWebSocketServer(config)`

Creates a WebSocket server that forwards Agent events.

**Config:**

```typescript
interface WebSocketServerConfig {
  agent: Agent                // Agent instance (required)
  path?: string              // WebSocket path (default: '/ws')

  // Standalone mode
  port?: number              // Port to listen on
  host?: string              // Host to bind (default: '0.0.0.0')

  // Embedded mode
  server?: HttpServer        // Existing HTTP server
}
```

**Returns:**

```typescript
interface AgentWebSocketServer {
  getUrl(): string           // Get WebSocket URL
  close(): Promise<void>     // Close server
  getInfo(): {              // Get server info
    path: string
    mode: 'standalone' | 'embedded'
    url: string
    clientCount: number
  }
}
```

## Message Protocol

### Client → Server

```typescript
// Send message
{ type: 'send', content: 'Hello!' }

// Clear conversation
{ type: 'clear' }

// Destroy agent
{ type: 'destroy' }
```

### Server → Client

All Agent events are forwarded as-is:

```typescript
// User message
{ type: 'user', uuid: '...', sessionId: '...', timestamp: 123, message: {...} }

// Assistant message (complete)
{ type: 'assistant', uuid: '...', sessionId: '...', timestamp: 123, message: {...} }

// Stream delta (incremental)
{ type: 'stream_event', streamEventType: 'content_block_delta', delta: { type: 'text_delta', text: '...' } }

// Final result
{ type: 'result', subtype: 'success', totalCostUsd: 0.001, usage: {...} }

// System init
{ type: 'system', subtype: 'init', model: 'claude-sonnet-4', tools: [...] }

// Error
{ type: 'error', error: 'Error message', sessionId: '...' }
```

## Browser Client Example

```typescript
const ws = new WebSocket('ws://localhost:5200/ws')

// Receive events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)

  switch (data.type) {
    case 'user':
      console.log('User:', data.message)
      break

    case 'assistant':
      console.log('Assistant:', data.message)
      break

    case 'stream_event':
      if (data.delta?.type === 'text_delta') {
        process.stdout.write(data.delta.text)
      }
      break

    case 'result':
      if (data.subtype === 'success') {
        console.log('\nDone! Cost:', data.totalCostUsd)
      }
      break
  }
}

// Send message
ws.send(JSON.stringify({
  type: 'send',
  content: 'Hello!'
}))
```

## Advanced Usage

### Graceful Shutdown

```typescript
const wsServer = createWebSocketServer({
  agent,
  port: 5200,
})

process.on('SIGINT', async () => {
  console.log('Shutting down...')

  await wsServer.close()
  agent.destroy()

  process.exit(0)
})
```

### Custom Path

```typescript
const wsServer = createWebSocketServer({
  agent,
  port: 5200,
  path: '/my-websocket',
})

// ws://0.0.0.0:5200/my-websocket
```

### Get Server Info

```typescript
const info = wsServer.getInfo()

console.log(info)
// {
//   path: '/ws',
//   mode: 'standalone',
//   url: 'ws://0.0.0.0:5200/ws',
//   clientCount: 2
// }
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Browser Client                    │
│  ┌─────────────────────────────────────┐   │
│  │   WebSocket (native)                │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼──────────────────────────┘
                  │
                  │ ws://host:port/ws
                  │
┌─────────────────┼──────────────────────────┐
│                 ▼                           │
│  ┌─────────────────────────────────────┐   │
│  │   WebSocketServer (ws)              │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │   WebSocketBridge                   │   │
│  │   (forwards all events)             │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │   Agent                             │   │
│  │   (emits events)                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│          agentx-node                        │
└─────────────────────────────────────────────┘
```

## See Also

- [Agent API Reference](../../README.md)
- [AgentX Types](../../../agentx-types/README.md)
- [Browser Client Implementation](../../../agentx-browser/README.md)
