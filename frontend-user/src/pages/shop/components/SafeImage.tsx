import React, { useState } from 'react';
import defaultImage from '../default-product.png';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt, fallback = defaultImage, ...props }) => {
    const [imgSrc, setImgSrc] = useState<string | undefined>(src);
    return (
        <img {...props} src={imgSrc || fallback} alt={alt} onError={() => setImgSrc(fallback)} />
    );
};

export default SafeImage;
