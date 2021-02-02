import { Button, Card } from "antd";
import React from "react";
import { LABELS } from "../../constants";
import { Link } from "react-router-dom";

export const NothingBorrowedPanel = () => {
  const bodyStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  };

  return (
    <Card bodyStyle={bodyStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        <strong>{LABELS.NOTHING_BORROWED}</strong>
        <br />
        <p>{LABELS.NOTHING_BORROWED_MESSAGE}</p>
        <Link to="/borrow">
          <Button type="primary" size={"large"}>
            <span>{LABELS.BORROW_NOW}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
};
