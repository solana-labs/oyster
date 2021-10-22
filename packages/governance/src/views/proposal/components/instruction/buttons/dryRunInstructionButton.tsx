import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Modal,
  Row,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { ParsedAccount, utils, useWallet } from '@oyster/common';
import {
  InstructionData,
  Proposal,
  ProposalState,
} from '../../../../../models/accounts';
import { dryRunInstruction } from '../../../../../actions/dryRunInstruction';
import { useRpcContext } from '../../../../../hooks/useRpcContext';
import { SimulatedTransactionResponse, Transaction } from '@solana/web3.js';
import { BaseType } from 'antd/lib/typography/Base';
import { RpcContext } from '../../../../../models/core/api';

const { getExplorerInspectorUrl } = utils;

const { Text } = Typography;

export function DryRunInstructionButton({
  proposal,
  instructionData,
}: {
  proposal: ParsedAccount<Proposal>;
  instructionData: InstructionData | undefined;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{
    response: SimulatedTransactionResponse;
    transaction: Transaction;
  }>();
  const [error, setError] = useState();

  if (
    !connected ||
    ![
      ProposalState.Draft,
      ProposalState.SigningOff,
      ProposalState.Voting,
    ].includes(proposal.info.state) ||
    !instructionData
  ) {
    return null;
  }

  const onDryRun = async () => {
    setIsModalVisible(true);
    setIsPending(true);
    try {
      const result = await dryRunInstruction(rpcContext, instructionData);
      setResult(result);
    } catch (ex) {
      setError(ex);
    } finally {
      setIsPending(false);
    }
  };

  const onClose = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Tooltip title="simulate instruction execution">
        <Button onClick={onDryRun}>
          <PlayCircleOutlined style={{ color: 'orange' }} key="play" />
        </Button>
      </Tooltip>
      <Modal
        title="Instruction simulation results"
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
          error={error}
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
  error,
}: {
  rpcContext: RpcContext;
  isPending: boolean;
  result:
    | { response: SimulatedTransactionResponse; transaction: Transaction }
    | undefined;
  error: Error | undefined;
}) {
  const iconStyle = { fontSize: '150%' };

  if (error) {
    return (
      <Space>
        <Text type="danger">
          <CloseCircleOutlined style={iconStyle} />
        </Text>
        <Text> {`Can't run simulation. Error: ${error.message}`}</Text>
      </Space>
    );
  }

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
              ? 'Simulation returned an error'
              : 'Simulation ran successfully'}
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
