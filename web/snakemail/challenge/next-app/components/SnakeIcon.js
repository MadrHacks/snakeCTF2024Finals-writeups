import * as React from "react"

function SnakeIcon(props) {
    if (props.crossed) {
        return (
            <svg
                id="Livello_1"
                data-name="Livello 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 423.33 329.47"
                fill="currentColor"
                {...props}
            >
                <path
                    d="M317.5 6.01c-58.21 0-105.83 47.41-105.83 105.83v64.93l92.44 92.44c8.52-15.26 13.39-32.83 13.39-51.54V111.84h105.83c0-58.21-47.41-105.83-105.83-105.83zm36.89 38.84c-.73 4.37-4.26 7.9-8.63 8.63-7.21 1.21-13.44-5.02-12.23-12.23.73-4.37 4.26-7.9 8.63-8.63 7.21-1.21 13.44 5.02 12.23 12.23zM113.96 112.16c-2.68-.21-5.39-.32-8.12-.32C47.62 111.84 0 159.26 0 217.68v105.83c58.47 0 105.83-47.41 105.83-105.83 0 58.21 47.62 105.83 105.83 105.83 31.22 0 59.26-13.53 78.62-35.02L113.96 112.16z"
                />
                <path
                    transform="rotate(-45 219.175 164.735)"
                    fill="currentColor"
                    strokeWidth={0}
                    d="M204.25 -53.31H234.1V382.78H204.25z"
                />
            </svg>
        );
    }

    return (
        <svg
            data-name="Livello 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 423.33 317.5"
            fill="currentColor"
            {...props}
        >
            <path
                d="M317.5 0c-58.21 0-105.83 47.41-105.83 105.83v105.83c0-58.21-47.62-105.83-105.83-105.83S0 153.25 0 211.67V317.5c58.47 0 105.83-47.41 105.83-105.83 0 58.21 47.63 105.83 105.83 105.83s105.83-47.41 105.83-105.83V105.84h105.83C423.32 47.63 375.91.01 317.49.01zm28.26 47.47c-7.21 1.21-13.44-5.02-12.23-12.23.73-4.37 4.26-7.9 8.63-8.63 7.21-1.21 13.44 5.02 12.23 12.23-.73 4.37-4.26 7.9-8.63 8.63z"
                strokeWidth={0}
            />
        </svg>
    );
};

export default SnakeIcon;