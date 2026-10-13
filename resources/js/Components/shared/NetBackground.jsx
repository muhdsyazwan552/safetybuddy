import React, { useEffect, useRef } from 'react';

/**
 * 3D animated "network" background (Vanta.js NET style) – no dependencies.
 * Points float in 3D space, are projected with perspective, rotate slowly and
 * follow the mouse / touch. Neighbouring points are joined by fading lines.
 */
export default function NetBackground({
    color = '#F7D31A',
    background = 'transparent',
    points = 110,
    maxDistance = 250,
    className = '',
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        let w = 0;
        let h = 0;
        let dpr = 1;
        let raf = 0;
        let running = true;

        // yaw / pitch follow the pointer smoothly
        const target = { x: 0, y: 0 };
        const view = { x: 0, y: 0 };
        let spin = 0;

        const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));

        // random points inside a box (z gives the depth)
        const depth = 600;
        const nodes = [];
        const build = () => {
            nodes.length = 0;
            const count = window.innerWidth < 640 ? Math.round(points * 0.6) : points;
            for (let i = 0; i < count; i++) {
                nodes.push({
                    x: (Math.random() - 0.5) * 1350,
                    y: (Math.random() - 0.5) * 1100,
                    z: (Math.random() - 0.5) * depth,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    vz: (Math.random() - 0.5) * 0.25,
                });
            }
        };

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const onMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const p = e.touches ? e.touches[0] : e;
            target.x = ((p.clientX - rect.left) / rect.width - 0.5) * 2;
            target.y = ((p.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        const onLeave = () => {
            target.x = 0;
            target.y = 0;
        };

        const project = (n, cosY, sinY, cosX, sinX, focal) => {
            // rotate around Y (yaw) then X (pitch)
            const x1 = n.x * cosY - n.z * sinY;
            const z1 = n.x * sinY + n.z * cosY;
            const y2 = n.y * cosX - z1 * sinX;
            const z2 = n.y * sinX + z1 * cosX;
            const scale = focal / (focal + z2 + depth);
            return { sx: w / 2 + x1 * scale, sy: h / 2 + y2 * scale, scale, z: z2 };
        };

        const frame = () => {
            if (!running) return;
            raf = requestAnimationFrame(frame);

            view.x += (target.x - view.x) * 0.04;
            view.y += (target.y - view.y) * 0.04;
            spin += reduced ? 0 : 0.0012;

            const yaw = spin + view.x * 0.55;
            const pitch = view.y * 0.35;
            const cosY = Math.cos(yaw);
            const sinY = Math.sin(yaw);
            const cosX = Math.cos(pitch);
            const sinX = Math.sin(pitch);
            const focal = Math.max(w, h) * 0.9;

            ctx.clearRect(0, 0, w, h);
            if (background !== 'transparent') {
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, w, h);
            }

            // drift + keep inside the box
            for (const n of nodes) {
                if (!reduced) {
                    n.x += n.vx;
                    n.y += n.vy;
                    n.z += n.vz;
                }
                if (n.x > 675 || n.x < -675) n.vx *= -1;
                if (n.y > 550 || n.y < -550) n.vy *= -1;
                if (n.z > depth / 2 || n.z < -depth / 2) n.vz *= -1;
            }

            const proj = nodes.map((n) => project(n, cosY, sinY, cosX, sinX, focal));

            // lines
            ctx.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dz = nodes[i].z - nodes[j].z;
                    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (d > maxDistance) continue;
                    const a = (1 - d / maxDistance) * 0.55 * Math.min(proj[i].scale, proj[j].scale) * 1.6;
                    ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(a, 0.6).toFixed(3)})`;
                    ctx.beginPath();
                    ctx.moveTo(proj[i].sx, proj[i].sy);
                    ctx.lineTo(proj[j].sx, proj[j].sy);
                    ctx.stroke();
                }
            }

            // points (far ones first so near ones draw on top)
            const order = proj.map((p, i) => i).sort((a, c) => proj[c].z - proj[a].z);
            for (const i of order) {
                const p = proj[i];
                const size = Math.max(1.2, 3.4 * p.scale * 1.5);
                const alpha = Math.min(1, 0.35 + p.scale * 0.9);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const onVisibility = () => {
            running = !document.hidden;
            if (running) frame();
            else cancelAnimationFrame(raf);
        };

        resize();
        build();
        frame();

        const ro = new ResizeObserver(() => { resize(); });
        ro.observe(canvas.parentElement);
        const host = canvas.parentElement;
        host.addEventListener('pointermove', onMove);
        host.addEventListener('pointerleave', onLeave);
        host.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            host.removeEventListener('pointermove', onMove);
            host.removeEventListener('pointerleave', onLeave);
            host.removeEventListener('touchmove', onMove);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [color, background, points, maxDistance]);

    return <canvas ref={canvasRef} className={`absolute inset-0 ${className}`} aria-hidden="true" />;
}
