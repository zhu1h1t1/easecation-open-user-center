import OSS from 'ali-oss';
import { message, Upload } from 'antd';
import type { UploadProps } from 'antd';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import { gLang } from '../language';
import { BACKEND_DOMAIN } from '../global';
import { convertUTCToFormat } from '../components/TimeConverter';

export const useUploadProps = (
    maxCount: number,
    uploadedFiles: string[],
    setUploadedFiles: (newFileName: string[]) => void,
    setIsUploading?: (uploading: boolean) => void
) => {
    const [messageApi, contextHolder] = message.useMessage();

    const uploadProps = getUploadProps(
        maxCount,
        uploadedFiles,
        setUploadedFiles,
        messageApi,
        setIsUploading
    );

    return {
        uploadProps,
        contextHolder,
    };
};

export const getUploadProps = (
    maxCount: number,
    uploadedFiles: string[],
    setUploadedFiles: (newFileName: string[]) => void,
    messageApi: any,
    setIsUploading?: (uploading: boolean) => void
): UploadProps => ({
    name: 'file',
    maxCount: maxCount,
    // 仅允许上传视频、图片和PDF格式
    accept: '.mp4,.mov,.webm,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf',
    customRequest: (options: UploadRequestOption<any>) => {
        const { onSuccess, onProgress, file } = options;
        // 模拟上传过程
        setTimeout(() => {
            if (onProgress) {
                onProgress({ percent: 100 });
            }
            if (onSuccess) {
                onSuccess('ok', file);
            }
        }, 0);
    },
    beforeUpload: async file => {
        // 检查文件类型
        const allowedExtensions = [
            '.mp4',
            '.mov',
            '.webm',
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.bmp',
            '.webp',
            '.svg',
            '.pdf',
        ];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            messageApi.error(gLang('files.unsupportedFormat'));
            return Upload.LIST_IGNORE;
        }

        // 检查文件名是否包含#符号
        if (file.name.includes('#')) {
            messageApi.error(gLang('files.noHashSymbol'));
            return Upload.LIST_IGNORE;
        }

        // 设置上传状态为true
        if (setIsUploading) {
            setIsUploading(true);
        }

        // 显示上传中的消息，不自动关闭
        const loadingKey = `uploading_${file.name}`;
        messageApi.loading({
            content: gLang('files.uploading', { name: file.name }),
            key: loadingKey,
            duration: 0,
        });

        // 检测是否已经上传了超过 maxCount 个文件
        if (uploadedFiles.length >= maxCount) {
            messageApi.error({
                content: gLang('files.limitExceeded'),
                key: loadingKey,
            });
            // 设置上传状态为false
            if (setIsUploading) {
                setIsUploading(false);
            }
            return Upload.LIST_IGNORE;
        }
        const fileNameNew = fileNameModifier(file.name);
        const success = await beforeUpload(file, fileNameNew, messageApi, loadingKey);

        // 设置上传状态为false
        if (setIsUploading) {
            setIsUploading(false);
        }

        if (success) {
            // 文件处理逻辑：将新生成的文件名添加到 uploadedFiles 数组中
            setUploadedFiles([...uploadedFiles, 'user-center-upload/' + fileNameNew]);
            return true;
        } else {
            // 阻止文件上传
            return Upload.LIST_IGNORE;
        }
    },
    onRemove: file => {
        // 清空所有 uploadedFiles 数据
        const files = uploadedFiles.filter(uploadFile => {
            const underscoreIndex = uploadFile.indexOf('_');
            const fileNameAfterUnderscore = uploadFile.substring(underscoreIndex + 1);
            // 如果有任意一个fileList元素的name相等就保存 否则移除
            return fileNameAfterUnderscore !== file.name;
        });
        setUploadedFiles(files);
    },
});

// 修改 beforeUpload 的导出签名，messageApi 设为可选，兼容旧用法
export const beforeUpload = async (
    file: File,
    newFileName: string,
    messageApi?: any,
    loadingKey?: string
): Promise<boolean> => {
    const isSizeValid = file.size / 1024 / 1024 < 100; // 限制为 100MB
    if (!isSizeValid) {
        messageApi.error(gLang('files.moreThan100MB'));
        return false;
    }

    try {
        const response = await fetch(BACKEND_DOMAIN + '/callback/sts');
        const data = await response.json();
        const client = new OSS({
            region: 'oss-cn-hangzhou',
            accessKeyId: data.AccessKeyId,
            accessKeySecret: data.AccessKeySecret,
            stsToken: data.SecurityToken,
            bucket: 'ec-user-center',
        });
        await client.multipartUpload(`user-center-upload/${newFileName}`, file, {
            progress: (percentage: number) => {
                // 更新上传进度消息
                if (loadingKey) {
                    messageApi.loading({
                        content: gLang('files.uploadingProgress', {
                            name: file.name,
                            percent: Math.round(percentage * 100),
                        }),
                        key: loadingKey,
                        duration: 0,
                    });
                }
            },
        });
        if (loadingKey) {
            messageApi.success({
                content: `${file.name} ${gLang('files.success')}`,
                key: loadingKey,
                duration: 2,
            });
        } else {
            messageApi.success(`${file.name} ${gLang('files.success')}`);
        }
        return true; // 上传成功
    } catch {
        if (loadingKey) {
            messageApi.error({
                content: `${file.name} ${gLang('files.failed')}`,
                key: loadingKey,
                duration: 3,
            });
        } else {
            messageApi.error(`${file.name} ${gLang('files.failed')}`);
        }
        return false;
    }
};

const fileNameModifier = (originalName: string) => {
    const currentDate = new Date();
    const formattedTime = convertUTCToFormat(currentDate, 'YYYYMMDDHHmmss');
    const newFileName = `${formattedTime}_${originalName}`;
    return newFileName;
};

interface STSResponse {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
}

async function getSTS(): Promise<STSResponse> {
    const response = await fetch(BACKEND_DOMAIN + '/callback/sts');
    if (!response.ok) {
        throw new Error('Failed to fetch STS credentials');
    }
    return response.json();
}

export async function generateTemporaryUrl(fileUrl: string): Promise<string> {
    // Parse the OSS bucket name and object key from the file URL
    const url = new URL(fileUrl);
    const bucketName = url.hostname.split('.')[0];
    const objectKey = decodeURIComponent(url.pathname.substring(1));

    // Get STS credentials
    const sts = await getSTS();

    // Create OSS client with temporary credentials
    const client = new OSS({
        region: 'oss-cn-hangzhou', // e.g., 'oss-us-west-1'
        accessKeyId: sts.AccessKeyId,
        accessKeySecret: sts.AccessKeySecret,
        stsToken: sts.SecurityToken,
        bucket: bucketName,
    });

    // Generate a signed URL valid for 1 hour
    const signedUrl = client.signatureUrl(objectKey, { expires: 3600 });
    return signedUrl;
}
