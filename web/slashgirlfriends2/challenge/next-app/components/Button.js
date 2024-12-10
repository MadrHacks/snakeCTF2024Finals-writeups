export default function Button({
    className,
    ...props
}) {
    return (<>
        <button
            className={`py-2 px-4 text-secondary bg-primary/20 rounded-md ${className}`}
            {...props}
        />
    </>);
}