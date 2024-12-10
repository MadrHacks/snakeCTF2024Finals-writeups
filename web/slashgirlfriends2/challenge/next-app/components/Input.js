export default function Input({
    className,
    ...props
}) {
    return (<>
        <input
            className={`placeholder:text-white/50 px-4 py-2 outline-none flex-grow border-2 border-primary/20 bg-white/10 rounded-lg md:mt-0 mt-4 relative ${className}`}
            {...props}
        />
    </>);
}