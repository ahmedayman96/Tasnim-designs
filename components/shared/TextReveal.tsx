"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TextRevealProps {
    children: string;
    className?: string;
    as?: "h2" | "h3" | "p" | "span";
    delay?: number;
}

export default function TextReveal({
    children,
    className = "",
    as: Tag = "p",
    delay = 0,
}: TextRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const words = children.split(" ");

    return (
        <div ref={ref}>
            <Tag className={className}>
                {words.map((word, i) => (
                    <motion.span
                        key={i}
                        className="inline-block mr-[0.25em]"
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                        transition={{
                            duration: 0.5,
                            delay: delay + i * 0.04,
                            ease: [0.25, 0.1, 0, 1],
                        }}
                    >
                        {word}
                    </motion.span>
                ))}
            </Tag>
        </div>
    );
}
