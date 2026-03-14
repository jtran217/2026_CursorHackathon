import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'signal';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  signal: 'btn-signal',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', className = '', type = 'button', children, ...props },
    ref
  ) => {
    const variantClassName = variantClass[variant];
    const combinedClassName = [variantClassName, className].filter(Boolean).join(' ');

    return (
      <button ref={ref} className={combinedClassName} type={type} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
