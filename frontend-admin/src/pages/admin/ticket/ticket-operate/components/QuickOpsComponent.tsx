// 工单操作中的开发者模式

import React, { useEffect, useState } from 'react';
import {
    Button,
    Card,
    Divider,
    Drawer,
    Form,
    Input,
    List,
    Modal,
    Space,
    Switch,
    Tag,
    Upload,
    Typography,
} from 'antd';
import {
    CheckCircleOutlined,
    CloudDownloadOutlined,
    DatabaseOutlined,
    DeleteOutlined,
    DownloadOutlined,
    DownOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined,
    SaveOutlined,
    ToolOutlined,
    UpOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import axiosInstance, { submitData } from '@common/axiosConfig';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { gLang } from '@common/language';
import { ScriptCenterItem } from '@ecuc/shared/types/script.types';
import { useAuth } from '@common/contexts/AuthContext';

const { TextArea } = Input;
const { Text } = Typography;

interface OperationResult {
    index: number;
    payload: any;
    success: boolean;
    message: string;
    result?: any;
}

interface QuickOpsComponentProps {
    ticket: Ticket;
    setIsFormDisabled: (disabled: boolean) => void;
    messageApi: any;
    modal: any;
}

/**
 * 获取对象中嵌套属性的值，支持数组下标，如 "details[0].displayTitle"
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => {
        if (!acc) return undefined;
        const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
            const prop = arrayMatch[1];
            const index = parseInt(arrayMatch[2], 10);
            return acc[prop] ? acc[prop][index] : undefined;
        }
        return acc[key];
    }, obj);
}

/**
 * 使用 ES6 模板字符串语法，即 ${变量名}，替换成 ticket 中对应的值
 */
function replaceTemplateString(str: string, ticket: Ticket): string {
    return str.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
        const key = variableName.trim();
        const value = getNestedValue(ticket, key);
        return value !== undefined ? String(value) : '';
    });
}

/**
 * 递归遍历对象或数组，将其中字符串中的模板表达式进行替换
 */
function transformPayloadWithTicket(obj: any, ticket: Ticket): any {
    if (typeof obj === 'string') {
        return replaceTemplateString(obj, ticket);
    } else if (Array.isArray(obj)) {
        return obj.map(item => transformPayloadWithTicket(item, ticket));
    } else if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = transformPayloadWithTicket(obj[key], ticket);
        }
        return newObj;
    }
    return obj;
}

const QuickOpsComponent: React.FC<QuickOpsComponentProps> = ({
    ticket,
    setIsFormDisabled,
    messageApi,
    modal,
}) => {
    const { user } = useAuth();
    const [scriptModalOpen, setScriptModalOpen] = useState(false);
    const [scriptList, setScriptList] = useState<ScriptCenterItem[]>([]);
    const [scriptListLoading, setScriptListLoading] = useState(false);
    const [scriptSaving, setScriptSaving] = useState(false);
    const [scriptForm] = Form.useForm();
    // 保存 JSON 输入框的内容
    const [quickOpJson, setQuickOpJson] = useState<string>('');
    // 存储每个操作的结果
    const [operationResults, setOperationResults] = useState<OperationResult[]>([]);
    // 控制进度弹窗显示
    const [progressModalVisible, setProgressModalVisible] = useState(false);
    // 保存用户上传的脚本代码
    const [userScript, setUserScript] = useState<string>('');

    // 新增：自动在加载新工单时执行脚本
    const [autoRunOnLoad, setAutoRunOnLoad] = useState<boolean>(false);
    // 新增：跳过填充到输入框，直接执行
    const [autoExecute, setAutoExecute] = useState<boolean>(false);

    // 组件挂载时从 localStorage 中读取设置和脚本
    useEffect(() => {
        const run = localStorage.getItem('autoRunOnLoad');
        const exec = localStorage.getItem('autoExecute');
        if (run !== null) setAutoRunOnLoad(run === '1');
        if (exec !== null) setAutoExecute(exec === '1');
        const savedScript = localStorage.getItem('userScript');
        if (savedScript) {
            setUserScript(savedScript);
            setCollapsed(false); // 有脚本则展开
        } else {
            setCollapsed(true); // 无脚本保持折叠
        }
    }, []);

    // 设置变化时写入 localStorage，跨 session 保存
    useEffect(() => {
        localStorage.setItem('autoRunOnLoad', autoRunOnLoad ? '1' : '0');
    }, [autoRunOnLoad]);
    useEffect(() => {
        localStorage.setItem('autoExecute', autoExecute ? '1' : '0');
    }, [autoExecute]);
    useEffect(() => {
        localStorage.setItem('userScript', userScript);
    }, [userScript]);

    const loadScriptList = async () => {
        setScriptListLoading(true);
        try {
            const response = await axiosInstance.get('/script/list');
            const scripts = response.data?.scripts ?? response.data ?? [];
            setScriptList(Array.isArray(scripts) ? scripts : []);
        } catch {
            messageApi.error(gLang('scriptCenter.loadFailed'));
        } finally {
            setScriptListLoading(false);
        }
    };

    const handleSaveScript = async (values: {
        title: string;
        description?: string;
        isPublic?: boolean;
    }) => {
        if (!userScript.trim()) {
            messageApi.warning(gLang('scriptCenter.noScriptToSave'));
            return;
        }
        setScriptSaving(true);
        try {
            const allValues = scriptForm.getFieldsValue();
            const isPublic = allValues.isPublic !== undefined ? allValues.isPublic : true;
            await axiosInstance.post('/script/upload', {
                title: values.title,
                description: values.description,
                isPublic: isPublic,
                content: userScript,
            });
            messageApi.success(gLang('scriptCenter.saveSuccess'));
            await loadScriptList();
            scriptForm.resetFields();
        } catch {
            messageApi.error(gLang('scriptCenter.saveFailed'));
        } finally {
            setScriptSaving(false);
        }
    };

    const applyScriptFromCenter = (script: ScriptCenterItem) => {
        setUserScript(script.content);
        localStorage.setItem('userScript', script.content);
        setCollapsed(false);
        messageApi.success(gLang('scriptCenter.applySuccess'));
    };

    const downloadScript = (script: ScriptCenterItem) => {
        // 创建 Blob 对象
        const blob = new Blob([script.content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        // 创建下载链接
        const link = document.createElement('a');
        link.href = url;
        // 使用脚本标题作为文件名，移除特殊字符
        const fileName = script.title.replace(/[^\w\u4e00-\u9fa5-]/g, '_') + '.js';
        link.download = fileName;

        // 触发下载
        document.body.appendChild(link);
        link.click();

        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        messageApi.success(gLang('admin.quickOpsDownloaded', { fileName }));
    };

    const confirmDeleteScript = async (script: ScriptCenterItem) => {
        const confirmed = await new Promise<boolean>(resolve => {
            modal.confirm({
                icon: <ExclamationCircleOutlined />,
                title: gLang('scriptCenter.deleteConfirm'),
                content: script.title,
                okText: gLang('ok'),
                cancelText: gLang('cancel'),
                onOk: () => resolve(true),
                onCancel: () => resolve(false),
            });
        });
        if (!confirmed) return;
        try {
            await axiosInstance.delete(`/script/${script.id}`);
            messageApi.success(gLang('scriptCenter.deleteSuccess'));
            await loadScriptList();
        } catch {
            messageApi.error(gLang('scriptCenter.deleteFailed'));
        }
    };

    useEffect(() => {
        if (scriptModalOpen) {
            loadScriptList();
        }
    }, [scriptModalOpen]);

    // ticket 变化时自动运行脚本
    useEffect(() => {
        if (autoRunOnLoad) {
            runUserScript();
        }
    }, [ticket, autoRunOnLoad]);

    // 批量提交快捷操作，并展示进度
    const handleMultipleQuickOps = async (jsonOverride?: string) => {
        const jsonData = jsonOverride ?? quickOpJson;
        if (!jsonData.trim()) {
            messageApi.warning(gLang('QuickOps.enterValidJson'));
            return;
        }
        try {
            await new Promise<void>((resolve, reject) => {
                modal.confirm({
                    icon: <ExclamationCircleOutlined />,
                    title: gLang('QuickOps.confirmSubmitTitle'),
                    content: (
                        <div>
                            <p>{gLang('QuickOps.confirmSubmitContent')}</p>
                            <p>{gLang('QuickOps.quickActionContentLabel')}</p>
                            <pre
                                style={{
                                    maxHeight: 200,
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {jsonData}
                            </pre>
                        </div>
                    ),
                    okText: gLang('admin.quickOpsConfirm'),
                    cancelText: gLang('QuickOps.cancelText'),
                    onOk: () => resolve(),
                    onCancel: () => reject(gLang('QuickOps.cancelText')),
                });
            });

            const parsed = JSON.parse(jsonData);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            setOperationResults([]);
            setProgressModalVisible(true);

            const results: OperationResult[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const finalUrl = item.url || '/ticket/admin';
                const finalData = transformPayloadWithTicket(item.data || {}, ticket);

                try {
                    const response = await submitData({
                        data: finalData,
                        url: finalUrl,
                        redirectTo: '',
                        successMessage: gLang('QuickOps.submitSuccess'),
                        method: 'POST',
                        setIsFormDisabled,
                        setIsModalOpen: () => {},
                    });
                    results.push({
                        index: i + 1,
                        payload: { url: finalUrl, data: finalData },
                        success: true,
                        message: gLang('QuickOps.submitSuccess'),
                        result: response,
                    });
                } catch (error: any) {
                    results.push({
                        index: i + 1,
                        payload: { url: finalUrl, data: finalData },
                        success: false,
                        message: error?.message || gLang('QuickOps.submitFail'),
                    });
                }
                setOperationResults([...results]);
            }

            messageApi.success(gLang('QuickOps.allOpsCompleted'));
            setQuickOpJson('');
        } catch (error) {
            messageApi.error(gLang('QuickOps.cancelOrError') + error);
        }
    };

    // 检测是否为 iPhone Safari（不支持 new Function）
    const isIOSSafari = () => {
        const ua = navigator.userAgent;
        const isIOS = /iP(ad|hone|od)/.test(ua);
        // 检测是否为 Safari（排除 Chrome、Firefox、Edge 等）
        const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
        return isIOS && isSafari;
    };

    // 检测 Function 构造器是否可用
    const isFunctionConstructorAvailable = () => {
        try {
            const testFunc = new Function('return true');
            return typeof testFunc === 'function';
        } catch {
            return false;
        }
    };

    // 执行用户脚本并根据开关决定后续动作
    const runUserScript = () => {
        if (!userScript) {
            messageApi.warning(gLang('QuickOps.uploadScriptFirst'));
            return;
        }

        // 检测 iOS Safari 或 Function 构造器不可用
        if (isIOSSafari() || !isFunctionConstructorAvailable()) {
            messageApi.warning(gLang('admin.quickOpsNoScript'));
            return;
        }

        let output: any;
        try {
            const func = new Function('ticket', userScript + '; return runTicketScript(ticket);');
            output = func(ticket);
        } catch (error: any) {
            if (
                error.message &&
                (error.message.includes('Function') ||
                    error.message.includes('eval') ||
                    error.message.includes('not allowed'))
            ) {
                messageApi.warning(gLang('admin.quickOpsNoScriptExec'));
            } else {
                messageApi.warning(gLang('QuickOps.scriptExecError') + error.message);
            }
            return;
        }
        let outputStr: string;
        if (typeof output === 'object') {
            try {
                outputStr = JSON.stringify(output);
            } catch {
                messageApi.warning(gLang('QuickOps.scriptOutputNotJson'));
                return;
            }
        } else {
            outputStr = String(output);
        }

        if (autoExecute) {
            handleMultipleQuickOps(outputStr);
        } else {
            setQuickOpJson(outputStr);
            messageApi.success(gLang('QuickOps.scriptSuccessFillInput'));
        }
    };

    // 上传脚本并存入 state 和 localStorage
    const uploadProps = {
        name: 'file',
        accept: '.js',
        showUploadList: false,
        beforeUpload: (file: File) => {
            const reader = new FileReader();
            reader.onload = event => {
                const content = event.target?.result?.toString() || '';
                setUserScript(content);
                localStorage.setItem('userScript', content);
                messageApi.success(gLang('QuickOps.scriptUploadedSuccess'));
                setCollapsed(false); // 上传脚本后自动展开
            };
            reader.readAsText(file);
            return false;
        },
    };

    const [collapsed, setCollapsed] = useState(true);

    const isSuper = user?.permission?.includes('authorize.super');

    const formatCreatedAt = (value?: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        // 显示为本地时间字符串，包含日期与时间
        return date.toLocaleString();
    };

    return (
        <>
            <Card
                size="small"
                styles={{
                    header: {
                        padding: '8px 12px',
                        color: collapsed ? 'var(--ant-color-text-tertiary)' : undefined,
                    },
                    body: collapsed ? { padding: 0, display: 'none' } : { padding: 12 },
                }}
                title={
                    <Space
                        size={8}
                        align="center"
                        onClick={() => setCollapsed(prev => !prev)}
                        style={{ cursor: 'pointer' }}
                    >
                        <ToolOutlined
                            style={{
                                color: collapsed ? 'var(--ant-color-text-tertiary)' : undefined,
                            }}
                        />
                        <Text
                            strong
                            type={collapsed ? 'secondary' : undefined}
                            style={{ fontSize: 16 }}
                        >
                            {gLang('QuickOps.title')}
                        </Text>
                    </Space>
                }
                extra={
                    <Button
                        type="text"
                        size="small"
                        icon={collapsed ? <DownOutlined /> : <UpOutlined />}
                        onClick={() => setCollapsed(prev => !prev)}
                        title={
                            collapsed ? gLang('common.switch.open') : gLang('common.switch.close')
                        }
                        style={{ color: collapsed ? 'var(--ant-color-text-tertiary)' : undefined }}
                    />
                }
                style={{ marginBottom: 16 }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    {/* JSON 输入框 */}
                    <TextArea
                        value={quickOpJson}
                        onChange={e => setQuickOpJson(e.target.value)}
                        rows={3}
                        placeholder={gLang('QuickOps.jsonPlaceholder')}
                    />

                    {/* 主操作按钮 */}
                    <Space wrap>
                        <Button
                            type="primary"
                            onClick={() => handleMultipleQuickOps()}
                            disabled={!quickOpJson.trim()}
                        >
                            {gLang('QuickOps.executeButton')}
                        </Button>
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>
                                {gLang('scriptCenter.uploadScript')}
                            </Button>
                        </Upload>
                        <Button
                            icon={<DatabaseOutlined />}
                            onClick={() => setScriptModalOpen(true)}
                        >
                            {gLang('scriptCenter.open')}
                        </Button>
                    </Space>

                    {/* 脚本状态和开关 */}
                    {userScript && (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Tag icon={<CheckCircleOutlined />} color="green">
                                {gLang('QuickOps.scriptLoaded')}
                            </Tag>
                            <Space direction="vertical" size={4}>
                                <Space>
                                    <Switch
                                        checked={autoRunOnLoad}
                                        onChange={checked => {
                                            setAutoRunOnLoad(checked);
                                            // 如果关闭自动运行，同时关闭自动执行
                                            if (!checked) {
                                                setAutoExecute(false);
                                            }
                                        }}
                                    />
                                    <Text type="secondary">
                                        {autoRunOnLoad
                                            ? gLang('QuickOps.autoRun')
                                            : gLang('QuickOps.manualRun')}
                                    </Text>
                                </Space>
                                <Space>
                                    <Switch
                                        checked={autoExecute}
                                        disabled={!autoRunOnLoad}
                                        onChange={setAutoExecute}
                                    />
                                    <Text type="secondary">
                                        {autoExecute
                                            ? gLang('QuickOps.autoExecute')
                                            : gLang('QuickOps.manualExecute')}
                                    </Text>
                                </Space>
                            </Space>
                        </Space>
                    )}
                    <div className="script" style={{ marginBottom: 16 }}></div>
                </Space>
            </Card>

            <Drawer
                title={gLang('scriptCenter.title')}
                open={scriptModalOpen}
                onClose={() => setScriptModalOpen(false)}
                width={600}
                placement="right"
            >
                <Form
                    layout="vertical"
                    form={scriptForm}
                    initialValues={{ isPublic: true }}
                    onFinish={handleSaveScript}
                >
                    <Form.Item
                        label={gLang('scriptCenter.name')}
                        name="title"
                        rules={[{ required: true, message: gLang('required') }]}
                    >
                        <Input placeholder={gLang('scriptCenter.namePlaceholder')} />
                    </Form.Item>
                    <Form.Item label={gLang('scriptCenter.description')} name="description">
                        <Input.TextArea
                            rows={2}
                            placeholder={gLang('scriptCenter.descPlaceholder')}
                        />
                    </Form.Item>
                    <Form.Item
                        label={gLang('scriptCenter.visibility')}
                        name="isPublic"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren={gLang('scriptCenter.publicTag')}
                            unCheckedChildren={gLang('scriptCenter.privateTag')}
                        />
                    </Form.Item>
                    <Space style={{ marginBottom: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={scriptSaving}
                        >
                            {gLang('scriptCenter.saveButton')}
                        </Button>
                        <Button
                            onClick={loadScriptList}
                            icon={<ReloadOutlined />}
                            loading={scriptListLoading}
                        >
                            {gLang('scriptCenter.refresh')}
                        </Button>
                    </Space>
                </Form>
                <Divider style={{ margin: '12px 0' }} />
                <List
                    loading={scriptListLoading}
                    itemLayout="vertical"
                    dataSource={scriptList}
                    locale={{ emptyText: gLang('scriptCenter.empty') }}
                    renderItem={item => {
                        const actions = [
                            <Button
                                key="download"
                                type="link"
                                icon={<DownloadOutlined />}
                                onClick={() => downloadScript(item)}
                            >
                                {gLang('common.download')}
                            </Button>,
                            <Button
                                key="use"
                                type="link"
                                icon={<CloudDownloadOutlined />}
                                onClick={() => applyScriptFromCenter(item)}
                            >
                                {gLang('scriptCenter.useAction')}
                            </Button>,
                        ];
                        const isOwner = item.ownerId === String(user?.userid ?? '');
                        if (isOwner || isSuper) {
                            actions.push(
                                <Button
                                    key="delete"
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => confirmDeleteScript(item)}
                                >
                                    {gLang('scriptCenter.deleteAction')}
                                </Button>
                            );
                        }
                        return (
                            <List.Item actions={actions}>
                                <List.Item.Meta
                                    title={
                                        <Space size={8}>
                                            <Text>{item.title}</Text>
                                            {!item.isPublic && (
                                                <Tag color="purple">
                                                    {gLang('scriptCenter.privateTag')}
                                                </Tag>
                                            )}
                                            {isOwner && (
                                                <Tag color="green">
                                                    {gLang('scriptCenter.mineTag')}
                                                </Tag>
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={4}>
                                            <Text type="secondary">
                                                {item.description ||
                                                    gLang('scriptCenter.noDescription')}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {gLang('scriptCenter.ownerUidPrefix')}{' '}
                                                {item.ownerId}
                                                {item.createdAt &&
                                                    ` · ${formatCreatedAt(item.createdAt)}`}
                                            </Text>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
            </Drawer>

            <Modal
                title={gLang('QuickOps.progressModalTitle')}
                open={progressModalVisible}
                onCancel={() => setProgressModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setProgressModalVisible(false)}>
                        {gLang('QuickOps.closeButton')}
                    </Button>,
                ]}
                width={600}
            >
                {operationResults.length === 0 && <p>{gLang('QuickOps.processingMessage')}</p>}
                {operationResults.map(result => (
                    <Card key={result.index} style={{ marginBottom: 8 }}>
                        <p>
                            <strong>
                                {gLang('QuickOps.opNumber')}
                                {result.index}
                            </strong>
                        </p>
                        <p>
                            {gLang('QuickOps.requestUrl')}
                            {result.payload.url}
                        </p>
                        <p>
                            {gLang('QuickOps.requestData')}
                            {JSON.stringify(result.payload.data)}
                        </p>
                        <p>
                            {gLang('QuickOps.statusLabel')}
                            {result.success ? (
                                <span style={{ color: 'green' }}>
                                    {gLang('QuickOps.successStatus')}
                                </span>
                            ) : (
                                <span style={{ color: 'red' }}>{gLang('QuickOps.failStatus')}</span>
                            )}
                        </p>
                        <p>
                            {gLang('QuickOps.messageLabel')}
                            {result.message}
                        </p>
                        {result.result && (
                            <p>
                                {gLang('QuickOps.resultLabel')}
                                {JSON.stringify(result.result)}
                            </p>
                        )}
                    </Card>
                ))}
            </Modal>
        </>
    );
};

export default QuickOpsComponent;
