// Wiki工具集合页面

import React, { useState, useEffect } from 'react';
import { Space, Skeleton, Button, Tag, Empty } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { useTheme } from '@common/contexts/ThemeContext';
import { gLang } from '@common/language';
import PageTitle from '@common/components/PageTitle/PageTitle';
import Wrapper from '@common/components/Wrapper/Wrapper';
import WikiBindingModal from '../ticket/WikiBindingModal';
import { fetchData } from '@common/axiosConfig';
import { PlayerBindListData } from '@ecuc/shared/types/player.types';
import { useAuth } from '@common/contexts/AuthContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface WikiBindingInfo {
    user_id: number;
    ecid: string;
    bind_status: string;
    bound_at: string;
    unbound_at: string | null;
    user_name: string;
}

interface ECIDWithBinding {
    ecid: string;
    name: string;
    vip: number;
    media: number;
    binding: WikiBindingInfo | null;
}

const Wiki: React.FC = () => {
    const { user } = useAuth();
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const [isWikiModalOpen, setIsWikiModalOpen] = useState(false);
    const [ecidList, setEcidList] = useState<ECIDWithBinding[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 获取用户OpenID
    const userOpenID = user?.openid || '';

    // 获取ECID列表和绑定信息
    useEffect(() => {
        if (!userOpenID) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                // 获取ECID列表
                const ecidListData: PlayerBindListData[] = await new Promise((resolve, reject) => {
                    fetchData({
                        url: '/ec/list',
                        method: 'GET',
                        data: {},
                        setData: result => {
                            resolve(result || []);
                        },
                    }).catch(reject);
                });

                // 获取绑定信息
                let bindings: WikiBindingInfo[] = [];
                try {
                    await new Promise<void>((resolve, reject) => {
                        fetchData({
                            url: `/wiki/bindings/openid/${userOpenID}`,
                            method: 'GET',
                            data: {},
                            setData: result => {
                                bindings = result?.data || [];
                                resolve();
                            },
                        }).catch(reject);
                    });
                } catch {
                    // 没有绑定是正常的
                    bindings = [];
                }

                // 合并数据：为每个ECID找到对应的绑定信息
                const ecidWithBindings: ECIDWithBinding[] = ecidListData.map(ecid => {
                    const binding = bindings.find(b => b.ecid === ecid.ecid) || null;
                    return {
                        ecid: ecid.ecid,
                        name: ecid.name,
                        vip: ecid.vip,
                        media: ecid.media,
                        binding,
                    };
                });

                setEcidList(ecidWithBindings);
            } catch (error) {
                console.error(gLang('wiki.loadDataFailed'), error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [userOpenID]);

    // 主题色配置
    const customPalette =
        isCustomThemeActive && customTheme ? CUSTOM_THEME_PALETTES[customTheme] : null;

    // Only show bound items on this page
    const boundList = ecidList.filter(item => item.binding !== null);
    const allEcidBound = ecidList.length > 0 && boundList.length === ecidList.length;

    const getCardStyle = (hasBinding: boolean) => ({
        background: getThemeColor({
            light: hasBinding ? '#f6ffed' : '#FFFFFF',
            dark: hasBinding ? '#162312' : '#171717',
            custom: customPalette
                ? { [customTheme as string]: customPalette.surfaceAlt }
                : undefined,
        }),
        border: `1px solid ${getThemeColor({
            light: hasBinding ? '#b7eb8f' : '#E0E0E0',
            dark: hasBinding ? '#274916' : '#303030',
            custom: customPalette ? { [customTheme as string]: customPalette.border } : undefined,
        })}`,
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '16px',
        transition: 'all 0.2s ease',
    });

    // 如果正在加载，显示骨架屏
    if (isLoading) {
        return (
            <Wrapper>
                <PageTitle title={gLang('wiki.title')} />
                <Skeleton active paragraph={{ rows: 4 }} />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <div
                style={{
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    animation: 'fadeInUp 0.3s ease-in-out forwards',
                }}
            >
                <PageTitle title={gLang('wiki.title')} />
            </div>

            {ecidList.length === 0 ? (
                <Empty description={gLang('wiki.noEcid')} style={{ marginTop: '40px' }} />
            ) : boundList.length === 0 ? (
                <Empty description={gLang('wiki.noBoundWiki')} style={{ marginTop: '40px' }} />
            ) : (
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.3s ease-in-out 0.15s forwards`,
                    }}
                >
                    {boundList.map((item, index) => (
                        <div
                            key={item.ecid}
                            style={{
                                ...getCardStyle(!!item.binding),
                                opacity: 0,
                                animation: `fadeInUp 0.3s ease-in-out ${0.2 + index * 0.1}s forwards`,
                            }}
                        >
                            <Space align="start" size={12} style={{ width: '100%' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: getThemeColor({
                                            light: item.binding ? '#52c41a22' : '#d9d9d922',
                                            dark: item.binding ? '#52c41a22' : '#40404022',
                                            custom: customPalette
                                                ? {
                                                      [customTheme as string]:
                                                          customPalette.surfaceMuted,
                                                  }
                                                : undefined,
                                        }),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    {item.binding ? (
                                        <CheckCircleOutlined
                                            style={{
                                                fontSize: '20px',
                                                color: '#52c41a',
                                            }}
                                        />
                                    ) : (
                                        <ExclamationCircleOutlined
                                            style={{
                                                fontSize: '20px',
                                                color: getThemeColor({
                                                    light: '#8c8c8c',
                                                    dark: '#8c8c8c',
                                                    custom: customPalette
                                                        ? {
                                                              [customTheme as string]:
                                                                  customPalette.textMuted,
                                                          }
                                                        : undefined,
                                                }),
                                            }}
                                        />
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: getThemeColor({
                                                light: '#1A1A1A',
                                                dark: '#EEF2F7',
                                                custom: customPalette
                                                    ? {
                                                          [customTheme as string]:
                                                              customPalette.textPrimary,
                                                      }
                                                    : undefined,
                                            }),
                                            marginBottom: '8px',
                                        }}
                                    >
                                        {item.ecid}
                                        {item.name && (
                                            <span
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 400,
                                                    color: getThemeColor({
                                                        light: '#00000099',
                                                        dark: '#FFFFFF99',
                                                        custom: customPalette
                                                            ? {
                                                                  [customTheme as string]:
                                                                      customPalette.textMuted,
                                                              }
                                                            : undefined,
                                                    }),
                                                    marginLeft: '8px',
                                                }}
                                            >
                                                ({item.name})
                                            </span>
                                        )}
                                    </div>

                                    {item.binding ? (
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                color: getThemeColor({
                                                    light: '#00000099',
                                                    dark: '#FFFFFF99',
                                                    custom: customPalette
                                                        ? {
                                                              [customTheme as string]:
                                                                  customPalette.textMuted,
                                                          }
                                                        : undefined,
                                                }),
                                            }}
                                        >
                                            <Space size={8} wrap>
                                                <Tag color="green">{gLang('wiki.tagBound')}</Tag>
                                                <span>
                                                    {gLang('wiki.wikiUserLabel')}:{' '}
                                                    <strong>{item.binding.user_name}</strong>
                                                </span>
                                                <span>
                                                    {gLang('wiki.wikiUserIdLabel')}:{' '}
                                                    <strong>{item.binding.user_id}</strong>
                                                </span>
                                                {item.binding.bound_at && (
                                                    <span>
                                                        {gLang('wiki.boundAtLabel')}:{' '}
                                                        {new Date(
                                                            item.binding.bound_at
                                                        ).toLocaleString('zh-CN')}
                                                    </span>
                                                )}
                                            </Space>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                color: getThemeColor({
                                                    light: '#00000099',
                                                    dark: '#FFFFFF99',
                                                    custom: customPalette
                                                        ? {
                                                              [customTheme as string]:
                                                                  customPalette.textMuted,
                                                          }
                                                        : undefined,
                                                }),
                                            }}
                                        >
                                            <Tag color="default">{gLang('wiki.tagUnbound')}</Tag>
                                        </div>
                                    )}
                                </div>
                            </Space>
                        </div>
                    ))}
                </div>
            )}

            {!allEcidBound && (
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.3s ease-in-out ${0.2 + boundList.length * 0.1}s forwards`,
                        marginTop: '24px',
                    }}
                >
                    <Button
                        type="primary"
                        icon={<KeyOutlined />}
                        size="large"
                        block
                        onClick={() => setIsWikiModalOpen(true)}
                        style={{
                            height: '48px',
                            fontSize: '16px',
                        }}
                    >
                        {gLang('wiki.getBindingCodeButton')}
                    </Button>
                </div>
            )}

            <WikiBindingModal
                isOpen={isWikiModalOpen}
                onClose={() => setIsWikiModalOpen(false)}
                boundEcidList={boundList.map(b => b.ecid)}
            />
        </Wrapper>
    );
};

export default Wiki;
