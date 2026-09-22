const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const errorBoundaryCode = `
import React, { Component, ErrorInfo, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500">
          <h1 className="text-2xl font-bold mb-4">Algo quebrou na interface!</h1>
          <pre className="bg-red-50 p-4 rounded text-sm overflow-auto">{this.state.error?.toString()}</pre>
          <pre className="bg-red-50 p-4 rounded text-sm overflow-auto mt-2">{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

// Inject Error Boundary class
code = code.replace('export default function ImprensaPage() {', errorBoundaryCode + '\nexport default function ImprensaPage() {\n  return <ErrorBoundary><ImprensaPageInner /></ErrorBoundary>;\n}\n\nfunction ImprensaPageInner() {');

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Injected ErrorBoundary');
