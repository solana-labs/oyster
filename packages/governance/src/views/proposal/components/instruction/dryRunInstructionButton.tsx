import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Button, Col, Modal, Row, Spin, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';

import { ParsedAccount, useWallet } from '@oyster/common';
import {
  Proposal,
  ProposalInstruction,
  ProposalState,
} from '../../../../models/accounts';
import { dryRunInstruction } from '../../../../actions/dryRunInstruction';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { SimulatedTransactionResponse, Transaction } from '@solana/web3.js';
import { BaseType } from 'antd/lib/typography/Base';
import { RpcContext } from '../../../../models/api';
import { utils } from '@oyster/common';

const { getExplorerInspectorUrl } = utils;

const { Text } = Typography;

export function DryRunInstructionButton({
  proposal,
  proposalInstruction,
}: {
  proposal: ParsedAccount<Proposal>;
  proposalInstruction: ParsedAccount<ProposalInstruction>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{
    response: SimulatedTransactionResponse;
    transaction: Transaction;
  }>();

  if (
    !connected ||
    ![
      ProposalState.Draft,
      ProposalState.SigningOff,
      ProposalState.Voting,
    ].includes(proposal.info.state)
  ) {
    return null;
  }

  const onDryRun = async () => {
    setIsModalVisible(true);
    setIsPending(true);
    try {
      const result = await dryRunInstruction(rpcContext, proposalInstruction);
      setResult(result);
    } finally {
      setIsPending(false);
    }
  };

  const onClose = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Tooltip title="test instruction in dry run mode">
        <Button onClick={onDryRun}>
          <PlayCircleOutlined style={{ color: 'orange' }} key="play" />
        </Button>
      </Tooltip>
      <Modal
        title="Instruction simulation"
        visible={isModalVisible}
        onCancel={onClose}
        width={1000}
        footer={[
          <Button key="close" onClick={onClose} type="primary">
            Close
          </Button>,
        ]}
      >
        <DryRunStatus
          isPending={isPending}
          result={result}
          rpcContext={rpcContext}
        ></DryRunStatus>
      </Modal>
    </>
  );
}

function getLogTextType(text: string): BaseType {
  // Use some heuristics to highlight  error and success log messages

  text = text.toLowerCase();

  if (text.includes('failed')) {
    return 'danger';
  }

  if (text.includes('success')) {
    return 'success';
  }

  return 'secondary';
}

function DryRunStatus({
  isPending,
  result,
  rpcContext,
}: {
  rpcContext: RpcContext;
  isPending: boolean;
  result:
    | { response: SimulatedTransactionResponse; transaction: Transaction }
    | undefined;
}) {
  if (isPending || !result) {
    return <Spin />;
  }

  const onInspect = () => {
    const { endpoint, connection } = rpcContext;

    const inspectUrl = getExplorerInspectorUrl(
      endpoint,
      result.transaction,
      connection,
    );
    window.open(inspectUrl, '_blank');
  };

  const iconStyle = { fontSize: '150%' };

  return (
    <>
      <Row align="middle">
        <Col span={1}>
          {result.response.err ? (
            <Text type="danger">
              <CloseCircleOutlined style={iconStyle} />
            </Text>
          ) : (
            <Text type="success">
              <CheckCircleOutlined style={iconStyle} />
            </Text>
          )}
        </Col>
        <Col>
          <h3>
            {result.response.err
              ? 'Instruction returned an error'
              : 'Instruction ran successfully'}
          </h3>
        </Col>
      </Row>
      <Row>
        <Col push={1}>
          <ul className="instruction-log-list">
            {result.response.logs?.map((log, i) => (
              <li key={i}>
                <Text type={getLogTextType(log)}>{log}</Text>
              </li>
            ))}
          </ul>
        </Col>
      </Row>
      <Row>
        <Col push={1}>
          <Button type="ghost" onClick={onInspect}>
            Inspect
          </Button>
        </Col>
      </Row>
    </>
  );
}
