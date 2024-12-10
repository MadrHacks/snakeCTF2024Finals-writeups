import clsx from "clsx";

export default function Input({
    className,
    label,
    ...props
}) {
    return (<>
        <label
            className={clsx(
                "text-sm font-medium text-white/75",
                "ml-2 -mb-1",
            )}
        >
            {label}
        </label>
        <input
            className={clsx(
                className,
                "py-2 px-4 w-full outline-none focus:border-white/30 backdrop-blur",
                "rounded-xl border-2 border-white/10 bg-white/5 text-sm",
                "transition-colors placeholder:text-white/50",
            )}
            {...props}
        />
    </>);
};