import React, { useMemo } from "react";
import { LABELS } from "../../constants";
import { LiquidateItem } from "./item";
import { useEnrichedLendingObligations } from "./../../hooks";
import "./style.less";
import { Card, Col, Row, Statistic } from "antd";
import { BarChartStatistic } from "../../components/BarChartStatistic";

export const LiquidateView = () => {
  const { obligations } = useEnrichedLendingObligations();

  const atRisk = useMemo(() => obligations.filter(item => item.info.health < 1.0), [obligations]);

  const valueAtRisk = useMemo(() => atRisk.reduce((acc, item) => acc + item.info.borrowedInQuote, 0), [atRisk]);
  const loansAtRiskCount = useMemo(() => atRisk.length, [atRisk]);
  const pctAtRisk = useMemo(() => atRisk.length / obligations.length, [atRisk, obligations]);

  const groupedLoans = useMemo(() => {
    return atRisk.reduce((acc, item) => {
      acc.set(item.info.name, (acc.get(item.info.name) || 0) + item.info.borrowedInQuote);
      return acc;
    }, new Map<string, number>())
  }, [atRisk]);

  const keys = useMemo(() => [...groupedLoans.keys()], [groupedLoans]);

  return (
    <div className="liquidate-container">
      {atRisk.length === 0 ? (
        <div className="liquidate-info">{LABELS.LIQUIDATE_NO_LOANS}</div>
      ) : (
          <div className="flexColumn">
            <Row
              gutter={[16, { xs: 8, sm: 16, md: 16, lg: 16 }]}
              className="home-info-row" >
              <Col xs={24} xl={5}>
                <Card>
                  <Statistic
                    title="Value at risk"
                    value={valueAtRisk}
                    precision={2}
                    valueStyle={{ color: "#3f8600" }}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col xs={24} xl={5}>
                <Card>
                  <Statistic
                    title="Loans at risk"
                    value={loansAtRiskCount}
                    precision={0}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={5}>
                <Card>
                  <Statistic
                    title="% loans at risk"
                    value={pctAtRisk * 100}
                    precision={2}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col xs={24} xl={9}>
                <Card>
                  <BarChartStatistic
                    title="At risk loan composition"
                    name={(item) => item}
                    getPct={(item) => (groupedLoans.get(item) || 0) / valueAtRisk}
                    items={keys} />
                </Card>
              </Col>
            </Row>
            <Card >
              <div className="liquidate-item liquidate-header">
                <div>{LABELS.TABLE_TITLE_ASSET}</div>
                <div>{LABELS.TABLE_TITLE_LOAN_BALANCE}</div>
                <div>{LABELS.TABLE_TITLE_COLLATERAL_BALANCE}</div>
                <div>{LABELS.TABLE_TITLE_APY}</div>
                <div>{LABELS.TABLE_TITLE_LTV}</div>
                <div>{LABELS.TABLE_TITLE_HEALTH}</div>
                <div>{LABELS.TABLE_TITLE_ACTION}</div>
              </div>
              {atRisk.map((item) => (
                <LiquidateItem
                  key={item.account.pubkey.toBase58()}
                  item={item}
                ></LiquidateItem>
              ))}
            </Card>
          </div>
        )}
    </div>
  );
};
