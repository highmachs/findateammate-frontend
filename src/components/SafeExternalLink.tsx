import React from "react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface SafeExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
}

/**
 * A secure wrapper for external links provided by users.
 * Enforces security best practices to prevent phishing and tab-nabbing.
 */
export function SafeExternalLink({ href, children, className, ...props }: SafeExternalLinkProps) {
    // Defensive check: handle empty or invalid URLs gracefully
    if (!href || href === "#") {
        return <span className={cn("cursor-not-allowed opacity-50", className)}>{children}</span>;
    }

    // Ensure user URLs never use javascript: or other unsafe protocols
    // (Schema validation should catch this, but defense-in-depth is better)
    const isUnsafe = href.toLowerCase().startsWith("javascript:") ||
        href.toLowerCase().startsWith("data:");

    if (isUnsafe) {
        logger.warn(`Blocked unsafe URL: ${href}`);
        return <span className={cn("text-destructive cursor-not-allowed", className)}>{children}</span>;
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("transition-colors", className)}
            {...props}
        >
            {children}
        </a>
    );
}
