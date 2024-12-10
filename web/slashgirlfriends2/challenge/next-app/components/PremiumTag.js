import * as React from "react"

function PremiumTag(props) {
    return (
        <div
            className={props.className || "inline-flex text-white bg-primary rounded-full px-4 py-2 items-center justify-center"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-2 w-4 h-4"
            >
                <path d="M3 19l1 3h16l1-3H3zm21-7.496c0 1.651-.669 3.586-2.15 5.496H18.2c1.869-2.59 3.209-6.926 2.082-9.934 1.812 0 3.718 1.622 3.718 4.438zm-5.404-3.103C17.908 4.899 13 5.062 13 8.719V17h2.531c2.094-1.846 3.577-5.985 3.065-8.599zM3.718 7.066C2.591 10.074 3.931 14.41 5.8 17H2.15C.669 15.09 0 13.155 0 11.504c0-2.816 1.906-4.438 3.718-4.438zM8.469 17H11V8.719c0-3.656-4.908-3.82-5.596-.318-.512 2.614.971 6.753 3.065 8.599zM14 4a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>

            <span className="text-sm font-semibold">
                Premium
            </span>
        </div>
    )
}

export default PremiumTag;