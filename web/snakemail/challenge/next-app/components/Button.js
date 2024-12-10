import clsx from "clsx";

export default function Button({
    className,
    children,
    ...props
}) {
    return (<>
        <button
            className={clsx(
                className,
                "py-2 px-4 w-full outline-none focus:border-white/30 backdrop-blur",
                "rounded-xl border-2 border-white/10 bg-white/5",
                "transition-colors hover:bg-white/10 font-medium",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            {...props}
        >
            {children}
        </button>
    </>);
};