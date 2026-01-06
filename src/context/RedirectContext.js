import { createNavigationContainerRef } from "@react-navigation/native";
import { createContext, useContext } from "react";

export const redirectContextNavigationRef = createNavigationContainerRef();

export const RedirectContext = createContext({
    replace:  (screen) => {},
    navigate: (screen) => {},
    push:     (screen) => {}
});

export const RedirectProvider = ({ children }) => {

    const replace = (screen, params) => {
        if (screen && redirectContextNavigationRef.isReady()) {
            redirectContextNavigationRef.reset({
                index: 0,
                routes: [{ name: screen, params }],
            });
        }
    };

    const navigate = (screen, params) => {
        if (screen && redirectContextNavigationRef.isReady()) {
            redirectContextNavigationRef.navigate(screen, params)
        }
    }

    const push = (screen, params) => {
        if (screen && redirectContextNavigationRef.isReady()) {
            redirectContextNavigationRef.push(screen, params)
        }
    }

    return (
        <RedirectContext.Provider value={{ replace, navigate, push }}>
            {children}
        </RedirectContext.Provider>
    );
};

export const useRedirect = () => useContext(RedirectContext)