// Minecraft 3D Player Model Component
// Usage: Render a 3D Minecraft player model with animations
import React, { useEffect, useRef, useState } from 'react';

type Position = 'bottom-left' | 'bottom-center' | 'bottom-right' | 'left-peek' | 'right-peek';
type AnimationType =
    | 'wave'
    | 'walk'
    | 'run'
    | 'idle'
    | 'nod'
    | 'shake-head'
    | 'sit'
    | 'sit-wave'
    | 'sit-idle'
    | 'hit'
    | 'crouch';
type WaveArm = 'left' | 'right';

interface MinecraftPlayer3DProps {
    skinData: string;
    width?: number;
    height?: number;
    animation?: AnimationType;
    waveArm?: WaveArm;
    position?: Position;
    rotate?: boolean;
    rotateSpeed?: number;
    background?: string;
    className?: string;
    interactive?: boolean;
    tiltAngle?: number;
    autoMove?: boolean;
    moveSpeed?: number;
}

const MinecraftPlayer3D: React.FC<MinecraftPlayer3DProps> = ({
    skinData,
    width = 200,
    height = 280,
    animation = 'wave',
    waveArm = 'left',
    position = 'bottom-left',
    rotate = true,
    rotateSpeed = 0.5,
    background = 'transparent',
    className = '',
    interactive = false,
    tiltAngle = 0,
    autoMove = false,
    moveSpeed = 2,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentAnimation, setCurrentAnimation] = useState<AnimationType>(animation);
    const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const positionRef = useRef<{ x: number; y: number; vx: number; vy: number }>({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
    });
    const isDraggingRef = useRef<boolean>(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const elementStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isTouchDraggingRef = useRef<boolean>(false);
    const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const touchElementStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        setCurrentAnimation(animation);
    }, [animation]);

    useEffect(() => {
        if (!canvasRef.current || !skinData) {
            return;
        }

        import('skinview3d')
            .then(skinview3d => {
                try {
                    const viewer = new skinview3d.SkinViewer({
                        canvas: canvasRef.current as HTMLCanvasElement,
                        width: width,
                        height: height,
                        skin: skinData.startsWith('data:')
                            ? skinData
                            : `data:image/png;base64,${skinData}`,
                    });

                    viewerRef.current = viewer;

                    if (background === 'transparent') {
                        viewer.background = null;
                    } else {
                        viewer.background = background;
                    }

                    viewer.camera.position.set(0, 0, 60);
                    viewer.controls.enableRotate = false;
                    viewer.controls.enableZoom = false;
                    viewer.controls.enablePan = false;
                    viewer.autoRotate = false;

                    if (tiltAngle !== 0) {
                        setTimeout(() => {
                            if (viewerRef.current && viewerRef.current.playerObject) {
                                const tiltRadians = (-tiltAngle * Math.PI) / 180;
                                viewerRef.current.playerObject.rotation.z = tiltRadians;
                            }
                        }, 300);
                    }

                    const currentWaveArm = waveArm;
                    const setAnimation = (animType: AnimationType) => {
                        try {
                            if (
                                viewer.playerObject &&
                                viewer.playerObject.skin &&
                                viewer.playerObject.skin.head
                            ) {
                                viewer.playerObject.skin.head.rotation.x = 0;
                                viewer.playerObject.skin.head.rotation.y = 0;
                            }

                            viewer.autoRotate = false;

                            let anim: any = null;

                            switch (animType) {
                                case 'wave':
                                    if (skinview3d.WaveAnimation) {
                                        const armToWave =
                                            currentWaveArm || (viewer as any).waveArm || 'left';
                                        anim = new skinview3d.WaveAnimation(armToWave);
                                        anim.speed = 1;
                                        anim.paused = false;
                                    }
                                    break;
                                case 'walk':
                                    if (skinview3d.WalkingAnimation) {
                                        anim = new skinview3d.WalkingAnimation();
                                        anim.speed = 1;
                                        anim.paused = false;
                                    }
                                    break;
                                case 'run':
                                    if (skinview3d.RunningAnimation) {
                                        anim = new skinview3d.RunningAnimation();
                                        anim.speed = 1;
                                        anim.paused = false;
                                    }
                                    break;
                                case 'nod':
                                    if (skinview3d.FunctionAnimation && viewer.playerObject) {
                                        anim = new skinview3d.FunctionAnimation(
                                            (player, progress) => {
                                                if (player.skin && player.skin.head) {
                                                    player.skin.head.rotation.x =
                                                        Math.sin(progress * 4) * 0.3;
                                                }
                                            }
                                        );
                                        anim.speed = 1;
                                        anim.paused = false;
                                    } else if (
                                        viewer.playerObject &&
                                        viewer.playerObject.skin &&
                                        viewer.playerObject.skin.head
                                    ) {
                                        anim = null;
                                        viewer.playerObject.skin.head.rotation.x = -0.5;
                                        setTimeout(() => {
                                            if (
                                                viewerRef.current &&
                                                viewerRef.current.playerObject &&
                                                viewerRef.current.playerObject.skin &&
                                                viewerRef.current.playerObject.skin.head
                                            ) {
                                                viewerRef.current.playerObject.skin.head.rotation.x = 0;
                                            }
                                        }, 300);
                                    }
                                    break;
                                case 'shake-head':
                                    if (skinview3d.FunctionAnimation && viewer.playerObject) {
                                        anim = new skinview3d.FunctionAnimation(
                                            (player, progress) => {
                                                if (player.skin && player.skin.head) {
                                                    player.skin.head.rotation.y =
                                                        Math.sin(progress * 8) * 0.4;
                                                }
                                            }
                                        );
                                        anim.speed = 1;
                                        anim.paused = false;
                                    } else if (
                                        viewer.playerObject &&
                                        viewer.playerObject.skin &&
                                        viewer.playerObject.skin.head
                                    ) {
                                        anim = null;
                                        let shakeCount = 0;
                                        const shakeInterval = setInterval(() => {
                                            if (
                                                viewerRef.current &&
                                                viewerRef.current.playerObject &&
                                                viewerRef.current.playerObject.skin &&
                                                viewerRef.current.playerObject.skin.head &&
                                                shakeCount < 3
                                            ) {
                                                viewerRef.current.playerObject.skin.head.rotation.y =
                                                    shakeCount % 2 === 0 ? 0.5 : -0.5;
                                                shakeCount++;
                                            } else {
                                                clearInterval(shakeInterval);
                                                if (
                                                    viewerRef.current &&
                                                    viewerRef.current.playerObject &&
                                                    viewerRef.current.playerObject.skin &&
                                                    viewerRef.current.playerObject.skin.head
                                                ) {
                                                    viewerRef.current.playerObject.skin.head.rotation.y = 0;
                                                }
                                            }
                                        }, 150);
                                    }
                                    break;
                                case 'idle':
                                    if (skinview3d.IdleAnimation) {
                                        anim = new skinview3d.IdleAnimation();
                                        anim.speed = 1;
                                        anim.paused = false;
                                    }
                                    break;
                                case 'sit':
                                case 'crouch':
                                    if (skinview3d.CrouchAnimation) {
                                        anim = new skinview3d.CrouchAnimation();
                                        anim.speed = 1;
                                        anim.paused = false;
                                        anim.progress = 1;
                                    }
                                    break;
                                case 'sit-wave':
                                    if (skinview3d.CrouchAnimation && skinview3d.WaveAnimation) {
                                        const crouchAnim = new skinview3d.CrouchAnimation();
                                        crouchAnim.speed = 1;
                                        crouchAnim.paused = false;
                                        crouchAnim.progress = 1;

                                        const armToWave =
                                            currentWaveArm || (viewer as any).waveArm || 'right';
                                        const waveAnim = new skinview3d.WaveAnimation(armToWave);
                                        waveAnim.speed = 1;
                                        waveAnim.paused = false;

                                        if (skinview3d.FunctionAnimation) {
                                            anim = new skinview3d.FunctionAnimation(
                                                (player, delta) => {
                                                    crouchAnim.update(player, delta);
                                                    waveAnim.update(player, delta);
                                                }
                                            );
                                            anim.speed = 1;
                                            anim.paused = false;
                                        } else {
                                            anim = crouchAnim;
                                        }
                                    }
                                    break;
                                case 'sit-idle':
                                    if (
                                        skinview3d.CrouchAnimation &&
                                        skinview3d.IdleAnimation &&
                                        skinview3d.FunctionAnimation
                                    ) {
                                        const crouchAnim = new skinview3d.CrouchAnimation();
                                        crouchAnim.speed = 1;
                                        crouchAnim.paused = false;
                                        crouchAnim.progress = 1;

                                        const idleAnim = new skinview3d.IdleAnimation();
                                        idleAnim.speed = 0.5;
                                        idleAnim.paused = false;

                                        anim = new skinview3d.FunctionAnimation((player, delta) => {
                                            crouchAnim.update(player, delta);
                                            idleAnim.update(player, delta);
                                        });
                                        anim.speed = 1;
                                        anim.paused = false;
                                    } else if (skinview3d.CrouchAnimation) {
                                        anim = new skinview3d.CrouchAnimation();
                                        anim.speed = 1;
                                        anim.paused = false;
                                        anim.progress = 1;
                                    }
                                    break;
                                case 'hit':
                                    if (skinview3d.HitAnimation) {
                                        anim = new skinview3d.HitAnimation();
                                        anim.speed = 1;
                                        anim.paused = false;
                                    }
                                    break;
                                default:
                                    anim = null;
                                    break;
                            }

                            if (anim) {
                                viewer.animation = anim;
                            } else {
                                viewer.animation = null;
                            }
                        } catch {
                            // Ignore animation errors
                        }
                    };

                    (viewer as any).setAnimation = setAnimation;
                    (viewer as any).waveArm = waveArm;

                    setTimeout(() => {
                        if (viewerRef.current) {
                            setAnimation(currentAnimation);
                        }
                    }, 200);
                } catch {
                    setError('Failed to initialize 3D viewer');
                }
            })
            .catch(() => {
                setError('Failed to load 3D viewer library');
            });

        return () => {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current);
                moveIntervalRef.current = null;
            }
            if (viewerRef.current) {
                try {
                    viewerRef.current.animation = null;
                    viewerRef.current.dispose();
                } catch {
                    // Ignore dispose errors
                }
                viewerRef.current = null;
            }
        };
    }, [skinData, width, height, rotate, rotateSpeed, background, waveArm, tiltAngle, interactive]);

    useEffect(() => {
        if (viewerRef.current && (viewerRef.current as any).setAnimation) {
            (viewerRef.current as any).waveArm = waveArm;
            (viewerRef.current as any).setAnimation(currentAnimation);
        }
    }, [currentAnimation, waveArm]);

    const isInCenter50Percent = (clientX: number, clientY: number, rect: DOMRect): boolean => {
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        const centerLeft = rect.width * 0.25;
        const centerRight = rect.width * 0.75;
        const centerTop = rect.height * 0.25;
        const centerBottom = rect.height * 0.75;

        return (
            relativeX >= centerLeft &&
            relativeX <= centerRight &&
            relativeY >= centerTop &&
            relativeY <= centerBottom
        );
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!interactive || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        if (!isInCenter50Percent(e.clientX, e.clientY, rect)) {
            return;
        }

        e.preventDefault();
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        elementStartRef.current = { x: rect.left, y: rect.top };

        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!interactive || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        if (!isInCenter50Percent(touch.clientX, touch.clientY, rect)) {
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        isTouchDraggingRef.current = true;
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        touchElementStartRef.current = { x: rect.left, y: rect.top };

        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
    };

    useEffect(() => {
        if (!interactive) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;

            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;

            const newX = elementStartRef.current.x + deltaX;
            const newY = elementStartRef.current.y + deltaY;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const constrainedX = Math.max(0, Math.min(viewportWidth - width, newX));
            const constrainedY = Math.max(0, Math.min(viewportHeight - height, newY));

            containerRef.current.style.left = `${constrainedX}px`;
            containerRef.current.style.top = `${constrainedY}px`;
            containerRef.current.style.bottom = 'auto';

            positionRef.current.x = constrainedX;
            positionRef.current.y = constrainedY;
        };

        const handleMouseUp = () => {
            if (!isDraggingRef.current) return;

            isDraggingRef.current = false;

            if (autoMove && !moveIntervalRef.current) {
                const event = new CustomEvent('resumeAutoMove');
                window.dispatchEvent(event);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isTouchDraggingRef.current || !containerRef.current) return;

            e.preventDefault();

            const deltaX = e.touches[0].clientX - touchStartRef.current.x;
            const deltaY = e.touches[0].clientY - touchStartRef.current.y;

            const newX = touchElementStartRef.current.x + deltaX;
            const newY = touchElementStartRef.current.y + deltaY;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const constrainedX = Math.max(0, Math.min(viewportWidth - width, newX));
            const constrainedY = Math.max(0, Math.min(viewportHeight - height, newY));

            containerRef.current.style.left = `${constrainedX}px`;
            containerRef.current.style.top = `${constrainedY}px`;
            containerRef.current.style.bottom = 'auto';

            positionRef.current.x = constrainedX;
            positionRef.current.y = constrainedY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isTouchDraggingRef.current) return;

            e.preventDefault();

            isTouchDraggingRef.current = false;

            if (autoMove && !moveIntervalRef.current) {
                const event = new CustomEvent('resumeAutoMove');
                window.dispatchEvent(event);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [interactive, autoMove, width, height]);

    useEffect(() => {
        if (!autoMove || !containerRef.current) return;

        const initRandomMovement = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const startX = Math.random() * (viewportWidth - width);
            const startY = Math.random() * (viewportHeight - height);

            positionRef.current = {
                x: startX,
                y: startY,
                vx: (Math.random() - 0.5) * moveSpeed * 2,
                vy: (Math.random() - 0.5) * moveSpeed * 2,
            };

            if (containerRef.current) {
                containerRef.current.style.left = `${startX}px`;
                containerRef.current.style.top = `${startY}px`;
                containerRef.current.style.bottom = 'auto';
                containerRef.current.style.right = 'auto';
            }
        };

        initRandomMovement();

        moveIntervalRef.current = setInterval(() => {
            if (!containerRef.current) return;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modelWidth = width;
            const modelHeight = height;

            positionRef.current.x += positionRef.current.vx;
            positionRef.current.y += positionRef.current.vy;

            if (positionRef.current.x <= 0 || positionRef.current.x >= viewportWidth - modelWidth) {
                positionRef.current.vx = -positionRef.current.vx;
                positionRef.current.x = Math.max(
                    0,
                    Math.min(viewportWidth - modelWidth, positionRef.current.x)
                );
            }
            if (
                positionRef.current.y <= 0 ||
                positionRef.current.y >= viewportHeight - modelHeight
            ) {
                positionRef.current.vy = -positionRef.current.vy;
                positionRef.current.y = Math.max(
                    0,
                    Math.min(viewportHeight - modelHeight, positionRef.current.y)
                );
            }

            if (Math.random() < 0.02) {
                positionRef.current.vx = (Math.random() - 0.5) * moveSpeed * 2;
                positionRef.current.vy = (Math.random() - 0.5) * moveSpeed * 2;
            }

            if (containerRef.current) {
                containerRef.current.style.left = `${positionRef.current.x}px`;
                containerRef.current.style.top = `${positionRef.current.y}px`;
                containerRef.current.style.bottom = 'auto';
                containerRef.current.style.right = 'auto';
                containerRef.current.style.transform = 'none';
            }
        }, 16);

        return () => {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current);
                moveIntervalRef.current = null;
            }
        };
    }, [autoMove, width, height, moveSpeed]);

    const getPositionStyles = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 10,
            pointerEvents: interactive ? 'auto' : 'none',
            cursor: interactive ? 'grab' : 'default',
        };

        if (autoMove) {
            return baseStyle;
        }

        baseStyle.bottom = 0;

        switch (position) {
            case 'bottom-left':
                return { ...baseStyle, left: 0 };
            case 'bottom-center':
                return { ...baseStyle, left: '50%', transform: 'translateX(-50%)' };
            case 'bottom-right':
                return { ...baseStyle, right: 0 };
            case 'left-peek': {
                const leftPeekTransform =
                    tiltAngle !== 0 ? `scale(1.1) rotateZ(${tiltAngle}deg)` : 'scale(1.1)';
                return {
                    ...baseStyle,
                    left: '-100px',
                    bottom: '100px',
                    transform: leftPeekTransform,
                };
            }
            case 'right-peek':
                return { ...baseStyle, right: '-80px', bottom: '20px' };
            default:
                return baseStyle;
        }
    };

    if (!skinData) {
        return null;
    }

    if (error) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={className}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            data-draggable-model={interactive ? 'true' : undefined}
            style={{
                ...getPositionStyles(),
                width: `${width}px`,
                height: `${height}px`,
                userSelect: interactive ? 'none' : 'auto',
                touchAction: interactive ? 'none' : 'auto',
            }}
        >
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
    );
};

export default MinecraftPlayer3D;
