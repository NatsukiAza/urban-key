import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setBreadcrumbDetalle } from '@/store/themeConfigSlice';

export const useBreadcrumbDetalle = (titulo: string | undefined, padre?: string) => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setBreadcrumbDetalle({ titulo, padre }));
        return () => {
            dispatch(setBreadcrumbDetalle({}));
        };
    }, [dispatch, titulo, padre]);
};
