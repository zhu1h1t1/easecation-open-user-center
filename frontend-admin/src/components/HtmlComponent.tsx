import React from 'react';

interface HtmlContentProps {
    content: string;
}

const HTMLComponent: React.FC<HtmlContentProps> = ({ content }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

export default HTMLComponent;
