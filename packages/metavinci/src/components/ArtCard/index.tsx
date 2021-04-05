import React, { useLayoutEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Avatar } from 'antd';

const { Meta } = Card;

export const ArtCard = (file: File) => {
  const [imgSrc, setImgSrc] = useState<string>();

  useLayoutEffect(() => {
    const reader = new FileReader();
    reader.onload = function (event) {
      setImgSrc(event.target?.result as any);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <Card className="custom-card" cover={<img src={imgSrc} />}>
      <Meta
        avatar={
          <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
        }
        title="Card title"
        description="This is the description"
      />
    </Card>
  );
};
