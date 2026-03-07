// ErrorBoundary.tsx
import React, { Component } from 'react';
import { Alert } from 'antd';

class ErrorBoundary extends Component<{ children: React.ReactNode }> {
    state = { hasError: false, errorMessage: '', errorStack: '', errorInfo: '' };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            errorMessage: error.message,
            errorStack: error.stack || 'No stack available',
            errorInfo: JSON.stringify(errorInfo, null, 2),
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Alert
                    message={<strong style={{ fontSize: 18 }}>Error</strong>}
                    description={
                        <div>
                            <p>
                                <strong>Error Message:</strong> {this.state.errorMessage}
                            </p>
                            <p>
                                <strong>Error Stack:</strong>
                            </p>
                            <pre>{this.state.errorStack}</pre>
                            <p>
                                <strong>Error Info:</strong>
                            </p>
                            <pre>{this.state.errorInfo}</pre>
                        </div>
                    }
                    type="error"
                    showIcon
                    style={{ width: '100%' }}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
