import { toast as hotToast } from "react-hot-toast"
import React from "react";

type ToastOptions = {
    title?: string;
    description?: React.ReactNode;
    variant?: 'default' | 'destructive';
}

const toast = (options: ToastOptions | string | React.ReactNode) => {
    if (typeof options === 'string' || React.isValidElement(options)) {
        // This will handle simple string toasts or direct JSX elements
        if (typeof options === 'string') {
             hotToast(options);
        } else {
             hotToast.custom((t) => (<div>{options}</div>));
        }
        return;
    }
    
    const { title, description, variant } = options;
    const message = (
        <div>
            {title && <p className="font-bold">{title}</p>}
            {description}
        </div>
    );

    if (variant === 'destructive') {
        hotToast.error(message);
    } else {
        hotToast.success(message);
    }
}

const useToast = () => {
  return { toast }
}

export { useToast, toast }
