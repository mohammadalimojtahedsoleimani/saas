"use client"

import { useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

type Status = 'connecting' | 'streaming' | 'done' | 'error';

/* ───────── Inline SVG icons (no icon library needed) ───────── */
const Svg = ({ className, fill, children }: { className?: string; fill?: boolean; children: ReactNode }) => (
    <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        {children}
    </svg>
);

const SparkIcon = ({ className }: { className?: string }) => (
    <Svg fill className={className}><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" /></Svg>
);
const CopyIcon = ({ className }: { className?: string }) => (
    <Svg className={className}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
);
const CheckIcon = ({ className }: { className?: string }) => (
    <Svg className={className}><path d="M20 6 9 17l-5-5" /></Svg>
);
const RefreshIcon = ({ className }: { className?: string }) => (
    <Svg className={className}>
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
    </Svg>
);
const AlertIcon = ({ className }: { className?: string }) => (
    <Svg className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
    </Svg>
);

const STATUS_LABEL: Record<Status, string> = {
    connecting: 'Warming up the generator',
    streaming: 'Writing your idea live',
    done: 'Idea ready',
    error: "Couldn't reach the generator",
};

function Skeleton() {
    const widths = ['55%', '100%', '94%', '98%', '72%'];
    return (
        <div className="fade-in space-y-4 py-2" aria-hidden="true">
            <div className="skeleton !h-7" style={{ width: '48%' }} />
            {widths.map((w, i) => (
                <div key={i} className="skeleton" style={{ width: w }} />
            ))}
        </div>
    );
}

export default function Home() {
    const [idea, setIdea] = useState<string>('');
    const [status, setStatus] = useState<Status>('connecting');
    const [run, setRun] = useState(0); // bump to request a fresh idea
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setIdea('');
        setStatus('connecting');

        const evt = new EventSource('/api');
        let buffer = '';

        evt.onmessage = (e) => {
            buffer += e.data;
            setIdea(buffer);
            setStatus('streaming');
        };
        // The server closing the stream also lands here, so text received = finished.
        evt.onerror = () => {
            evt.close();
            if (!buffer) console.error('SSE error before any data arrived');
            setStatus(buffer ? 'done' : 'error');
        };

        return () => { evt.close(); };
    }, [run]);

    const live = status === 'connecting' || status === 'streaming';
    const words = idea.trim() ? idea.trim().split(/\s+/).length : 0;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(idea);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard unavailable – ignore */
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-paper text-ink">
            <div className="dot-grid" aria-hidden="true" />

            <div className="relative mx-auto max-w-3xl px-5 py-14 sm:py-20">
                {/* Header */}
                <header className="mb-12 flex flex-col items-center text-center">
                    <div className="spark-mark mb-7">
                        <SparkIcon />
                    </div>
                    <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                        Business Idea Generator
                    </h1>
                    <p className="mt-3 max-w-md text-lg text-muted">
                        A fresh venture concept, written out live as it's generated.
                    </p>
                </header>

                {/* Sheet */}
                <article className={`sheet ${live ? 'is-live' : ''}`} aria-busy={live}>
                    <div className="stream-bar" aria-hidden="true" />

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 pl-7 pr-5 sm:pl-9">
                        <span className="pill" data-state={status} role="status">
                            {status === 'done' ? (
                                <CheckIcon className="text-base" />
                            ) : status === 'error' ? (
                                <AlertIcon className="text-base" />
                            ) : (
                                <span className="dot" />
                            )}
                            {STATUS_LABEL[status]}
                        </span>

                        <div className="flex items-center gap-2">
                            {words > 0 && (
                                <span className="mr-1 hidden text-sm tabular-nums text-muted sm:inline">
                                    {words} words
                                </span>
                            )}
                            <button className="btn" onClick={copy} disabled={!idea}>
                                {copied ? <CheckIcon /> : <CopyIcon />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button className="btn btn-primary" onClick={() => setRun((n) => n + 1)} disabled={live}>
                                <RefreshIcon className="turn" />
                                {status === 'error' ? 'Try again' : 'New idea'}
                            </button>
                        </div>
                    </div>

                    <div className="px-7 py-9 sm:px-11 sm:py-11">
                        {status === 'error' ? (
                            <div className="fade-in flex flex-col items-center gap-3 py-8 text-center">
                                <AlertIcon className="text-4xl text-saffron" />
                                <p className="font-display text-xl font-bold">The idea stream didn't start</p>
                                <p className="max-w-sm text-muted">
                                    Check that your <code>/api</code> route is running, then try again.
                                </p>
                            </div>
                        ) : !idea ? (
                            <Skeleton />
                        ) : (
                            <div className="markdown-content">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={{
                                        a: ({ node, ...props }) => (
                                            <a {...props} target="_blank" rel="noopener noreferrer" />
                                        ),
                                    }}
                                >
                                    {idea}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </article>
            </div>
        </main>
    );
}