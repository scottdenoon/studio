
import { NextRequest } from 'next/server';
import { processWebSocketMessage } from '@/ai/flows/process-websocket-message';
import WebSocket from 'ws';

// This is a Route Handler that will be used to proxy the WebSocket connection.
// It's a ReadableStream that we can pipe the WebSocket data to.
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const externalWs = new WebSocket(url);

      externalWs.on('open', () => {
        console.log(`Connected to external WebSocket: ${url}`);
        // You could send an initial message here if needed.
        // For example, some WebSockets require a subscription message.
        // externalWs.send(JSON.stringify({ action: 'subscribe', ... }));
      });

      externalWs.on('message', async (data) => {
        try {
          const rawMessage = data.toString();
          console.log('Received message from external WebSocket:', rawMessage);
          
          // Process the message using the Genkit flow
          const processedNewsItem = await processWebSocketMessage({ rawData: rawMessage });
          
          // Send the processed data to the client
          controller.enqueue(JSON.stringify(processedNewsItem) + '\n');
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          // Optionally, you could send an error message to the client
          // controller.enqueue(JSON.stringify({ error: 'Processing failed' }) + '\n');
        }
      });

      externalWs.on('close', () => {
        console.log(`Disconnected from external WebSocket: ${url}`);
        controller.close();
      });

      externalWs.on('error', (err) => {
        console.error(`External WebSocket error for ${url}:`, err);
        controller.error(err);
      });

      // Ensure the external connection is closed when the client disconnects.
      request.signal.addEventListener('abort', () => {
        externalWs.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
