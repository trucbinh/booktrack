import React from 'react';
import { DatabaseDemo } from '@/components/DatabaseDemo';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <DatabaseDemo />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  );
}

export default App;