import { TicketType } from '@ecuc/shared/types/ticket.types';

export interface QuickInsertExtraField {
    name: string;
    labelKey: string;
    placeholderKey?: string;
    required?: boolean;
    autoType?: string;
    lock?: boolean;
}

export interface QuickInsertItem {
    titleKey: string;
    contentKey: string;
    extraFields?: QuickInsertExtraField[];
    noteKey?: string;
    startTime?: string; // YYYY-MM-DD
    endTime?: string; // YYYY-MM-DD
}

export const quickInsertConfig: Partial<Record<TicketType, Record<string, QuickInsertItem>>> = {
    [TicketType.Others]: {
        CPS: {
            titleKey: 'ticketList.quickInsertListTitle.CPS',
            contentKey: 'ticketList.quickInsertList.CPS',
        },
    },
    [TicketType.MediaEvents]: {
        ECNET_LIKE: {
            titleKey: 'ticketList.quickInsertListTitle.ECNET_LIKE',
            contentKey: 'ticketList.quickInsertList.ECNET_LIKE',
            extraFields: [
                {
                    name: 'wechatId',
                    labelKey: 'ticketList.wechatId',
                    placeholderKey: 'ticketList.wechatIdPlaceholder',
                    required: true,
                },
                {
                    name: 'schedule',
                    labelKey: 'ticketList.schedule',
                    placeholderKey: 'ticketList.schedulePlaceholder',
                    required: true,
                },
            ],
        },
        // TEN: {
        //     titleKey: "ticketList.quickInsertListTitle.TEN",
        //     contentKey: "ticketList.quickInsertList.TEN",
        //     extraFields: [
        //         {
        //             name: "xhsId",
        //             labelKey: "ticketList.xhsId",
        //             placeholderKey: "ticketList.xhsIdPlaceholder",
        //             required: true,
        //         },
        //         {
        //             name: "postLink",
        //             labelKey: "ticketList.postLink",
        //             placeholderKey: "ticketList.postLinkPlaceholder",
        //             required: true,
        //         }
        //     ],
        //     noteKey: "ticketList.screenshotNote",
        // },
        ECXHS_POST: {
            titleKey: 'ticketList.quickInsertListTitle.ECXHS_POST',
            contentKey: 'ticketList.quickInsertList.ECXHS_POST',
            extraFields: [
                {
                    name: 'schedule',
                    labelKey: 'ticketList.schedule',
                    placeholderKey: 'ticketList.schedulePlaceholder',
                    required: true,
                },
                {
                    name: 'postLink',
                    labelKey: 'ticketList.postLink',
                    placeholderKey: 'ticketList.postLinkPlaceholder',
                    required: true,
                },
            ],
            noteKey: 'ticketList.screenshotNote',
        },
        // ECPYQJ_POST: {
        //     titleKey: "ticketList.quickInsertListTitle.ECPYQJ_POST",
        //     contentKey: "ticketList.quickInsertList.ECPYQJ_POST",
        //     extraFields: [
        //         {
        //             name: "postLink",
        //             labelKey: "ticketList.postLink",
        //             placeholderKey: "ticketList.postLinkPlaceholder",
        //             required: true,
        //         },
        //         {
        //             name: "targetEcid",
        //             labelKey: "ticketList.targetEcid",
        //             placeholderKey: "ticketList.targetEcidPlaceholder",
        //             required: true,
        //             autoType: "accountMatch",
        //         },
        //     ],
        //     noteKey: "ticketList.screenshotNote",
        // },
        OTHER: {
            titleKey: 'ticketList.quickInsertListTitle.OTHER',
            contentKey: 'ticketList.quickInsertList.OTHER',
        },
        // "8DAY8MAP": {
        //     titleKey: "ticketList.quickInsertListTitle.8DAY8MAP",
        //     contentKey: "ticketList.quickInsertList.8DAY8MAP",
        //     extraFields: [
        //         {
        //             name: "mediaId",
        //             labelKey: "ticketList.mediaId",
        //             placeholderKey: "ticketList.mediaIdPlaceholder",
        //             required: true,
        //             autoType: "mediaID",
        //             lock: true,
        //         },
        //     ],
        //     noteKey: "ticketList.8d8mNote",
        //     startTime: "2025-10-07",
        // },
    },
};

export default quickInsertConfig;
