import React, { useMemo } from 'react';
import { Card, Col, Divider, Row, Space, Tag, Typography } from 'antd';
import Wrapper from '@common/components/Wrapper/Wrapper';
import PageTitle from '@common/components/PageTitle/PageTitle';
import usePageTitle from '@common/hooks/usePageTitle';
import { gLang } from '@common/language';

const { Paragraph, Text, Title } = Typography;

const AutoProcessRules: React.FC = () => {
    usePageTitle();

    const flowSteps = useMemo(
        () => [
            {
                key: 'limit',
                title: gLang('aiCenter.autoProcess.flow.limit.title'),
                desc: gLang('aiCenter.autoProcess.flow.limit.desc'),
                priority: 1,
            },
            {
                key: 'notify',
                title: gLang('aiCenter.autoProcess.flow.notify.title'),
                desc: gLang('aiCenter.autoProcess.flow.notify.desc'),
                priority: 2,
            },
            {
                key: 'handler',
                title: gLang('aiCenter.autoProcess.flow.handler.title'),
                desc: gLang('aiCenter.autoProcess.flow.handler.desc'),
                priority: 3,
            },
            {
                key: 'autoReject',
                title: gLang('aiCenter.autoProcess.flow.autoReject.title'),
                desc: gLang('aiCenter.autoProcess.flow.autoReject.desc'),
                priority: 4,
            },
            {
                key: 'autoEntrust',
                title: gLang('aiCenter.autoProcess.flow.autoEntrust.title'),
                desc: gLang('aiCenter.autoProcess.flow.autoEntrust.desc'),
                priority: 5,
            },
        ],
        []
    );

    const handlerCards = useMemo(
        () => [
            {
                key: 'AG',
                title: gLang('aiCenter.autoProcess.handlers.AG.title'),
                tags: [
                    gLang('aiCenter.autoProcess.actions.autoReject'),
                    gLang('aiCenter.autoProcess.actions.autoEntrust'),
                ],
                items: [
                    gLang('aiCenter.autoProcess.handlers.AG.rule1'),
                    gLang('aiCenter.autoProcess.handlers.AG.rule2'),
                    gLang('aiCenter.autoProcess.handlers.AG.rule3'),
                    gLang('aiCenter.autoProcess.handlers.AG.rule4'),
                    gLang('aiCenter.autoProcess.handlers.AG.rule5'),
                ],
            },
            {
                key: 'RP',
                title: gLang('aiCenter.autoProcess.handlers.RP.title'),
                tags: [
                    gLang('aiCenter.autoProcess.actions.autoEntrust'),
                    gLang('aiCenter.autoProcess.actions.note'),
                ],
                items: [
                    gLang('aiCenter.autoProcess.handlers.RP.rule1'),
                    gLang('aiCenter.autoProcess.handlers.RP.rule2'),
                ],
            },
            {
                key: 'MM',
                title: gLang('aiCenter.autoProcess.handlers.MM.title'),
                tags: [
                    gLang('aiCenter.autoProcess.actions.autoReject'),
                    gLang('aiCenter.autoProcess.actions.reply'),
                ],
                items: [
                    gLang('aiCenter.autoProcess.handlers.MM.rule1'),
                    gLang('aiCenter.autoProcess.handlers.MM.rule2'),
                    gLang('aiCenter.autoProcess.handlers.MM.rule3'),
                ],
            },
            {
                key: 'ME',
                title: gLang('aiCenter.autoProcess.handlers.ME.title'),
                tags: [
                    gLang('aiCenter.autoProcess.actions.autoReject'),
                    gLang('aiCenter.autoProcess.actions.reply'),
                ],
                items: [
                    gLang('aiCenter.autoProcess.handlers.ME.rule1'),
                    gLang('aiCenter.autoProcess.handlers.ME.rule2'),
                ],
            },
            {
                key: 'OT',
                title: gLang('aiCenter.autoProcess.handlers.OT.title'),
                tags: [gLang('aiCenter.autoProcess.actions.autoEntrust')],
                items: [gLang('aiCenter.autoProcess.handlers.OT.rule1')],
            },
            {
                key: 'AW',
                title: gLang('aiCenter.autoProcess.handlers.AW.title'),
                tags: [gLang('aiCenter.autoProcess.actions.manual')],
                items: [gLang('aiCenter.autoProcess.handlers.AW.rule1')],
            },
        ],
        []
    );

    return (
        <Wrapper>
            <PageTitle title={gLang('aiCenter.autoProcess.title')} />
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Paragraph type="secondary">{gLang('aiCenter.autoProcess.intro')}</Paragraph>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={9}>
                        <Card style={{ height: '100%' }}>
                            <Title level={4} style={{ marginTop: 0 }}>
                                {gLang('aiCenter.autoProcess.flow.title')}
                            </Title>
                            <Text type="secondary">
                                {gLang('aiCenter.autoProcess.flow.kicker')}
                            </Text>
                            <Divider style={{ margin: '16px 0' }} />
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                {flowSteps.map((step, index) => (
                                    <div key={step.key}>
                                        <div
                                            style={{
                                                padding: 12,
                                                borderRadius: 12,
                                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                                background: 'rgba(148, 163, 184, 0.08)',
                                            }}
                                        >
                                            <Text style={{ fontSize: 12 }}>
                                                {gLang('aiCenter.autoProcess.flow.priority', {
                                                    priority: step.priority,
                                                })}
                                            </Text>
                                            <Title level={5} style={{ margin: '6px 0 4px' }}>
                                                {step.title}
                                            </Title>
                                            <Text type="secondary">{step.desc}</Text>
                                        </div>
                                        {index < flowSteps.length - 1 && (
                                            <div
                                                style={{
                                                    height: 18,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                ↓
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </Space>
                            <Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
                                {gLang('aiCenter.autoProcess.flow.tip')}
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} lg={15}>
                        <Card>
                            <Title level={4} style={{ marginTop: 0 }}>
                                {gLang('aiCenter.autoProcess.handlers.title')}
                            </Title>
                            <Text type="secondary">
                                {gLang('aiCenter.autoProcess.handlers.subtitle')}
                            </Text>
                            <Divider style={{ margin: '16px 0' }} />
                            <Row gutter={[12, 12]}>
                                {handlerCards.map(card => (
                                    <Col xs={24} md={12} key={card.key}>
                                        <div
                                            style={{
                                                padding: 14,
                                                borderRadius: 12,
                                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                                background: 'rgba(148, 163, 184, 0.06)',
                                                height: '100%',
                                            }}
                                        >
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {gLang('aiCenter.autoProcess.handlers.handlerTag', {
                                                    tag: card.key,
                                                })}
                                            </Text>
                                            <Title level={5} style={{ margin: '6px 0 8px' }}>
                                                {card.title}
                                            </Title>
                                            <Space size={[6, 6]} wrap style={{ marginBottom: 8 }}>
                                                {card.tags.map(tag => (
                                                    <Tag key={tag} style={{ marginInlineEnd: 0 }}>
                                                        {tag}
                                                    </Tag>
                                                ))}
                                            </Space>
                                            <Space direction="vertical" size="small">
                                                {card.items.map(item => (
                                                    <div
                                                        key={item}
                                                        style={{
                                                            display: 'flex',
                                                            gap: 8,
                                                            alignItems: 'flex-start',
                                                        }}
                                                    >
                                                        <span style={{ marginTop: 6 }}>•</span>
                                                        <Text>{item}</Text>
                                                    </div>
                                                ))}
                                            </Space>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </Wrapper>
    );
};

export default AutoProcessRules;
