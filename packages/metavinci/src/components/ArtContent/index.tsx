import React, { useMemo } from 'react';
import { Image } from 'antd';
import { MetadataCategory } from '@oyster/common'

export const ArtContent = ({ content, category, className }: { category?: MetadataCategory, content?: string, className?: string }) => {
  return category === 'video' ?
    <video src={content} className={className} playsInline={true} autoPlay={true} controlsList="nodownload" loop={true} /> :
    <Image
      src={content}
      wrapperClassName={className}
    />;
}
