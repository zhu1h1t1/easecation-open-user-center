import React, { useRef, useEffect } from 'react';
import { ThinkingTimeline } from './ThinkingTimeline';
import { useAIStreamContext } from '@common/contexts/AIStreamContext';
import useDarkMode from '@common/hooks/useDarkMode';
import { gLang } from '@common/language';

export const StreamModalContent: React.FC = () => {
    const { isLoading, error, finalAnswer, thinkingSteps, isCompleted, setEditedAnswer } =
        useAIStreamContext();
    const isDarkMode = useDarkMode();
    const containerRef = useRef<HTMLDivElement>(null);

    // 当最终答案完成时，自动滚动到底部
    useEffect(() => {
        if (isCompleted && finalAnswer && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [isCompleted, finalAnswer]);

    return (
        <div style={{ marginTop: 16 }}>
            {error && (
                <div
                    style={{
                        color: isDarkMode ? '#ff7875' : '#ff4d4f',
                        marginBottom: 12,
                        padding: 8,
                        background: isDarkMode ? '#2a1215' : '#fff2f0',
                        border: `1px solid ${isDarkMode ? '#434343' : '#ffccc7'}`,
                        borderRadius: 4,
                    }}
                >
                    {gLang('common.errorLabel')}
                    {error}
                </div>
            )}

            <div
                ref={containerRef}
                style={{
                    maxHeight: 500,
                    overflowY: 'auto',
                    padding: '0 4px',
                }}
            >
                <ThinkingTimeline
                    steps={thinkingSteps}
                    finalAnswer={finalAnswer}
                    isLoading={isLoading}
                    onFinalAnswerChange={setEditedAnswer}
                />
            </div>
        </div>
    );
};
