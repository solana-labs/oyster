import React, { useLayoutEffect, useState } from 'react';
import { Card } from 'antd';

const { Meta } = Card;

export const ArtCard = ({
  file,
  name,
  symbol,
}: {
  file?: File;
  name?: String;
  symbol?: String;
}) => {
  const [imgSrc, setImgSrc] = useState<string>();

  useLayoutEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        setImgSrc(event.target?.result as any);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <Card className="custom-card" cover={<img src={imgSrc} />}>
      <Meta title={`Title: ${title}`} description={`Symbol: ${symbol}`} />
    </Card>
  );
};
