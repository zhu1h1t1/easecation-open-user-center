import { fetchData } from '../../../../axiosConfig';
import React, { useContext } from 'react';
import { Form, Input } from 'antd';
import { gLang } from '@common/language';
import MonthlyLinkVideoModal from './MonthlyLinkVideoModal';
import { FormContext } from 'antd/lib/form/context';
import { Rule } from 'antd/es/form';
import { MediaPlatform } from '@ecuc/shared/types/media.types';

interface MonthlyLinkFormItemProps {
    name?: string;
    rules?: Rule[];
    platform?: string; // 平台代码，如 B/D/K/X/W
}

const defaultRules: Rule[] = [
    {
        required: true,
        message: gLang('required'),
    },
    {
        pattern: /^(http|https):\/\//,
        message: gLang('mediaList.linkReq'),
    },
];

const MonthlyLinkFormItem: React.FC<MonthlyLinkFormItemProps> = ({
    name = 'link',
    rules,
    platform,
}) => {
    const formContext = useContext(FormContext);
    const form = formContext?.form;

    const [bv, setBv] = React.useState<string | null>(null);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>('');

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        if (
            !defaultRules.every(rule => {
                if (typeof rule === 'object') {
                    if ('required' in rule && rule.required && !e.target.value) return false;
                    if ('pattern' in rule && rule.pattern && !rule.pattern.test(e.target.value))
                        return false;
                }
                return true;
            })
        ) {
            return;
        }
        const value = e.target.value;
        if (value.includes('b23.tv') || value.includes('www.bilibili.com/video')) {
            const { longUrl, bv: bvValue } = await convertB23LinkWithBV(value);
            if (longUrl) {
                setInputValue(longUrl);
                form?.setFieldsValue({ [name]: longUrl });
            }
            setBv(bvValue || null);
        } else {
            setBv(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        form?.setFieldsValue({ [name]: value });
    };

    React.useEffect(() => {
        if (form && bv) {
            form.setFieldsValue({ [name]: bv });
        }
    }, [bv, form, name]);

    const isWeixinVideo = platform === MediaPlatform.Wechat;

    const computedRules: Rule[] =
        rules || (isWeixinVideo ? [{ required: true, message: gLang('required') }] : defaultRules);

    return (
        <>
            <Form.Item
                label={isWeixinVideo ? gLang('mediaList.workName') : gLang('mediaList.monthlyLink')}
                extra={
                    isWeixinVideo
                        ? gLang('mediaList.workNameIntro')
                        : gLang('mediaList.monthlyLinkIntro')
                }
                name={name}
                rules={computedRules}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Input value={inputValue} onChange={handleChange} onBlur={handleBlur} />
                    {bv && (
                        <span
                            style={{ marginLeft: 8, cursor: 'pointer' }}
                            onClick={() => setModalOpen(true)}
                        >
                            <svg width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor">
                                <path d="M512 128C300.3 128 128 300.3 128 512s172.3 384 384 384 384-172.3 384-384S723.7 128 512 128zm0 704c-176.7 0-320-143.3-320-320s143.3-320 320-320 320 143.3 320 320-143.3 320-320 320zm0-480c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm0 256c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z" />
                            </svg>
                        </span>
                    )}
                </div>
            </Form.Item>
            {bv && (
                <MonthlyLinkVideoModal
                    bv={bv}
                    open={modalOpen}
                    onCancel={() => setModalOpen(false)}
                />
            )}
        </>
    );
};

const convertB23LinkWithBV = async (
    shortUrl: string
): Promise<{ longUrl: string; bv: string | null }> => {
    try {
        let resultUrl = shortUrl;
        let bv: string | null = null;
        await fetchData({
            url: '/proxy/bilibili/convert-b23-link',
            method: 'GET',
            data: { url: shortUrl },
            setData: (data: any) => {
                if (data && data.url) {
                    resultUrl = data.url;
                }
                if (data && data.bv) {
                    bv = data.bv;
                }
            },
        });
        return { longUrl: resultUrl, bv: bv };
    } catch {
        return { longUrl: shortUrl, bv: null };
    }
};

export default MonthlyLinkFormItem;
