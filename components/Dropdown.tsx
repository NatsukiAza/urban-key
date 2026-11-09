'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

const Dropdown = (props : any, forwardedRef: any) => {
    const [visibility, setVisibility] = useState<any>(false);

    const referenceRef = useRef<any>(null);
    const popperRef = useRef<any>(null);
    const [referenceEl, setReferenceEl] = useState<HTMLButtonElement | null>(null);
    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);

    const { styles, attributes } = usePopper(referenceEl, popperEl, {
        placement: props.placement || 'bottom-end',
        strategy: props.fijo ? 'fixed' : 'absolute',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: props.offset || [(0)],
                },
            },
        ],
    });

    const handleDocumentClick = (event: any) => {
        if (referenceRef.current?.contains(event.target) || popperRef.current?.contains(event.target)) {
            return;
        }

        setVisibility(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    const menu = (
        <div
            ref={(el) => {
                popperRef.current = el;
                setPopperEl(el);
            }}
            style={styles.popper}
            {...attributes.popper}
            className="z-50"
            onClick={() => setVisibility(!visibility)}
        >
            {visibility && props.children}
        </div>
    );

    return (
        <>
            <button
                ref={(el) => {
                    referenceRef.current = el;
                    setReferenceEl(el);
                }}
                type="button"
                className={props.btnClassName}
                aria-label={props['aria-label']}
                title={props.title}
                onClick={() => setVisibility(!visibility)}
            >
                {props.button}
            </button>

            {/* Con fijo se monta en body al abrirse: un ancestro con transform u overflow lo recortaría. */}
            {props.fijo ? visibility && createPortal(menu, document.body) : menu}
        </>
    );
};

export default forwardRef(Dropdown);
