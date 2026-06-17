import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground font-mono text-sm">
                    <div className="max-w-4xl w-full bg-card border border-destructive/20 rounded-lg shadow-lg overflow-hidden">
                        <div className="bg-destructive/10 p-4 border-b border-destructive/20 flex items-center gap-3">
                            <AlertCircle className="text-destructive" />
                            <h1 className="text-xl font-bold text-destructive">Application Crashed</h1>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-muted p-4 rounded overflow-auto max-h-96">
                                <p className="font-bold mb-2">{this.state.error?.toString()}</p>
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-all font-sans font-bold"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
