export function getDistance(touches: TouchList): number {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
    );
}

export function getMidpoint(touches: TouchList): { clientX: number; clientY: number } {
    const [touch1, touch2] = [touches[0], touches[1]];
    return {
        clientX: (touch1.clientX + touch2.clientX) / 2,
        clientY: (touch1.clientY + touch2.clientY) / 2
    };
}
