import { createContext, useContext } from 'react';

export const AdminLayoutContext = createContext({
    toggleSidebar: () => {},
});

export function useAdminLayout() {
    return useContext(AdminLayoutContext);
}
