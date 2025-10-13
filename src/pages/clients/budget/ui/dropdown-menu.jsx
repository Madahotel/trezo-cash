import React, {
  useState,
  createContext,
  useContext,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// Contexte pour partager l'état du menu
const DropdownContext = createContext();

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("bottom"); // 'bottom' ou 'top'
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    // Fermer avec la touche Échap
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      // Calculer la position optimale
      if (triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const menuHeight = 200; // Hauteur estimée du menu

        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
          setPosition("top");
        } else {
          setPosition("bottom");
        }
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, position, triggerRef }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

const DropdownMenuTrigger = forwardRef(
  ({ children, className = "", asChild = false, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useContext(DropdownContext);

    // Combiner les refs
    const combinedRef = (node) => {
      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      }
      triggerRef.current = node;
    };

    if (asChild) {
      return React.cloneElement(React.Children.only(children), {
        ref: combinedRef,
        onClick: () => setOpen(!open),
        ...props,
      });
    }

    return (
      <button
        ref={combinedRef}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none data-[state=open]:bg-accent ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = forwardRef(
  (
    { children, className = "", sideOffset = 4, align = "start", ...props },
    ref
  ) => {
    const { open, position } = useContext(DropdownContext);
    const contentRef = useRef(null);

    // Combiner les refs
    const combinedRef = (node) => {
      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      }
      contentRef.current = node;
    };

    // Gérer le focus quand le menu s'ouvre
    useEffect(() => {
      if (open && contentRef.current) {
        const firstFocusable = contentRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, [open]);

    const alignmentClasses = {
      start: "left-0",
      center: "left-1/2 transform -translate-x-1/2",
      end: "right-0",
    };

    const positionClasses = {
      bottom: "top-full mt-2",
      top: "bottom-full mb-2",
    };

    const dropdownVariants = {
      hidden: {
        opacity: 0,
        scale: 0.95,
        y: position === "bottom" ? -8 : 8,
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.1,
          ease: "easeOut",
        },
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        y: position === "bottom" ? -8 : 8,
        transition: {
          duration: 0.075,
          ease: "easeIn",
        },
      },
    };

    const slideAnimation = {
      bottom: {
        slideIn: "data-[side=bottom]:slide-in-from-top-2",
        slideOut: "data-[side=bottom]:slide-out-to-top-2",
      },
      top: {
        slideIn: "data-[side=top]:slide-in-from-bottom-2",
        slideOut: "data-[side=top]:slide-out-to-bottom-2",
      },
    };

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={combinedRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className={`
            z-50 max-h-[300px] min-w-[8rem] 
            overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-lg
            absolute ${positionClasses[position]}
            ${alignmentClasses[align]}
            ${slideAnimation[position].slideIn}
            ${slideAnimation[position].slideOut}
            ${className}
          `.trim()}
            style={{
              "--radix-dropdown-menu-content-available-height": "300px",
            }}
            role="menu"
            aria-orientation="vertical"
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = forwardRef(
  ({ className = "", inset, children, onClick, ...props }, ref) => {
    const { setOpen } = useContext(DropdownContext);

    const handleClick = (event) => {
      onClick?.(event);
      setOpen(false);
    };

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        whileHover={{ backgroundColor: "rgb(248 250 252)" }}
        whileTap={{ scale: 0.98 }}
        className={`
        relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm 
        outline-none transition-colors focus:bg-slate-50 focus:text-gray-900 
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50 
        [&>svg]:size-4 [&>svg]:shrink-0 w-full text-left
        ${inset ? "pl-8" : ""}
        ${className}
      `.trim()}
        role="menuitem"
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = forwardRef(
  ({ className = "", ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
      role="separator"
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
