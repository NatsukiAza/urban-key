import { FC } from 'react';

interface IconBuildingProps {
    className?: string;
}

const IconBuilding: FC<IconBuildingProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M3 22H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 22V6C5 4.11438 5 3.17157 5.58579 2.58579C6.17157 2 7.11438 2 9 2H15C16.8856 2 17.8284 2 18.4142 2.58579C19 3.17157 19 4.11438 19 6V22" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 6H15M9 9H15M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 22V19C11 18.5286 11 18.2929 11.1464 18.1464C11.2929 18 11.5286 18 12 18C12.4714 18 12.7071 18 12.8536 18.1464C13 18.2929 13 18.5286 13 19V22" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
};

export default IconBuilding;
